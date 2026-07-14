import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
from bs4 import BeautifulSoup

class GitHubRateLimitError(Exception):
    def __init__(self, message: str, reset_time: Optional[datetime] = None):
        super().__init__(message)
        self.reset_time = reset_time

class GitHubAPIError(Exception):
    pass

async def list_public_repositories(username: str, token: Optional[str] = None, per_page: int = 100) -> List[Dict[str, Any]]:
    """
    Lists all public, non-fork repositories for a given GitHub username.
    This function scrapes the public repositories tab HTML page directly to list repositories.
    """
    repos = []
    url = f"https://github.com/{username}?tab=repositories"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        while url:
            try:
                response = await client.get(url, headers=headers)
                
                # Check for rate limit responses (429 or 403 on too many requests)
                if response.status_code in (403, 429):
                    raise GitHubRateLimitError(
                        "GitHub rate limit reached during page scraping. Please try again later."
                    )
                
                if response.status_code == 404:
                    raise GitHubAPIError(f"GitHub profile for user '{username}' was not found (404).")
                    
                if response.status_code != 200:
                    raise GitHubAPIError(f"GitHub returned HTTP status {response.status_code} during scraping.")
                    
            except httpx.RequestError as exc:
                raise GitHubAPIError(f"Failed to scrape repositories due to connection error: {exc}")

            soup = BeautifulSoup(response.text, "html.parser")
            
            repo_list_div = soup.find("div", id="user-repositories-list")
            if not repo_list_div:
                # No repositories tab container found
                break
                
            repo_items = repo_list_div.find_all("li", itemprop="owns")
            for item in repo_items:
                a_tag = item.find("a", itemprop="name codeRepository")
                if not a_tag:
                    continue
                repo_name = a_tag.get_text().strip()
                repo_href = a_tag.get("href")
                repo_url = f"https://github.com{repo_href}"

                # Fork check: ignore forks
                is_fork = "fork" in item.get("class", []) or item.find("span", class_="f6 color-fg-muted mb-1")
                if is_fork:
                    continue

                relative_time_tag = item.find("relative-time")
                last_commit = None
                if relative_time_tag:
                    last_commit = relative_time_tag.get("datetime")

                repos.append({
                    "name": repo_name,
                    "url": repo_url,
                    "last_commit": last_commit,
                    "default_branch": "main" # Default branch is resolved during cloning anyway
                })

            # Handle pagination
            next_page_tag = soup.find("a", class_="next_page")
            if next_page_tag and next_page_tag.get("href"):
                next_page_href = next_page_tag.get("href")
                if next_page_href.startswith("/"):
                    url = f"https://github.com{next_page_href}"
                else:
                    url = next_page_href
            else:
                url = None

    return repos
