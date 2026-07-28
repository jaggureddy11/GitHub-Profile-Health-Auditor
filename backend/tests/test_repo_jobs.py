import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
import uuid

client = TestClient(app)

class MockHttpResponse:
    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self._json_data = json_data
        self.headers = {"X-RateLimit-Remaining": "60"}
        self.text = "Mock Error"
    def json(self):
        return self._json_data

def test_bulk_scan_enqueues_independent_jobs():
    mock_repos = [
        {"name": "repo1", "html_url": "https://github.com/testuser/repo1", "pushed_at": "2026-01-01T00:00:00Z", "default_branch": "main", "fork": False, "private": False},
        {"name": "repo2", "html_url": "https://github.com/testuser/repo2", "pushed_at": "2026-01-01T00:00:00Z", "default_branch": "main", "fork": False, "private": False},
        {"name": "repo3", "html_url": "https://github.com/testuser/repo3", "pushed_at": "2026-01-01T00:00:00Z", "default_branch": "main", "fork": False, "private": False}
    ]

    async def mock_get(url, headers=None):
        return MockHttpResponse(200, mock_repos)

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        with patch("main.scan_queue", None):
            with patch("main.run_single_repo_scan_job") as mock_job:
                res = client.post("/api/scan", json={"username": "testuser"})
                assert res.status_code == 200, res.text
                data = res.json()
                assert data["username"] == "testuser"
                assert data["status"] == "running"
                assert data["is_partial"] is True
                assert len(data["child_scan_ids"]) == 3
                assert data["group_progress"]["total_repos"] == 3

                # Verify background task fan-out (3 calls to run_single_repo_scan_job)
                assert mock_job.call_count == 3

def test_single_repo_scan_triggered_directly():
    with patch("main.scan_queue", None):
        with patch("main.run_single_repo_scan_job") as mock_job:
            res = client.post("/api/repo-scan", json={
                "username": "testuser",
                "repo_name": "solo-repo",
                "repo_url": "https://github.com/testuser/solo-repo"
            })
            assert res.status_code == 200, res.text
            data = res.json()
            assert data["username"] == "testuser"
            assert data["status"] == "queued"
            assert len(data["repositories"]) == 1
            assert data["repositories"][0]["name"] == "solo-repo"

            mock_job.assert_called_once()

def test_slow_repo_timeout_does_not_cancel_siblings():
    from scanners.orchestrator import run_single_repo_scan_job
    db = SessionLocal()

    parent_id = str(uuid.uuid4())
    parent_scan = models.Scan(
        id=parent_id,
        username="timeoutuser",
        scan_type="group",
        status="running"
    )
    db.add(parent_scan)

    child1_id = str(uuid.uuid4())
    child2_id = str(uuid.uuid4())

    child1 = models.Scan(
        id=child1_id,
        username="timeoutuser",
        parent_scan_id=parent_id,
        scan_type="single_repo",
        repo_name="fast-repo",
        repo_url="https://github.com/timeoutuser/fast-repo",
        status="queued"
    )
    child2 = models.Scan(
        id=child2_id,
        username="timeoutuser",
        parent_scan_id=parent_id,
        scan_type="single_repo",
        repo_name="slow-repo",
        repo_url="https://github.com/timeoutuser/slow-repo",
        status="queued"
    )
    db.add(child1)
    db.add(child2)
    db.commit()

    # Mock clone_repo to succeed for fast-repo, fail/timeout for slow-repo
    def mock_clone(url, dest, token=None):
        if "slow-repo" in url:
            return False
        return True

    def mock_hygiene(path, name):
        return [{"repo_name": name, "type": "structural", "file_path": "README.md", "line_number": None, "rule_id": "MISSING_LICENSE", "severity": "low", "description": "No license", "verification_status": None}]

    with patch("scanners.orchestrator.clone_repo", side_effect=mock_clone), \
         patch("scanners.orchestrator.scan_hygiene", side_effect=mock_hygiene), \
         patch("scanners.orchestrator.scan_secrets", return_value=[]), \
         patch("scanners.orchestrator.scan_smells", return_value=[]), \
         patch("scanners.orchestrator.synthesize_report", return_value=(85, '{"overall_score": 85}')):

        # Execute sibling jobs independently
        run_single_repo_scan_job(child1_id, "timeoutuser", "fast-repo", "https://github.com/timeoutuser/fast-repo")
        run_single_repo_scan_job(child2_id, "timeoutuser", "slow-repo", "https://github.com/timeoutuser/slow-repo")

        db.refresh(child1)
        db.refresh(child2)

        # Assert fast repo completed cleanly
        assert child1.status == "completed"

        # Assert slow repo failed/timed_out independently without raising uncaught exception
        assert child2.status in ("failed", "timed_out")

        # Assert parent group scan aggregated completed findings cleanly
        db.refresh(parent_scan)
        assert parent_scan.status == "completed"
        assert parent_scan.overall_score == 85

    db.close()

