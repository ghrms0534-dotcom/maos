import httpx


def get_public_ip() -> str:
    """Return the current public IP address."""

    try:
        response = httpx.get("https://api.ipify.org?format=json", timeout=10.0)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        return f"Public IP API returned {exc.response.status_code}."
    except httpx.HTTPError as exc:
        return f"Failed to request public IP: {exc}"

    ip = response.json().get("ip")
    if not ip:
        return "Public IP API response did not include an IP address."

    return f"public_ip: {ip}"
