import pytest
import sys
import os
import uuid
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
    # Create tables, register, and login test user
    from database import Base, engine, SessionLocal
    import models
    from main import hash_password
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == "scan-user@example.com").first()
    email = f"scan-user-{uuid.uuid4()}@example.com"
    user = models.User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hash_password("password123")
    )
    db.add(user)
    db.commit()
    db.close()

    login_res = client.post("/api/auth/login", json={"email": email, "password": "password123"})
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    mock_repos = [
        {"name": "repo1", "url": "https://github.com/user/repo1", "last_commit": "2026-01-01T00:00:00Z", "default_branch": "main"}
    ]
    
    async_mock = AsyncMock(return_value=mock_repos)
    
    from main import check_rate_limit
    app.dependency_overrides[check_rate_limit] = lambda: None
    try:
        with patch("main.list_public_repositories", async_mock):
            with patch("main.scan_queue", None):
                response = client.post("/api/scan", json={"username": "test-user", "github_token": "dummy"}, headers=auth_headers)
                
                assert response.status_code == 200
                data = response.json()
                assert data["username"] == "test-user"
                assert len(data["repositories"]) == 1
                assert data["repositories"][0]["name"] == "repo1"
                assert data["status"] == "pending"
                assert "scan_id" in data
    finally:
        app.dependency_overrides.pop(check_rate_limit, None)

def test_username_validation_scan_request():
    """
    Test pydantic model ScanRequest validation rules for username.
    """
    from schemas import ScanRequest
    from pydantic import ValidationError

    # Valid usernames
    req = ScanRequest(username="  valid-user  ", github_token="dummy")
    assert req.username == "valid-user" # trimmed

    # Empty username
    with pytest.raises(ValidationError) as exc_info:
        ScanRequest(username="   ", github_token="dummy")
    assert "Username cannot be empty" in str(exc_info.value)

    # Email as username
    with pytest.raises(ValidationError) as exc_info:
        ScanRequest(username="user@example.com", github_token="dummy")
    assert "Username cannot be an email address" in str(exc_info.value)

@pytest.mark.asyncio
async def test_list_public_repositories_token_types():
    """
    Test that correct Authorization header formats are sent for different token types.
    """
    mock_get = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = []
    mock_get.return_value = mock_response

    with patch("httpx.AsyncClient.get", mock_get):
        # 1. Classic PAT (ghp_) should use 'token <token>'
        await list_public_repositories("test-user", token="ghp_classicToken123")
        called_headers_1 = mock_get.call_args[1]["headers"]
        assert called_headers_1["Authorization"] == "token ghp_classicToken123"

        # 2. OAuth token (gho_) should use 'token <token>'
        await list_public_repositories("test-user", token="gho_oauthToken123")
        called_headers_2 = mock_get.call_args[1]["headers"]
        assert called_headers_2["Authorization"] == "token gho_oauthToken123"

        # 3. Fine-grained PAT (github_pat_) should use 'Bearer <token>'
        await list_public_repositories("test-user", token="github_pat_fineGrained123")
        called_headers_3 = mock_get.call_args[1]["headers"]
        assert called_headers_3["Authorization"] == "Bearer github_pat_fineGrained123"
