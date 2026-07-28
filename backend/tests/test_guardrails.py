import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from scanners.orchestrator import run_scan_job
from database import SessionLocal
import models

client = TestClient(app)

def test_honeypot_bot_rejection():
    res = client.post(
        "/api/scan",
        json={
            "username": "octocat",
            "website_url": "http://spambot-trap.com"
        }
    )
    assert res.status_code == 400
    assert "honeypot" in res.json()["detail"].lower()

def test_max_repo_cap_and_timeout_guardrails(monkeypatch):
    monkeypatch.setenv("MAX_REPOS_PER_SCAN", "3")
    monkeypatch.setenv("SCAN_JOB_TIMEOUT_SECONDS", "60")

    # Mock list_public_repositories to return 10 repos
    mock_repos = [
        {"name": f"repo-{i}", "url": f"https://github.com/testuser/repo-{i}", "last_commit": "2026-01-01", "default_branch": "main"}
        for i in range(10)
    ]

    with patch("main.list_public_repositories", return_value=mock_repos):
        with patch("main.scan_queue", None):
            res = client.post("/api/scan", json={"username": "testuser"})
            assert res.status_code == 200
            scan_id = res.json()["scan_id"]

            db = SessionLocal()
            scan_repos = db.query(models.Repository).filter(models.Repository.scan_id == scan_id).all()
            assert len(scan_repos) == 10

            # Run scan job manually and check truncation
            with patch("scanners.orchestrator.clone_repo", return_value=True):
                with patch("scanners.orchestrator.scan_hygiene", return_value=[]):
                    with patch("scanners.orchestrator.scan_secrets", return_value=[]):
                        with patch("scanners.orchestrator.scan_smells", return_value=[]):
                            run_scan_job(scan_id, "testuser")

            scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
            assert scan.status == "completed"
            db.close()
