import os
import shutil
import tempfile
import pytest
from unittest.mock import patch, MagicMock
from scanners.trufflehog import scan_secrets, find_line_number

def test_find_line_number():
    """
    Test locate secret value's line number in a file.
    """
    with tempfile.NamedTemporaryFile("w+", delete=False) as f:
        f.write("import os\n")
        f.write("API_KEY = \"my-super-secret-key\"\n")
        f.write("print('hello')\n")
        file_path = f.name

    try:
        line_num = find_line_number(file_path, "my-super-secret-key")
        assert line_num == 2

        line_num_missing = find_line_number(file_path, "non-existent")
        assert line_num_missing is None
    finally:
        os.unlink(file_path)

@patch("subprocess.run")
@patch("os.path.exists")
def test_scan_secrets_success(mock_exists, mock_run):
    """
    Test parsing TruffleHog json lines and making sure secret values are redacted.
    """
    # Force TruffleHog binary path to appear to exist
    mock_exists.return_value = True

    # Simulate trufflehog output
    trufflehog_json_output = (
        '{"DetectorName": "Slack", "Raw": "xoxb-dummy-token", "Verified": false, '
        '"SourceMetadata": {"Filesystem": {"file": "/tmp/test-repo/config.py"}}}\n'
        '{"DetectorName": "AWS", "Raw": "AKIAIOSFODNN7EXAMPLE", "Verified": true, '
        '"SourceMetadata": {"Filesystem": {"file": "/tmp/test-repo/keys.txt"}}}\n'
    )
    
    mock_result = MagicMock()
    mock_result.stdout = trufflehog_json_output
    mock_result.return_value = mock_result
    mock_run.return_value = mock_result

    # Mock finding the line number (avoid reading real files)
    with patch("scanners.trufflehog.find_line_number", return_value=12):
        findings = scan_secrets("/tmp/test-repo", "my-repo")
        
        assert len(findings) == 2
        
        # Check Slack secret finding
        slack_finding = findings[0]
        assert slack_finding["repo_name"] == "my-repo"
        assert slack_finding["type"] == "secret"
        assert slack_finding["file_path"] == "config.py"
        assert slack_finding["line_number"] == 12
        assert slack_finding["rule_id"] == "secret-slack"
        assert slack_finding["severity"] == "high"
        assert slack_finding["verification_status"] == "unverified"
        assert "xoxb-dummy-token" not in slack_finding["description"]
        assert "xoxb-dummy-token" not in str(slack_finding) # Redaction check

        # Check AWS secret finding (verified)
        aws_finding = findings[1]
        assert aws_finding["rule_id"] == "secret-aws"
        assert aws_finding["severity"] == "critical"
        assert aws_finding["verification_status"] == "live"
        assert "AKIAIOSFODNN7EXAMPLE" not in aws_finding["description"]
        assert "AKIAIOSFODNN7EXAMPLE" not in str(aws_finding) # Redaction check

def test_run_scan_job_integration():
    """
    Integration test for run_scan_job verifying cloning, scanning, 
    and DB persistence of redacted findings.
    """
    from database import Base, engine, SessionLocal
    from scanners.orchestrator import run_scan_job
    import models

    # Create tables in test db (SessionLocal points to health_auditor.db, but we can use it for test)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create dummy scan and repository
    scan_id = "test-scan-uuid"
    db_scan = models.Scan(id=scan_id, username="test-user", status="pending")
    db_repo = models.Repository(scan_id=scan_id, name="test-repo", url="https://github.com/test-user/test-repo")
    
    db.query(models.Finding).filter(models.Finding.scan_id == scan_id).delete()
    db.query(models.Repository).filter(models.Repository.scan_id == scan_id).delete()
    db.query(models.Scan).filter(models.Scan.id == scan_id).delete()
    db.commit()

    db.add(db_scan)
    db.add(db_repo)
    db.commit()

    # Create a local mock repository containing a planted credential
    with tempfile.TemporaryDirectory() as src_dir:
        # Plant a secret in config.py
        with open(os.path.join(src_dir, "config.py"), "w") as f:
            f.write("# Config file\n")
            f.write("SLACK_TOKEN = 'xoxb-1234567890-abcdef'\n")

        # Mock clone_repo to copy this local folder instead of cloning via git
        def mock_clone(url, dest_path, token=None):
            for item in os.listdir(src_dir):
                s = os.path.join(src_dir, item)
                d = os.path.join(dest_path, item)
                if os.path.isdir(s):
                    shutil.copytree(s, d)
                else:
                    shutil.copy2(s, d)
            return True

        # Mock subprocess.run for trufflehog
        import subprocess as sp
        original_run = sp.run
        def mock_subprocess_run(args, **kwargs):
            if len(args) > 0 and "trufflehog" in args[0]:
                repo_path = args[3]
                mock_res = MagicMock()
                mock_res.stdout = (
                    '{"DetectorName": "Slack", "Raw": "xoxb-1234567890-abcdef", "Verified": false, '
                    f'"SourceMetadata": {{"Filesystem": {{"file": "{os.path.join(repo_path, "config.py")}"}}}}}}'
                )
                return mock_res
            return original_run(args, **kwargs)

        with patch("scanners.orchestrator.clone_repo", side_effect=mock_clone):
            with patch("subprocess.run", side_effect=mock_subprocess_run):
                # Run the scan job
                run_scan_job(scan_id, "test-user")

                # Check scan status
                scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
                assert scan.status == "completed"
                assert scan.overall_score is not None

                # Retrieve findings from database
                findings = db.query(models.Finding).filter(models.Finding.scan_id == scan_id).all()
                
                # Since the mock repo has config.py with SLACK_TOKEN, it should find it, and also flag missing LICENSE/.gitignore/README
                assert len(findings) > 0
                
                secret_findings = [f for f in findings if f.type == "secret"]
                assert len(secret_findings) > 0
                
                # Verify secret value is absolute redacted
                for sf in secret_findings:
                    assert "xoxb-1234567890-abcdef" not in sf.description
                    assert sf.verification_status == "unverified" or sf.verification_status == "live"
                    assert sf.file_path == "config.py"

    # Cleanup test data
    db.query(models.Finding).filter(models.Finding.scan_id == scan_id).delete()
    db.query(models.Repository).filter(models.Repository.scan_id == scan_id).delete()
    db.query(models.Scan).filter(models.Scan.id == scan_id).delete()
    db.commit()
    db.close()

