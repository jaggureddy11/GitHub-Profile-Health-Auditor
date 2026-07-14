import pytest
import sys
import os
from unittest.mock import AsyncMock, patch, MagicMock

# Ensure the parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scanners.github_client import list_public_repositories, GitHubRateLimitError, GitHubAPIError
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_list_public_repositories_success():
    """
    Test successful repository listing including pagination and filtering.
    """
    mock_repos_page1 = [
        {"name": "repo1", "html_url": "https://github.com/user/repo1", "fork": False, "pushed_at": "2026-01-01T00:00:00Z", "default_branch": "main"},
        {"name": "repo-fork", "html_url": "https://github.com/user/repo-fork", "fork": True, "pushed_at": "2026-01-02T00:00:00Z", "default_branch": "main"},
    ]
    mock_repos_page2 = [
        {"name": "repo2", "html_url": "https://github.com/user/repo2", "fork": False, "pushed_at": "2026-01-03T00:00:00Z", "default_branch": "develop"},
    ]

    mock_get = AsyncMock()
    
    mock_response_1 = MagicMock()
    mock_response_1.status_code = 200
    mock_response_1.json.return_value = mock_repos_page1
    
    mock_response_2 = MagicMock()
    mock_response_2.status_code = 200
    mock_response_2.json.return_value = mock_repos_page2

    mock_response_empty = MagicMock()
    mock_response_empty.status_code = 200
    mock_response_empty.json.return_value = []

    mock_get.side_effect = [mock_response_1, mock_response_2, mock_response_empty]

    with patch("httpx.AsyncClient.get", mock_get):
        result = await list_public_repositories("test-user", per_page=2)
        
        assert len(result) == 2
        assert result[0]["name"] == "repo1"
        assert result[0]["default_branch"] == "main"
        assert result[1]["name"] == "repo2"
        assert result[1]["default_branch"] == "develop"

@pytest.mark.asyncio
async def test_list_public_repositories_rate_limit():
    """
    Test rate limit handling.
    """
    mock_response = MagicMock()
    mock_response.status_code = 403
    mock_response.headers = {
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "1773010000"
    }
    
    mock_get = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient.get", mock_get):
        with pytest.raises(GitHubRateLimitError) as exc_info:
            await list_public_repositories("test-user")
        
        assert "rate limit exceeded" in str(exc_info.value)
        assert exc_info.value.reset_time is not None

def test_api_scan_endpoint_success():
    """
    Test POST /api/scan endpoint with a mocked list_public_repositories function.
    """
    mock_repos = [
        {"name": "repo1", "url": "https://github.com/user/repo1", "last_commit": "2026-01-01T00:00:00Z", "default_branch": "main"}
    ]
    
    async_mock = AsyncMock(return_value=mock_repos)
    
    with patch("main.list_public_repositories", async_mock):
        with patch("main.scan_queue", None):
            response = client.post("/api/scan", json={"username": "test-user", "github_token": "dummy"})
            
            assert response.status_code == 200
            data = response.json()
            assert data["username"] == "test-user"
            assert len(data["repositories"]) == 1
            assert data["repositories"][0]["name"] == "repo1"
            assert data["status"] == "pending"
            assert "scan_id" in data
