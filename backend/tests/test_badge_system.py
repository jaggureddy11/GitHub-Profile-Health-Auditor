import pytest
import uuid
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models

client = TestClient(app)

class MockHttpResponse:
    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self._json_data = json_data
    def json(self):
        return self._json_data

def test_badge_requires_verification_and_completed_scan():
    unique_user = f"badgeuser_{uuid.uuid4().hex[:6]}"

    # 1. Challenge creation
    chal_res = client.post("/api/badge/challenge", json={"username": unique_user})
    assert chal_res.status_code == 200
    token = chal_res.json()["verification_token"]

    # 2. Attempt verification without completed scan (should fail with 404)
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = MockHttpResponse(200, {"bio": f"Developer. {token}"})
        
        verify_res = client.post("/api/badge/verify", json={
            "username": unique_user,
            "verification_token": token,
            "method": "bio_token"
        })
        assert verify_res.status_code == 404
        assert "No completed scan" in verify_res.json()["detail"]

    # 3. Create completed scan for unique_user
    db = SessionLocal()
    scan = models.Scan(
        id=f"scan-badge-{unique_user}",
        username=unique_user,
        status="completed",
        overall_score=92
    )
    db.add(scan)
    db.commit()
    db.close()

    # 4. Attempt verification with wrong token in bio (should fail with 400)
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = MockHttpResponse(200, {"bio": "Developer. Wrong Token"})

        verify_res_fail = client.post("/api/badge/verify", json={
            "username": unique_user,
            "verification_token": token,
            "method": "bio_token"
        })
        assert verify_res_fail.status_code == 400
        assert "was not found" in verify_res_fail.json()["detail"]

    # 5. Verify successfully with correct token in bio
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = MockHttpResponse(200, {"bio": f"Developer. {token}"})

        verify_res = client.post("/api/badge/verify", json={
            "username": unique_user,
            "verification_token": token,
            "method": "bio_token"
        })
        assert verify_res.status_code == 200
        badge_data = verify_res.json()
        assert badge_data["overall_score"] == 92
        rev_token = badge_data["revocation_token"]

    # 6. Check public SVG badge endpoint (returns 92% aggregate score, 0 findings)
    svg_res = client.get(f"/api/badge/{unique_user}.svg")
    assert svg_res.status_code == 200
    assert "92%" in svg_res.text
    assert "file_path" not in svg_res.text # Ensure no finding details exposed

    # 7. Check leaderboard includes unique_user
    lb_res = client.get("/api/leaderboard")
    assert lb_res.status_code == 200
    lb_data = lb_res.json()
    assert any(entry["username"] == unique_user for entry in lb_data)

    # 8. Deactivate badge using revocation token
    deact_res = client.post(f"/api/badge/{unique_user}/deactivate?revocation_token={rev_token}")
    assert deact_res.status_code == 200

    # 9. Verify SVG badge is now Unverified
    svg_res_after = client.get(f"/api/badge/{unique_user}.svg")
    assert svg_res_after.status_code == 200
    assert "Unverified" in svg_res_after.text

def test_unissued_challenge_token_forgery_rejected():
    fake_username = f"forger_{uuid.uuid4().hex[:6]}"
    unissued_token = f"health-auditor-verify-{uuid.uuid4().hex[:16]}"

    # Attempt to verify an unissued token directly without calling /api/badge/challenge first
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = MockHttpResponse(200, {"bio": f"Developer. {unissued_token}"})

        verify_res = client.post("/api/badge/verify", json={
            "username": fake_username,
            "verification_token": unissued_token,
            "method": "bio_token"
        })
        assert verify_res.status_code == 400
        assert "Invalid or unissued verification challenge token" in verify_res.json()["detail"]
