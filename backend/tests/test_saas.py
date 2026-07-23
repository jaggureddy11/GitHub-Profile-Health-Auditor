import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Ensure the parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
import models
from database import Base, engine, SessionLocal

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Clean users and scans
    db.query(models.Finding).delete()
    db.query(models.Repository).delete()
    db.query(models.Scan).delete()
    db.query(models.User).delete()
    db.commit()
    db.close()
    yield
    # Cleanup after tests
    db = SessionLocal()
    db.query(models.Finding).delete()
    db.query(models.Repository).delete()
    db.query(models.Scan).delete()
    db.query(models.User).delete()
    db.commit()
    db.close()

def test_user_registration_and_login():
    # 1. Register User A
    reg_response = client.post("/api/auth/register", json={
        "email": "user-a@example.com",
        "password": "password123"
    })
    assert reg_response.status_code == 200
    assert reg_response.json()["email"] == "user-a@example.com"
    assert "id" in reg_response.json()

    # 2. Login User A (Success)
    login_response = client.post("/api/auth/login", json={
        "email": "user-a@example.com",
        "password": "password123"
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
    assert login_response.json()["token_type"] == "bearer"

    # 3. Login User A (Failure - Wrong Password)
    login_fail = client.post("/api/auth/login", json={
        "email": "user-a@example.com",
        "password": "wrong-password"
    })
    assert login_fail.status_code == 400

def test_protected_endpoints_rejection():
    # Try calling /api/scan without authentication header
    response = client.post("/api/scan", json={"username": "some-user"})
    assert response.status_code == 401

    # Try calling /api/scans without authentication
    response2 = client.get("/api/scans")
    assert response2.status_code == 401

def test_multi_tenancy_isolation():
    # Register User A and User B
    client.post("/api/auth/register", json={
        "email": "tenant-a@example.com",
        "password": "password123"
    })
    client.post("/api/auth/register", json={
        "email": "tenant-b@example.com",
        "password": "password123"
    })

    # Log in both users
    token_a = client.post("/api/auth/login", json={"email": "tenant-a@example.com", "password": "password123"}).json()["access_token"]
    token_b = client.post("/api/auth/login", json={"email": "tenant-b@example.com", "password": "password123"}).json()["access_token"]

    # Mock github client call inside start_scan
    with patch("main.list_public_repositories", return_value=[]) as mock_list:
        with patch("main.scan_queue", None):
            # User A starts a scan
            response_a = client.post(
                "/api/scan", 
                json={"username": "tenant-a-gh"},
                headers={"Authorization": f"Bearer {token_a}"}
            )
            assert response_a.status_code == 200
            scan_id_a = response_a.json()["scan_id"]

            # User B attempts to access User A's scan (should fail with 404/403)
            response_b_access = client.get(
                f"/api/scan/{scan_id_a}",
                headers={"Authorization": f"Bearer {token_b}"}
            )
            assert response_b_access.status_code == 404

            # User A accesses their own scan (should succeed)
            response_a_access = client.get(
                f"/api/scan/{scan_id_a}",
                headers={"Authorization": f"Bearer {token_a}"}
            )
            assert response_a_access.status_code == 200

def test_rate_limiting():
    # Log in User A
    token_a = client.post("/api/auth/login", json={"email": "tenant-a@example.com", "password": "password123"}).json()["access_token"]

    # Mock Redis connection to return 5 scans already performed
    mock_redis = MagicMock()
    mock_redis.get.return_value = b"5" # rate limit hits at >= 5

    with patch("main.redis_conn", mock_redis):
        response = client.post(
            "/api/scan",
            json={"username": "tenant-a-gh"},
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert response.status_code == 429
        assert "Rate limit exceeded" in response.json()["detail"]