def test_partial_aggregate_report_progressive():
    db = SessionLocal()

    parent_id = str(uuid.uuid4())
    parent_scan = models.Scan(
        id=parent_id,
        username="partialuser",
        session_id="test-session-123",
        scan_type="group",
        status="running"
    )
    db.add(parent_scan)

    c1 = models.Scan(id=str(uuid.uuid4()), username="partialuser", session_id="test-session-123", parent_scan_id=parent_id, scan_type="single_repo", repo_name="r1", status="completed")
    c2 = models.Scan(id=str(uuid.uuid4()), username="partialuser", session_id="test-session-123", parent_scan_id=parent_id, scan_type="single_repo", repo_name="r2", status="completed")
    c3 = models.Scan(id=str(uuid.uuid4()), username="partialuser", session_id="test-session-123", parent_scan_id=parent_id, scan_type="single_repo", repo_name="r3", status="running")

    db.add(c1)
    db.add(c2)
    db.add(c3)
    db.commit()

    # Query report for parent_id using test client with session cookie
    client.cookies.set("scan_session_id", "test-session-123")
    res = client.get(f"/api/scan/{parent_id}")
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["status"] == "running"
    assert data["is_partial"] is True
    assert data["group_progress"]["total_repos"] == 3
    assert data["group_progress"]["completed_count"] == 2
    assert data["group_progress"]["running_count"] == 1
    assert "Scanned 2 of 3 repositories" in data["summary"]["summary_text"]

    db.close()

def test_repo_scan_timeout_enforcement_duration_exceeded():
    import time
    from scanners.orchestrator import run_single_repo_scan_job
    db = SessionLocal()

    parent_id = str(uuid.uuid4())
    parent_scan = models.Scan(
        id=parent_id,
        username="durationuser",
        scan_type="group",
        status="running"
    )
    db.add(parent_scan)

    child1_id = str(uuid.uuid4())
    child2_id = str(uuid.uuid4())

    child1 = models.Scan(
        id=child1_id,
        username="durationuser",
        parent_scan_id=parent_id,
        scan_type="single_repo",
        repo_name="fast-repo",
        repo_url="https://github.com/durationuser/fast-repo",
        status="queued"
    )
    child2 = models.Scan(
        id=child2_id,
        username="durationuser",
        parent_scan_id=parent_id,
        scan_type="single_repo",
        repo_name="slow-repo",
        repo_url="https://github.com/durationuser/slow-repo",
        status="queued"
    )
    db.add(child1)
    db.add(child2)
    db.commit()

    # Mock hygiene to simulate slow execution on slow-repo
    def mock_hygiene(path, name):
        if "slow-repo" in name:
            time.sleep(1.2)  # Exceeds REPO_SCAN_TIMEOUT_SECONDS=1
        return [{"repo_name": name, "type": "structural", "file_path": "README.md", "line_number": None, "rule_id": "MISSING_LICENSE", "severity": "low", "description": "No license", "verification_status": None}]

    with patch.dict("os.environ", {"REPO_SCAN_TIMEOUT_SECONDS": "1"}):
        with patch("scanners.orchestrator.clone_repo", return_value=True), \
             patch("scanners.orchestrator.scan_hygiene", side_effect=mock_hygiene), \
             patch("scanners.orchestrator.scan_secrets", return_value=[]), \
             patch("scanners.orchestrator.scan_smells", return_value=[]), \
             patch("scanners.orchestrator.synthesize_report", return_value=(90, '{"overall_score": 90}')):

            # Execute fast-repo job
            run_single_repo_scan_job(child1_id, "durationuser", "fast-repo", "https://github.com/durationuser/fast-repo")
            # Execute slow-repo job
            run_single_repo_scan_job(child2_id, "durationuser", "slow-repo", "https://github.com/durationuser/slow-repo")

            db.refresh(child1)
            db.refresh(child2)

            # Assert fast-repo completed successfully
            assert child1.status == "completed"

            # Assert slow-repo timed out explicitly and captured timeout error message
            assert child2.status == "timed_out"
            assert "Task exceeded maximum timeout value (1 seconds)" in child2.error_message

            # Assert parent group scan completed and aggregated findings from fast-repo
            db.refresh(parent_scan)
            assert parent_scan.status == "completed"
            assert parent_scan.overall_score == 90

    db.close()
