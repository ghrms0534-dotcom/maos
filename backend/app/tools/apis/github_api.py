from typing import Any

import httpx


def get_github_repo_info(owner: str, repo: str) -> str:
    """Return public GitHub repository info for the given owner and repo."""

    url = f"https://api.github.com/repos/{owner}/{repo}"

    try:
        response = httpx.get(
            url,
            headers={"Accept": "application/vnd.github+json"},
            follow_redirects=True,
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        return f"GitHub API returned {exc.response.status_code} for {owner}/{repo}."
    except httpx.HTTPError as exc:
        return f"Failed to request GitHub repo info: {exc}"

    data: dict[str, Any] = response.json()
    return "\n".join(
        [
            f"full_name: {data.get('full_name')}",
            f"stars: {data.get('stargazers_count')}",
            f"forks: {data.get('forks_count')}",
            f"default_branch: {data.get('default_branch')}",
            f"html_url: {data.get('html_url')}",
        ]
    )
