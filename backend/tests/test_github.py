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
    Test successful repository scraping from HTML.
    """
    page1_html = """
    <div id="user-repositories-list">
        <li class="public source" itemprop="owns">
            <a href="/test-user/repo1" itemprop="name codeRepository">repo1</a>
            <relative-time datetime="2026-01-01T00:00:00Z"></relative-time>
        </li>
        <li class="public fork" itemprop="owns">
            <a href="/test-user/repo-fork" itemprop="name codeRepository">repo-fork</a>
            <relative-time datetime="2026-01-02T00:00:00Z"></relative-time>
        </li>
    </div>
    <a class="next_page" href="/test-user?page=2&tab=repositories">Next</a>
    """
    
    page2_html = """
    <div id="user-repositories-list">
        <li class="public source" itemprop="owns">
            <a href="/test-user/repo2" itemprop="name codeRepository">repo2</a>
            <relative-time datetime="2026-01-03T00:00:00Z"></relative-time>
        </li>
    </div>
    """

    mock_get = AsyncMock()
    
    mock_response_1 = MagicMock()
    mock_response_1.status_code = 200
    mock_response_1.text = page1_html
    
    mock_response_2 = MagicMock()
    mock_response_2.status_code = 200
    mock_response_2.text = page2_html

    mock_get.side_effect = [mock_response_1, mock_response_2]

    with patch("httpx.AsyncClient.get", mock_get):
        result = await list_public_repositories("test-user")
        
        # Should have filtered out the fork repo
        assert len(result) == 2
        assert result[0]["name"] == "repo1"
        assert result[0]["url"] == "https://github.com/test-user/repo1"
        assert result[0]["last_commit"] == "2026-01-01T00:00:00Z"
        assert result[1]["name"] == "repo2"
        assert result[1]["url"] == "https://github.com/test-user/repo2"
        assert result[1]["last_commit"] == "2026-01-03T00:00:00Z"

@pytest.mark.asyncio
async def test_list_public_repositories_rate_limit():
    """
    Test rate limit handling.
    """
    mock_response = MagicMock()
    mock_response.status_code = 429
    
    mock_get = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient.get", mock_get):
        with pytest.raises(GitHubRateLimitError) as exc_info:
            await list_public_repositories("test-user")
        
        assert "rate limit reached" in str(exc_info.value)

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
