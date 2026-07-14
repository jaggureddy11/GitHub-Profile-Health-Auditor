import pytest
import sys
import os
from fastapi.testclient import TestClient
from database import Base, engine, SessionLocal
import models

# Ensure the parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

def test_generate_fix_patch_not_found():
    """
    Test generating fix patch when scan/finding is not found.
    """
    response = client.post("/api/fix", json={
        "scan_id": "non-existent-scan",
        "repo_name": "test-repo",
        "rule_id": "missing-license"
    })
    assert response.status_code == 404
    assert "Scan not found" in response.json()["detail"]

def test_generate_fix_patch_success():
    """
    Test generating a MIT License patch file.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create dummy records
    scan_id = "fix-test-uuid"
    db_scan = models.Scan(id=scan_id, username="test-user", status="completed")
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
        })
        
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
