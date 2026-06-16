import asyncio
import sys
from pathlib import Path

import httpx

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.config import Settings  # noqa: E402


async def check_ollama_connection() -> None:
    settings = Settings()
    async with httpx.AsyncClient(base_url=settings.ollama_base_url, timeout=10.0) as client:
        response = await client.get("/api/tags")
        response.raise_for_status()
        data = response.json()

    models = {model.get("name") for model in data.get("models", [])}
    print(f"Ollama connection OK: {settings.ollama_base_url}")
    print(f"Configured model: {settings.ollama_model}")

    if settings.ollama_model in models:
        print("Configured model is available locally.")
    else:
        print("Configured model was not found in Ollama. Run:")
        print(f"ollama pull {settings.ollama_model}")


def main() -> None:
    asyncio.run(check_ollama_connection())


if __name__ == "__main__":
    main()
