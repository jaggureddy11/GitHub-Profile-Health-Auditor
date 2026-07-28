import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from main import app, _repos_memory_cache

client = TestClient(app)

class MockHttpResponse:
    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self._json_data = json_data
        self.headers = {"X-RateLimit-Remaining": "60"}
        self.text = "Mock Error"
    def json(self):
        return self._json_data

def test_get_profile_repositories_success():
    _repos_memory_cache.clear()
    mock_repos = [
        {
            "name": "audit-tool",
            "description": "Security profile auditor",
            "language": "Python",
            "stargazers_count": 42,
            "forks_count": 5,
            "pushed_at": "2026-07-28T10:00:00Z",
            "html_url": "https://github.com/octocat/audit-tool",
            "default_branch": "main",
            "fork": False,
            "private": False
        },
        {
            "name": "react-app",
            "description": "Frontend SPA dashboard",
            "language": "TypeScript",
            "stargazers_count": 12,
            "forks_count": 1,
            "pushed_at": "2026-06-15T12:00:00Z",
            "html_url": "https://github.com/octocat/react-app",
            "default_branch": "main",
            "fork": False,
            "private": False
        }
    ]

    async def mock_get(url, headers=None):
        return MockHttpResponse(200, mock_repos)

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        res = client.get("/api/profile/octocat/repos")
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["username"] == "octocat"
        assert data["total_repos"] == 2
        assert data["capped"] is False
        assert len(data["repositories"]) == 2

        first = data["repositories"][0]
        assert first["name"] == "audit-tool"
        assert first["description"] == "Security profile auditor"
        assert first["language"] == "Python"
        assert first["stargazers_count"] == 42
        assert first["forks_count"] == 5
        assert first["html_url"] == "https://github.com/octocat/audit-tool"

def test_get_profile_repositories_never_calls_scanners():
    _repos_memory_cache.clear()
    mock_repos = [{"name": "repo1", "html_url": "https://github.com/fastdev/repo1", "fork": False, "private": False}]

    async def mock_get(url, headers=None):
        return MockHttpResponse(200, mock_repos)

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        with patch("scanners.orchestrator.clone_repo") as mock_clone, \
             patch("scanners.trufflehog.scan_secrets") as mock_truffle, \
             patch("scanners.semgrep.scan_smells") as mock_semgrep, \
             patch("scanners.orchestrator.run_scan_job") as mock_worker:

            res = client.get("/api/profile/fastdev/repos")
            assert res.status_code == 200, res.text

            # Verify complete scanner isolation
            mock_clone.assert_not_called()
            mock_truffle.assert_not_called()
            mock_semgrep.assert_not_called()
            mock_worker.assert_not_called()

def test_get_profile_repositories_respects_max_cap():
    _repos_memory_cache.clear()
    # Generate 15 mock repositories
    mock_repos = [
        {
            "name": f"repo-{i}",
            "description": f"Repo {i}",
            "language": "Python",
            "stargazers_count": i,
            "forks_count": 0,
            "pushed_at": "2026-01-01T00:00:00Z",
            "html_url": f"https://github.com/manyrepos/repo-{i}",
            "default_branch": "main",
            "fork": False,
            "private": False
        }
        for i in range(15)
    ]

    async def mock_get(url, headers=None):
        return MockHttpResponse(200, mock_repos)

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        with patch.dict("os.environ", {"MAX_REPOS_PER_SCAN": "5"}):
            res = client.get("/api/profile/manyrepos/repos")
            assert res.status_code == 200, res.text
            data = res.json()
            assert data["username"] == "manyrepos"
            assert data["total_repos"] == 15
            assert data["capped"] is True
            assert len(data["repositories"]) == 5
