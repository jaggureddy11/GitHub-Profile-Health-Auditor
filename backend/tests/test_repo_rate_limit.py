import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app, in_memory_limiter

client = TestClient(app)

class MockHttpResponse:
    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self._json_data = json_data
        self.headers = {"X-RateLimit-Remaining": "60"}
        self.text = ""
    def json(self):
        return self._json_data

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

def test_shared_rate_limit_budget_combined_endpoints():
    in_memory_limiter._requests.clear()

    mock_repos = [
        {"name": "repo1", "html_url": "https://github.com/shareduser/repo1", "pushed_at": "2026-01-01T00:00:00Z", "default_branch": "main", "fork": False, "private": False}
    ]

    async def mock_get(url, headers=None):
        return MockHttpResponse(200, mock_repos)

    headers = {"x-forwarded-for": "203.0.113.50"}

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        with patch("main.redis_conn", None):
            with patch("main.RATE_LIMIT_SCANS_PER_IP_24H", 3):
                # 1. Single repo scan (consumes credit 1)
                r1 = client.post("/api/repo-scan", json={"username": "shareduser", "repo_name": "r1"}, headers=headers)
                assert r1.status_code == 200

                # 2. Bulk profile scan (consumes credit 2)
                r2 = client.post("/api/scan", json={"username": "shareduser"}, headers=headers)
                assert r2.status_code == 200

                # 3. Single repo scan (consumes credit 3)
                r3 = client.post("/api/repo-scan", json={"username": "shareduser", "repo_name": "r3"}, headers=headers)
                assert r3.status_code == 200

                # 4. Attempting bulk scan or single repo scan (4th request from same IP) -> blocked with 429
                r4_single = client.post("/api/repo-scan", json={"username": "shareduser", "repo_name": "r4"}, headers=headers)
                assert r4_single.status_code == 429
                assert "Per-IP scan rate limit reached" in r4_single.json()["detail"]

                r4_bulk = client.post("/api/scan", json={"username": "shareduser"}, headers=headers)
                assert r4_bulk.status_code == 429
                assert "Per-IP scan rate limit reached" in r4_bulk.json()["detail"]
