import shutil


def _command_status(command: str) -> tuple[str, str]:
    if shutil.which(command):
        return "active", f"{command} found on PATH"
    return "inactive", f"{command} not found on PATH"


def _registered_status() -> tuple[str, str]:
    return "active", "registered in tool registry"


def list_tools() -> list[dict[str, str]]:
    git_status, git_detail = _command_status("git")
    k8s_status, k8s_detail = _command_status("kubectl")
    api_status, api_detail = _registered_status()

    return [
        {
            "name": "get_git_status",
            "category": "devops",
            "description": "Run git status --short.",
            "status": git_status,
            "detail": git_detail,
        },
        {
            "name": "get_k8s_pods",
            "category": "devops",
            "description": "Run kubectl get pods -A.",
            "status": k8s_status,
            "detail": k8s_detail,
        },
        {
            "name": "get_github_repo_info",
            "category": "api",
            "description": "Fetch public GitHub repository information.",
            "status": api_status,
            "detail": api_detail,
        },
        {
            "name": "get_public_ip",
            "category": "api",
            "description": "Fetch the current public IP address.",
            "status": api_status,
            "detail": api_detail,
        },
    ]
