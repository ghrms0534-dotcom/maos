from fastapi.testclient import TestClient

from backend.app.agent import runner, tools
from backend.app.api.main import app


client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_uses_agent_runner(monkeypatch) -> None:
    async def fake_run_agent(message: str) -> str:
        assert message == "hello"
        return "mock answer"

    monkeypatch.setattr(runner, "run_agent", fake_run_agent)

    response = client.post("/chat", json={"message": "hello"})

    assert response.status_code == 200
    assert response.json() == {"answer": "mock answer"}


def test_api_chat_uses_agent_runner(monkeypatch) -> None:
    async def fake_run_agent(message: str) -> str:
        assert message == "hello"
        return "mock api answer"

    monkeypatch.setattr(runner, "run_agent", fake_run_agent)

    response = client.post("/api/chat", json={"message": "hello"})

    assert response.status_code == 200
    assert response.json() == {"answer": "mock api answer"}


def test_api_chat_handles_agent_error(monkeypatch) -> None:
    async def fake_run_agent(message: str) -> str:
        raise RuntimeError("boom")

    monkeypatch.setattr(runner, "run_agent", fake_run_agent)

    response = client.post("/api/chat", json={"message": "hello"})

    assert response.status_code == 500
    assert response.json() == {"detail": "Agent execution failed."}


def test_tools_uses_tool_listing(monkeypatch) -> None:
    monkeypatch.setattr(
        tools,
        "list_tools",
        lambda: [{"name": "mock_tool", "category": "mock", "description": "mock"}],
    )

    response = client.get("/tools")

    assert response.status_code == 200
    assert response.json() == {
        "tools": [{"name": "mock_tool", "category": "mock", "description": "mock"}]
    }
