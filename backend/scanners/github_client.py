import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime

class GitHubRateLimitError(Exception):
    def __init__(self, message: str, reset_time: Optional[datetime] = None):
        super().__init__(message)
        self.reset_time = reset_time

class GitHubAPIError(Exception):
    pass

async def list_public_repositories(username: str, token: Optional[str] = None, per_page: int = 100) -> List[Dict[str, Any]]:
    """
    Lists all public, non-fork repositories for a given GitHub username.
    Handles pagination and rate-limit headers.
    """
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    if token:
        # Standard format is 'Bearer <token>' or 'token <token>'
        headers["Authorization"] = f"Bearer {token}"

    repos = []
    page = 1


    async with httpx.AsyncClient(timeout=15.0) as client:
        while True:
            url = f"https://api.github.com/users/{username}/repos?per_page={per_page}&page={page}"
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
                        "GitHub API rate limit exceeded. Please provide a GITHUB_TOKEN to increase limits.",
                        reset_time=reset_time
                    )

            if response.status_code != 200:
                raise GitHubAPIError(f"GitHub API returned status {response.status_code}: {response.text}")

            page_data = response.json()
            if not page_data:
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

            # If the response returned fewer items than per_page, we've reached the end
            if len(page_data) < per_page:
                break

            page += 1

    return repos
