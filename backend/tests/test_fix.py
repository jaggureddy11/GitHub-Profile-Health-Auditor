import pytest
from fastapi.testclient import TestClient
from database import Base, engine, SessionLocal
import models
import sys
import os

# Ensure the parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_header():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == "fix-user@example.com").first()
    if not user:
        from main import hash_password
        user = models.User(
            id="fix-user-uuid",
            email="fix-user@example.com",
            hashed_password=hash_password("password123")
        )
        db.add(user)
        db.commit()
    db.close()

    response = client.post("/api/auth/login", json={
        "email": "fix-user@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_generate_fix_patch_not_found(auth_header):
    """
    Test generating fix patch when scan/finding is not found.
    """
    response = client.post("/api/fix", json={
        "scan_id": "non-existent-scan",
        "repo_name": "test-repo",
        "rule_id": "missing-license"
    }, headers=auth_header)
    assert response.status_code == 404
    assert "Scan not found or access denied" in response.json()["detail"]

def test_generate_fix_patch_success(auth_header):
    """
    Test generating a MIT License patch file.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create dummy records belonging to the authenticated user
    scan_id = "fix-test-uuid"
    db_scan = models.Scan(id=scan_id, user_id="fix-user-uuid", username="test-user", status="completed")
    db_finding = models.Finding(
        scan_id=scan_id,
        repo_name="test-repo",
        type="structural",
        file_path="LICENSE",
        rule_id="missing-license",
        severity="medium",
        description="Missing LICENSE file"
    )

    db.query(models.Finding).filter(models.Finding.scan_id == scan_id).delete()
    db.query(models.Scan).filter(models.Scan.id == scan_id).delete()
    db.commit()

    db.add(db_scan)
    db.add(db_finding)
    db.commit()

    try:
        response = client.post("/api/fix", json={
            "scan_id": scan_id,
            "repo_name": "test-repo",
            "rule_id": "missing-license"
        }, headers=auth_header)
        
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/x-diff")
        assert "attachment" in response.headers["content-disposition"]
        
        patch_text = response.text
        assert "diff --git a/LICENSE b/LICENSE" in patch_text
        assert "new file mode 100644" in patch_text
        assert "+++ b/LICENSE" in patch_text
        assert "+MIT License" in patch_text
    finally:
        # Cleanup
        db.query(models.Finding).filter(models.Finding.scan_id == scan_id).delete()
        db.query(models.Scan).filter(models.Scan.id == scan_id).delete()
        db.commit()
        db.close()
