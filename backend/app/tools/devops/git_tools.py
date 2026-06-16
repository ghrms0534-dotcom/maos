import subprocess


def get_git_status() -> str:
    """Return the current git status using `git status --short`."""

    try:
        result = subprocess.run(
            ["git", "status", "--short"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return "git status timed out after 10 seconds."
    except OSError as exc:
        return f"Failed to run git status: {exc}"

    output = result.stdout.strip()
    error = result.stderr.strip()

    if result.returncode != 0:
        return error or f"git status failed with exit code {result.returncode}."

    return output or "Git working tree is clean."
