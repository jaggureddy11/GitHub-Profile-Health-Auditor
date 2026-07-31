import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from main import app, _quickstats_memory_cache, in_memory_limiter

client = TestClient(app)

class MockHttpResponse:
    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self._json_data = json_data
        self.headers = {"X-RateLimit-Remaining": "60"}
        self.text = "Mock Error"
    def json(self):
        return self._json_data

def test_quickstats_returns_aggregated_metrics():
    _quickstats_memory_cache.clear()
    mock_profile = {
        "login": "testdev",
        "name": "Test Developer",
        "avatar_url": "https://avatars.githubusercontent.com/u/123456",
        "bio": "Building security-first tools.",
        "followers": 150,
        "following": 45,
        "public_repos": 3,
        "created_at": "2020-01-15T10:00:00Z"
    }

    mock_repos = [
        {"name": "repo1", "stargazers_count": 10, "forks_count": 2, "language": "Python", "pushed_at": "2026-05-10T12:00:00Z"},
        {"name": "repo2", "stargazers_count": 25, "forks_count": 5, "language": "Python", "pushed_at": "2026-06-01T15:30:00Z"},
        {"name": "repo3", "stargazers_count": 5, "forks_count": 1, "language": "TypeScript", "pushed_at": "2026-04-20T09:00:00Z"},
    ]

    async def mock_get(*args, **kwargs):
        url = ""
        for a in args:
            s = str(a)
            if "api.github.com" in s or "/users/" in s:
                url = s
                break
        if not url:
            url = str(kwargs.get("url", ""))

        if "/users/testdev/repos" in url:
            return MockHttpResponse(200, mock_repos)
        elif "/users/testdev" in url:
            return MockHttpResponse(200, mock_profile)
        return MockHttpResponse(404, {})

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        res = client.get("/api/profile/testdev/quickstats")
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["username"] == "testdev"
        assert data["name"] == "Test Developer"
        assert data["avatar_url"] == "https://avatars.githubusercontent.com/u/123456"
        assert data["bio"] == "Building security-first tools."
        assert data["followers"] == 150
        assert data["following"] == 45
        assert data["public_repos"] == 3
        assert data["total_stars"] == 40
        assert data["total_forks"] == 8
        assert data["last_active_at"] == "2026-06-01T15:30:00Z"
        
        # Verify language aggregation (Python: 2 repos = 66.7%, TypeScript: 1 repo = 33.3%)
        langs = {l["name"]: l["percentage"] for l in data["top_languages"]}
        assert "Python" in langs
        assert langs["Python"] == 66.7
        assert "TypeScript" in langs
        assert langs["TypeScript"] == 33.3

def test_quickstats_never_calls_scanners():
    _quickstats_memory_cache.clear()
    mock_profile = {"login": "fastdev", "followers": 10, "following": 5, "public_repos": 1}
    mock_repos = [{"name": "fastrepo", "stargazers_count": 1, "forks_count": 0, "language": "Go"}]

    async def mock_get(url, headers=None):
        if "/repos" in url:
            return MockHttpResponse(200, mock_repos)
        return MockHttpResponse(200, mock_profile)

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        with patch("scanners.orchestrator.clone_repo") as mock_clone, \
             patch("scanners.trufflehog.scan_secrets") as mock_truffle, \
             patch("scanners.semgrep.scan_smells") as mock_semgrep, \
             patch("scanners.orchestrator.run_scan_job") as mock_worker:
            
            res = client.get("/api/profile/fastdev/quickstats")
            assert res.status_code == 200, res.text

            # Absolute isolation check: quickstats MUST NEVER invoke scanner or worker functions
            mock_clone.assert_not_called()
            mock_truffle.assert_not_called()
            mock_semgrep.assert_not_called()
            mock_worker.assert_not_called()

def test_quickstats_15min_cache_hit():
    _quickstats_memory_cache.clear()
    mock_profile = {"login": "cacheduser", "followers": 5, "following": 2, "public_repos": 1}
    mock_repos = [{"name": "cacherepo", "stargazers_count": 3, "forks_count": 1, "language": "Rust"}]

    call_count = 0
    async def mock_get(url, headers=None):
        nonlocal call_count
        call_count += 1
        if "/repos" in url:
            return MockHttpResponse(200, mock_repos)
        return MockHttpResponse(200, mock_profile)

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        # 1st call populates cache
        res1 = client.get("/api/profile/cacheduser/quickstats")
        assert res1.status_code == 200
        initial_calls = call_count

        # 2nd call should hit cache without issuing new HTTP requests
        res2 = client.get("/api/profile/cacheduser/quickstats")
        assert res2.status_code == 200
        assert call_count == initial_calls, "Subsequent call must hit 15-minute cache without making HTTP calls"
        assert res1.json() == res2.json()

def test_quickstats_independent_ip_rate_limiting():
    _quickstats_memory_cache.clear()
    headers = {"x-forwarded-for": "198.51.100.99"}

    mock_profile = {"login": "ratelimiteduser", "followers": 0, "following": 0, "public_repos": 0}
    mock_repos = []

    async def mock_get(url, headers=None):
        return MockHttpResponse(200, mock_profile)

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        with patch("main.redis_conn", None):
            with patch("main.RATE_LIMIT_QUICKSTATS_PER_IP_24H", 3):
                in_memory_limiter._requests.pop("quickstats:198.51.100.99", None)
                # Make 3 requests (up to limit) with unique usernames to bypass cache
                for i in range(3):
                    res = client.get(f"/api/profile/user{i}/quickstats", headers=headers)
                    assert res.status_code == 200, f"Request {i+1} failed"

                # 4th request must fail with 429 Rate Limit
                res_exceeded = client.get("/api/profile/user99/quickstats", headers=headers)
                assert res_exceeded.status_code == 429
                assert "quickstats rate limit reached" in res_exceeded.json()["detail"].lower()
