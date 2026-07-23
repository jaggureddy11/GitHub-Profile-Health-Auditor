import pytest
from datetime import datetime, timezone
import uuid
from fastapi.testclient import TestClient
from main import app, get_user_health_badge
from database import SessionLocal
import models

client = TestClient(app)

def test_health_badge_svg_endpoint():
    response = client.get("/api/badge/octocat.svg")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/svg+xml")
    assert "Profile Health" in response.text
    assert "<svg" in response.text

def test_health_badge_svg_completed_scan():
    email = f"badge-test-{uuid.uuid4()}@example.com"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "password123"
    })
    assert reg_res.status_code == 200
    user_id = reg_res.json()["id"]

    db = SessionLocal()
    scan_id = str(uuid.uuid4())
    scan = models.Scan(
        id=scan_id,
        user_id=user_id,
        username="testbadgeuser",
        status="completed",
        overall_score=95,
        created_at=datetime.now(timezone.utc)
    )
    db.add(scan)
    db.commit()

    response = get_user_health_badge("testbadgeuser", db)
    db.close()

    assert response.status_code == 200
    assert "95%" in response.body.decode("utf-8")

def test_export_scan_report_endpoints():
    email = f"export-test-{uuid.uuid4()}@example.com"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "password123"
    })
    assert reg_res.status_code == 200
    user_id = reg_res.json()["id"]

    login_res = client.post("/api/auth/login", json={"email": email, "password": "password123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    scan_id = str(uuid.uuid4())
    scan = models.Scan(
        id=scan_id,
        user_id=user_id,
        username="exportuser",
        status="completed",
        overall_score=88,
        summary='{"summary": "Test executive summary", "top_issues": []}',
        created_at=datetime.now(timezone.utc)
    )
    db.add(scan)
    db.commit()
    db.close()

    # Test Markdown Export
    res_md = client.get(f"/api/scan/{scan_id}/export?format=markdown", headers=headers)
    assert res_md.status_code == 200
    assert "# Executive Audit Report — @exportuser" in res_md.text

    # Test JSON Export
    res_json = client.get(f"/api/scan/{scan_id}/export?format=json", headers=headers)
    assert res_json.status_code == 200
    assert res_json.json()["username"] == "exportuser"
