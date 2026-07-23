import os
import shutil
import tempfile
import subprocess
import asyncio
import concurrent.futures
from datetime import datetime, timezone
from database import SessionLocal
import models
from scanners.hygiene import scan_hygiene
from scanners.trufflehog import scan_secrets

# We will implement scan_smells in scanners/semgrep.py in Phase 4
try:
    from scanners.semgrep import scan_smells
except ImportError:
    def scan_smells(repo_path: str, repo_name: str) -> list:
        return []

# We will implement synthesize_report in scanners/ai_synthesizer.py in Phase 5
try:
    from scanners.ai_synthesizer import synthesize_report
except ImportError:
    def synthesize_report(findings: list) -> tuple:
        # Fallback scorer and summary placeholder
        score = 100 - min(50, len(findings) * 5)
        return score, '{"fallback": true, "message": "AI Synthesis Layer not yet active"}'

def clone_repo(repo_url: str, dest_path: str, token: str = None) -> bool:
    """
    Clones a public GitHub repository to a destination path with 30s timeout.
    """
    url = repo_url
    if token:
        if url.startswith("https://github.com/"):
            url = url.replace("https://github.com/", f"https://{token}@github.com/")

    try:
        result = subprocess.run(
            ["git", "clone", "--depth", "1", url, dest_path],
            capture_output=True,
            text=True,
            check=False,
            timeout=30
        )
        if result.returncode != 0:
            stderr_clean = result.stderr
            stdout_clean = result.stdout
            if token:
                stderr_clean = stderr_clean.replace(token, "[REDACTED]")
                stdout_clean = stdout_clean.replace(token, "[REDACTED]")
            print(f"Error cloning repository {repo_url} (exit code {result.returncode}):\nStderr: {stderr_clean}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print(f"Warning: Git clone timed out for repository {repo_url} after 30s.")
        return False
    except Exception as e:
        err_msg = str(e)
        if token:
            err_msg = err_msg.replace(token, "[REDACTED]")
        print(f"Unexpected error cloning repository {repo_url}: {err_msg}")
        return False

def _safe_run_coroutine(coro):
    """
    Safely executes an async coroutine from either a synchronous worker thread or a running asyncio loop.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(asyncio.run, coro).result()
    else:
        return asyncio.run(coro)

def run_scan_job(scan_id: str, username: str, token: str = None):
    """
    Background worker task to orchestrate and run all scanners.
    """
    print(f"[Scan {scan_id}] Starting orchestrator for user {username}")
    db = SessionLocal()
    try:
        # 1. Retrieve the scan record
        scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
        if not scan:
            print(f"[Scan {scan_id}] Error: Scan not found in database")
            return

        scan.status = "running"
        db.commit()

        # 2. Retrieve the repositories (Cap to top 15 most active repos for performance)
        repositories = db.query(models.Repository).filter(models.Repository.scan_id == scan_id).all()
        if len(repositories) > 15:
            print(f"[Scan {scan_id}] Profile has {len(repositories)} repositories. Capping scan to top 15 most active for performance.")
            repositories = repositories[:15]

        print(f"[Scan {scan_id}] Scanning {len(repositories)} repositories")

        all_findings = []

        # 3. Scan each repository
        for repo in repositories:
            print(f"[Scan {scan_id}] Scanning repository: {repo.name}")
            with tempfile.TemporaryDirectory() as tmp_dir:
                if clone_repo(repo.url, tmp_dir, token):
                    # Run structural hygiene scanner
                    hygiene_findings = scan_hygiene(tmp_dir, repo.name)
                    all_findings.extend(hygiene_findings)

                    # Run TruffleHog secret scanner
                    secret_findings = scan_secrets(tmp_dir, repo.name)
                    all_findings.extend(secret_findings)

                    # Run Semgrep code smell scanner (implemented in Phase 4)
                    smell_findings = scan_smells(tmp_dir, repo.name)
                    all_findings.extend(smell_findings)

        # 4. Save findings to database
        for f in all_findings:
            db_finding = models.Finding(
                scan_id=scan_id,
                repo_name=f["repo_name"],
                type=f["type"],
                file_path=f["file_path"],
                line_number=f["line_number"],
                rule_id=f["rule_id"],
                severity=f["severity"],
                description=f["description"],
                verification_status=f["verification_status"],
                code_snippet=f.get("code_snippet")
            )
            db.add(db_finding)
        db.commit()

        # 5. Run AI Synthesis Layer (Phase 5)
        print(f"[Scan {scan_id}] Synthesizing report with {len(all_findings)} findings...")
        score, summary_json = _safe_run_coroutine(synthesize_report(all_findings))
        
        # 6. Update Scan status
        scan.overall_score = score
        scan.summary = summary_json
        scan.status = "completed"
        scan.completed_at = datetime.now(timezone.utc)
        db.commit()
        print(f"[Scan {scan_id}] Completed successfully. Score: {score}")

    except Exception as e:
        print(f"[Scan {scan_id}] Scan failed: {e}")
        try:
            scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
            if scan:
                scan.status = "failed"
                db.commit()
        except Exception as db_err:
            print(f"[Scan {scan_id}] Failed to set status to failed: {db_err}")
    finally:
        db.close()
