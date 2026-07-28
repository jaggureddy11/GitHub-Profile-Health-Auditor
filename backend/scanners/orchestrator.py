import os
import time
import shutil
import tempfile
import subprocess
import asyncio
import concurrent.futures
import uuid
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
    if token and token.strip() and not token.startswith("your_") and not token.startswith("placeholder_"):
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

def run_single_repo_scan_job(scan_id: str, username: str, repo_name: str, repo_url: str, token: str = None):
    """
    Background worker task to scan a single repository independently with per-repo timeout isolation.
    """
    print(f"[SingleRepoScan {scan_id}] Starting scan for {username}/{repo_name}")
    db = SessionLocal()
    try:
        scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
        if not scan:
            print(f"[SingleRepoScan {scan_id}] Error: Scan record not found")
            return

        scan.status = "running"
        db.commit()

        per_repo_timeout = int(os.getenv("REPO_SCAN_TIMEOUT_SECONDS", "60"))
        start_time = time.time()
        findings = []
        scan_failed = False
        timed_out = False

        with tempfile.TemporaryDirectory() as tmp_dir:
            # 1. Clone repo with per-repo timeout
            cloned = clone_repo(repo_url, tmp_dir, token)
            if not cloned:
                elapsed = time.time() - start_time
                if elapsed >= 29:  # Clone timeout
                    timed_out = True
                    scan.status = "timed_out"
                    scan.error_message = f"Git clone timed out for repository {repo_name}."
                else:
                    scan_failed = True
                    scan.status = "failed"
                    scan.error_message = f"Failed to clone repository {repo_name}."
                db.commit()
            else:
                try:
                    # Run structural hygiene scanner
                    hygiene_findings = scan_hygiene(tmp_dir, repo_name)
                    findings.extend(hygiene_findings)

                    # Check timeout
                    if time.time() - start_time > per_repo_timeout:
                        raise TimeoutError(f"Task exceeded maximum timeout value ({per_repo_timeout} seconds)")

                    # Run TruffleHog secret scanner
                    secret_findings = scan_secrets(tmp_dir, repo_name)
                    findings.extend(secret_findings)

                    # Check timeout
                    if time.time() - start_time > per_repo_timeout:
                        raise TimeoutError(f"Task exceeded maximum timeout value ({per_repo_timeout} seconds)")

                    # Run Semgrep code smell scanner
                    smell_findings = scan_smells(tmp_dir, repo_name)
                    findings.extend(smell_findings)

                except TimeoutError as te:
                    print(f"[SingleRepoScan {scan_id}] {te}")
                    timed_out = True
                    scan.status = "timed_out"
                    scan.error_message = str(te)
                except Exception as ex:
                    print(f"[SingleRepoScan {scan_id}] Scanner error: {ex}")
                    scan_failed = True
                    scan.status = "failed"
                    scan.error_message = str(ex)

        if not timed_out and not scan_failed:
            # Save findings to database
            for f in findings:
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
                
                # Also save to parent scan if part of a group
                if scan.parent_scan_id:
                    parent_finding = models.Finding(
                        scan_id=scan.parent_scan_id,
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
                    db.add(parent_finding)

            scan.status = "completed"
            scan.completed_at = datetime.now(timezone.utc)
            db.commit()
            print(f"[SingleRepoScan {scan_id}] Completed successfully with {len(findings)} findings.")

        # Check if this child scan belongs to a parent group scan
        if scan.parent_scan_id:
            check_and_update_parent_group_scan(db, scan.parent_scan_id)

    except Exception as e:
        print(f"[SingleRepoScan {scan_id}] Job error: {e}")
        try:
            scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
            if scan:
                scan.status = "failed"
                scan.error_message = str(e)
                db.commit()
                if scan.parent_scan_id:
                    check_and_update_parent_group_scan(db, scan.parent_scan_id)
        except Exception:
            pass
    finally:
        db.close()

def check_and_update_parent_group_scan(db, parent_scan_id: str):
    """
    Checks progress of all child repo scans under parent group scan.
    If all finished, synthesizes final AI report and completes parent scan.
    """
    parent = db.query(models.Scan).filter(models.Scan.id == parent_scan_id).first()
    if not parent:
        return

    children = db.query(models.Scan).filter(models.Scan.parent_scan_id == parent_scan_id).all()
    if not children:
        return

    terminal_statuses = {"completed", "failed", "timed_out"}
    all_finished = all(c.status in terminal_statuses for c in children)

    if all_finished and parent.status != "completed":
        all_parent_findings = db.query(models.Finding).filter(models.Finding.scan_id == parent_scan_id).all()
        findings_dicts = [
            {
                "repo_name": f.repo_name,
                "type": f.type,
                "file_path": f.file_path,
                "line_number": f.line_number,
                "rule_id": f.rule_id,
                "severity": f.severity,
                "description": f.description,
                "verification_status": f.verification_status,
                "code_snippet": f.code_snippet
            }
            for f in all_parent_findings
        ]
        score, summary_json = _safe_run_coroutine(synthesize_report(findings_dicts))
        parent.overall_score = score
        parent.summary = summary_json
        parent.status = "completed"
        parent.completed_at = datetime.now(timezone.utc)
        db.commit()
        print(f"[GroupScan {parent_scan_id}] All child jobs complete. Synthesized final report. Score: {score}")

def run_scan_job(scan_id: str, username: str, token: str = None):
    """
    Background worker task to orchestrate and run all scanners.
    Re-uses single-repo scanner logic for backward compatibility.
    """
    print(f"[Scan {scan_id}] Starting orchestrator for user {username}")
    db = SessionLocal()
    try:
        scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
        if not scan:
            print(f"[Scan {scan_id}] Error: Scan not found in database")
            return

        scan.status = "running"
        db.commit()

        repositories = db.query(models.Repository).filter(models.Repository.scan_id == scan_id).all()
        max_repos_cap = int(os.getenv("MAX_REPOS_PER_SCAN", "10"))
        if len(repositories) > max_repos_cap:
            repositories = repositories[:max_repos_cap]

        for repo in repositories:
            # Create a child repo scan if none exists
            child_scan = models.Scan(
                id=str(uuid.uuid4()),
                user_id=scan.user_id,
                session_id=scan.session_id,
                username=username,
                parent_scan_id=scan_id,
                scan_type="single_repo",
                repo_name=repo.name,
                repo_url=repo.url,
                status="pending"
            )
            db.add(child_scan)
            db.commit()
            
            run_single_repo_scan_job(child_scan.id, username, repo.name, repo.url, token)

    except Exception as e:
        print(f"[Scan {scan_id}] Scan failed: {e}")
        try:
            scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
            if scan:
                scan.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
