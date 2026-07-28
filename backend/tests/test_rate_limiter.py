import time
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app, in_memory_limiter
from fastapi import HTTPException

client = TestClient(app)

def test_per_ip_rate_limiting():
    # Clear in-memory rate limiter state
    in_memory_limiter._requests.clear()

    # Mock Redis to simulate count = 5 (limit reached)
    mock_redis = MagicMock()
    mock_redis.get.return_value = b"5"

    with patch("main.redis_conn", mock_redis):
        # 6th request from IP should be rejected with 429
        response = client.post(
            "/api/scan",
            json={"username": "testuser"}
        )
        assert response.status_code == 429
        assert "Per-IP scan rate limit reached" in response.json()["detail"]

def test_redis_unavailable_fallback_does_not_bypass():
    # Reset in-memory rate limiter state
    in_memory_limiter._requests.clear()

    test_ip = "192.168.1.100"
    
    # Simulate Redis throwing an exception / connection error
    with patch("main.redis_conn") as mock_redis:
        mock_redis.get.side_effect = Exception("Redis Connection Refused")
        with patch("main.list_public_repositories", return_value=[]):
            with patch("main.scan_queue", None):
                # Send 5 requests (up to limit)
                for _ in range(5):
                    res = client.post(
                        "/api/scan",
                        json={"username": "testuser"},
                        headers={"X-Forwarded-For": test_ip}
                    )
                    assert res.status_code == 200

                # 6th request MUST fail with 429 (in-memory rate limiter catches it)
                res_6th = client.post(
                    "/api/scan",
                    json={"username": "testuser"},
                    headers={"X-Forwarded-For": test_ip}
                )
                assert res_6th.status_code == 429
                assert "Per-IP scan rate limit reached" in res_6th.json()["detail"]

def test_custom_github_token_does_not_bypass_ip_limit():
    test_ip = "192.168.1.101"
    now = time.time()
    in_memory_limiter._requests[test_ip] = [now] * 10 # Active timestamps in rolling window

    with patch("main.redis_conn", None): # Force in-memory limiter check
        with patch("main.list_public_repositories", return_value=[]):
            with patch("main.scan_queue", None):
                res = client.post(
                    "/api/scan",
                    json={"username": "testuser", "github_token": "ghp_custom_user_token_12345"},
                    headers={"X-Forwarded-For": test_ip}
                )
                assert res.status_code == 429
                assert "Per-IP scan rate limit reached" in res.json()["detail"]
