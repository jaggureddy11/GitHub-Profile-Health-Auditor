import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime

class GitHubRateLimitError(Exception):
    def __init__(self, message: str, reset_time: Optional[datetime] = None):
        super().__init__(message)
        self.reset_time = reset_time

class GitHubAPIError(Exception):
    pass

async def list_public_repositories(
    username: str, 
    token: Optional[str] = None, 
    per_page: int = 100, 
    max_repos: int = 10
) -> List[Dict[str, Any]]:
    """
    Lists public, non-fork repositories for a given GitHub username sorted by pushed date.
    Caps total results to max_repos (default 10) for fast audit execution.
    """
    username = username.strip()
    if not username:
        raise ValueError("Username cannot be empty")
    if "@" in username:
        raise ValueError("Username cannot be an email address")

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    if token:
        if token.startswith("ghp_") or token.startswith("gho_"):
            headers["Authorization"] = f"token {token}"
        else:
            headers["Authorization"] = f"Bearer {token}"

    repos = []
    page = 1

    async with httpx.AsyncClient(timeout=15.0) as client:
        while len(repos) < max_repos:
            url = f"https://api.github.com/users/{username}/repos?sort=pushed&direction=desc&per_page={per_page}&page={page}"
            try:
                response = await client.get(url, headers=headers)
            except httpx.RequestError as exc:
                raise GitHubAPIError(f"HTTP request failed: {exc}")

            # Handle rate limiting
            if response.status_code in (403, 429):
                rate_limit_remaining = response.headers.get("X-RateLimit-Remaining")
                if rate_limit_remaining == "0":
                    reset_timestamp = response.headers.get("X-RateLimit-Reset")
                    reset_time = None
                    if reset_timestamp:
                        try:
                            reset_time = datetime.fromtimestamp(int(reset_timestamp))
                        except (ValueError, TypeError):
                            pass
                    raise GitHubRateLimitError(
                        "GitHub API rate limit exceeded. Please try again shortly.",
                        reset_time=reset_time
                    )

            if response.status_code != 200:
                raise GitHubAPIError(f"GitHub API returned status {response.status_code}: {response.text}")

            page_data = response.json()
            if not page_data or not isinstance(page_data, list):
                break

            for repo in page_data:
                # Only include public, non-fork repositories
                if not repo.get("fork", False) and not repo.get("private", False):
                    repos.append({
                        "name": repo["name"],
                        "url": repo["html_url"],
                        "last_commit": repo.get("pushed_at"),
                        "default_branch": repo.get("default_branch", "main")
                    })
                if len(repos) >= max_repos:
                    break

            if len(page_data) < per_page:
                break

            page += 1

    return repos
