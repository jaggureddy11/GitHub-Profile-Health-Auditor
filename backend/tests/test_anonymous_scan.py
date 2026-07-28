import pytest
from fastapi.testclient import TestClient
from main import app, get_db
from models import Base
from database import engine

client = TestClient(app)

from unittest.mock import patch

def test_anonymous_scan_submission_and_report_access():
    # 1. Submit scan without authentication headers (anonymous)
    with patch("main.list_public_repositories", return_value=[]):
        with patch("main.scan_queue", None):
            response = client.post(
                "/api/scan",
                json={"username": "octocat"}
            )
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            assert "scan_id" in data
            scan_id = data["scan_id"]
            assert data["username"] == "octocat"
    
    # Verify session cookie was set
    assert "scan_session_id" in response.cookies or "scan_session_id" in client.cookies

    # 2. Retrieve report with the matching session cookie
    report_res = client.get(f"/api/scan/{scan_id}")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["scan_id"] == scan_id

    # 3. Retrieve report with a DIFFERENT session ID / cookie (Cross-session access attempt)
    other_client = TestClient(app)
    unauthorized_res = other_client.get(
        f"/api/scan/{scan_id}",
        headers={"X-Session-ID": "sess_different_attacker_session_9999"}
    )
    assert unauthorized_res.status_code == 404, f"Expected 404 access denied, got {unauthorized_res.status_code}"

def test_report_not_retrievable_by_username_alone():
    # Ensure there is no endpoint that returns private scan findings by username alone
    res = client.get("/api/scan/octocat")
    # UUID mismatch / not found returns 404
    assert res.status_code == 404
