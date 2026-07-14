import os
import shutil
import tempfile
import subprocess
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
    Clones a public GitHub repository to a destination path.
    Uses token if provided.
    """
    url = repo_url
    if token:
        # Inject token into URL for authenticated cloning
        # Format: https://token@github.com/user/repo.git
        if url.startswith("https://github.com/"):
            url = url.replace("https://github.com/", f"https://{token}@github.com/")

    try:
        result = subprocess.run(
            ["git", "clone", "--depth", "1", url, dest_path],
            capture_output=True,
            text=True,
            check=True
        )
        return True
    except Exception as e:
        print(f"Error cloning repository {repo_url}: {e}")
        return False

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

        # 2. Retrieve the repositories
        repositories = db.query(models.Repository).filter(models.Repository.scan_id == scan_id).all()
        print(f"[Scan {scan_id}] Found {len(repositories)} repositories to scan")

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
                verification_status=f["verification_status"]
            )
            db.add(db_finding)
        db.commit()

        # 5. Run AI Synthesis Layer (Phase 5)
        print(f"[Scan {scan_id}] Synthesizing report with {len(all_findings)} findings...")
        score, summary_json = synthesize_report(all_findings)
        
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
