import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app, in_memory_limiter

client = TestClient(app)

def test_repo_scan_rate_limit_enforced():
    in_memory_limiter._requests.clear()

    # Simulate exceeding per-IP rate limit for single-repo scans
    with patch("main.redis_conn", None):
        with patch("main.RATE_LIMIT_SCANS_PER_IP_24H", 2):
            # First request succeeds
            res1 = client.post("/api/repo-scan", json={"username": "rateuser", "repo_name": "repo1"})
            assert res1.status_code == 200

            # Second request succeeds
            res2 = client.post("/api/repo-scan", json={"username": "rateuser", "repo_name": "repo2"})
            assert res2.status_code == 200

            # Third request is blocked by rate limit
            res3 = client.post("/api/repo-scan", json={"username": "rateuser", "repo_name": "repo3"})
            assert res3.status_code == 429
            assert "Per-IP scan rate limit reached" in res3.json()["detail"]
