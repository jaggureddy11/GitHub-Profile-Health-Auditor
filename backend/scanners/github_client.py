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
    if "github.com/" in username:
        username = username.split("github.com/")[1].split("/")[0]
    username = username.lstrip("@").strip()

    if not username:
        raise ValueError("Username cannot be empty")
    if "@" in username:
        raise ValueError("Username cannot be an email address")

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GitHub-Profile-Health-Auditor"
    }
    if token and token.strip() and not token.startswith("your_") and not token.startswith("placeholder_"):
        if token.startswith("ghp_") or token.startswith("gho_") or token.startswith("github_pat_"):
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

async def get_user_quickstats(username: str, token: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches lightweight user profile and repository metadata from GitHub REST API
    without cloning repositories or running static analysis. Response target: <2s.
    """
    if "github.com/" in username:
        username = username.split("github.com/")[1].split("/")[0]
    username = username.lstrip("@").strip()
    if not username:
        raise ValueError("Username cannot be empty")

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GitHub-Profile-Health-Auditor"
    }
    if token and token.strip() and not token.startswith("your_") and not token.startswith("placeholder_"):
        if token.startswith("ghp_") or token.startswith("gho_") or token.startswith("github_pat_"):
            headers["Authorization"] = f"token {token}"
        else:
            headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Fetch user profile
        user_res = await client.get(f"https://api.github.com/users/{username}", headers=headers)
        if user_res.status_code == 404:
            raise GitHubAPIError(f"GitHub user @{username} not found.")
        if user_res.status_code in (403, 429) and user_res.headers.get("X-RateLimit-Remaining") == "0":
            raise GitHubRateLimitError("GitHub API rate limit exceeded.")
        if user_res.status_code != 200:
            raise GitHubAPIError(f"GitHub API returned status {user_res.status_code}: {user_res.text}")

        profile = user_res.json()

        # 2. Fetch public repos (100 per page)
        repos_res = await client.get(f"https://api.github.com/users/{username}/repos?per_page=100&type=public&sort=pushed", headers=headers)
        repos_data = repos_res.json() if repos_res.status_code == 200 else []

    total_stars = 0
    total_forks = 0
    lang_counts: Dict[str, int] = {}
    last_active_at = None

    if isinstance(repos_data, list):
        for repo in repos_data:
            if not isinstance(repo, dict):
                continue
            total_stars += repo.get("stargazers_count", 0)
            total_forks += repo.get("forks_count", 0)

            lang = repo.get("language")
            if lang and isinstance(lang, str):
                lang_counts[lang] = lang_counts.get(lang, 0) + 1

            pushed_at = repo.get("pushed_at")
            if pushed_at and (last_active_at is None or pushed_at > last_active_at):
                last_active_at = pushed_at

    total_lang_repos = sum(lang_counts.values())
    sorted_langs = sorted(lang_counts.items(), key=lambda x: x[1], reverse=True)

    top_languages = []
    for l_name, count in sorted_langs[:5]:
        pct = round((count / total_lang_repos * 100), 1) if total_lang_repos > 0 else 0.0
        top_languages.append({"name": l_name, "count": count, "percentage": pct})

    return {
        "username": profile.get("login", username),
        "name": profile.get("name"),
        "avatar_url": profile.get("avatar_url"),
        "bio": profile.get("bio"),
        "followers": profile.get("followers", 0),
        "following": profile.get("following", 0),
        "public_repos": profile.get("public_repos", 0),
        "total_stars": total_stars,
        "total_forks": total_forks,
        "top_languages": top_languages,
        "account_created_at": profile.get("created_at"),
        "last_active_at": last_active_at
    }

async def get_user_repositories(
    username: str,
    token: Optional[str] = None,
    max_repos: int = 10
) -> Dict[str, Any]:
    """
    Fetches public, non-fork repositories for a given GitHub username via REST API only.
    No git cloning or static analysis. Returns formatted repo list capped at max_repos.
    """
    if "github.com/" in username:
        username = username.split("github.com/")[1].split("/")[0]
    username = username.lstrip("@").strip()
    if not username:
        raise ValueError("Username cannot be empty")
    if "@" in username:
        raise ValueError("Username cannot be an email address")

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    if token and token.strip() and not token.startswith("your_") and not token.startswith("placeholder_"):
        if token.startswith("ghp_") or token.startswith("gho_") or token.startswith("github_pat_"):
            headers["Authorization"] = f"token {token}"
        else:
            headers["Authorization"] = f"Bearer {token}"

    repos = []
    page = 1
    per_page = 100

    async with httpx.AsyncClient(timeout=15.0) as client:
        while True:
            url = f"https://api.github.com/users/{username}/repos?sort=pushed&direction=desc&per_page={per_page}&page={page}"
            try:
                response = await client.get(url, headers=headers)
            except httpx.RequestError as exc:
                raise GitHubAPIError(f"HTTP request failed: {exc}")

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
                if not repo.get("fork", False) and not repo.get("private", False):
                    repos.append({
                        "name": repo["name"],
                        "description": repo.get("description"),
                        "language": repo.get("language"),
                        "stargazers_count": repo.get("stargazers_count", 0),
                        "forks_count": repo.get("forks_count", 0),
                        "pushed_at": repo.get("pushed_at"),
                        "html_url": repo.get("html_url", f"https://github.com/{username}/{repo['name']}"),
                        "default_branch": repo.get("default_branch", "main")
                    })

            if len(page_data) < per_page:
                break
            page += 1

    capped = len(repos) > max_repos
    return {
        "username": username,
        "total_repos": len(repos),
        "capped": capped,
        "repositories": repos[:max_repos]
    }

async def get_single_repository(
    username: str,
    repo_name: str,
    token: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Fetches metadata for a single specific repository via GitHub API.
    """
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GitHub-Profile-Health-Auditor"
    }
    if token and token.strip() and not token.startswith("your_") and not token.startswith("placeholder_"):
        if token.startswith("ghp_") or token.startswith("gho_") or token.startswith("github_pat_"):
            headers["Authorization"] = f"token {token}"
        else:
            headers["Authorization"] = f"Bearer {token}"

    url = f"https://api.github.com/repos/{username}/{repo_name}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                repo = response.json()
                return {
                    "name": repo["name"],
                    "url": repo.get("html_url", f"https://github.com/{username}/{repo['name']}"),
                    "html_url": repo.get("html_url", f"https://github.com/{username}/{repo['name']}"),
                    "last_commit": repo.get("pushed_at"),
                    "pushed_at": repo.get("pushed_at"),
                    "default_branch": repo.get("default_branch", "main"),
                    "description": repo.get("description", ""),
                    "language": repo.get("language"),
                    "stargazers_count": repo.get("stargazers_count", 0),
                    "forks_count": repo.get("forks_count", 0),
                    "is_target_repo": True
                }
        except Exception:
            pass
    return None
