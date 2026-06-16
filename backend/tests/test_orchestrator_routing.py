import pytest

from backend.app.agents import orchestrator_agent


@pytest.mark.asyncio
async def test_devops_prompt_runs_only_devops_agent(monkeypatch) -> None:
    calls: list[str] = []

    async def fake_devops(prompt: str) -> str:
        calls.append("devops")
        return "devops result"

    async def fake_api(prompt: str) -> str:
        calls.append("api")
        return "api result"

    monkeypatch.setattr(orchestrator_agent, "run_devops_agent", fake_devops)
    monkeypatch.setattr(orchestrator_agent, "run_api_agent", fake_api)

    result = await orchestrator_agent.run_orchestrator_agent("현재 pods 상태 알려줘")

    assert result == "devops result"
    assert calls == ["devops"]


@pytest.mark.asyncio
async def test_api_prompt_runs_only_api_agent(monkeypatch) -> None:
    calls: list[str] = []

    async def fake_devops(prompt: str) -> str:
        calls.append("devops")
        return "devops result"

    async def fake_api(prompt: str) -> str:
        calls.append("api")
        return "api result"

    monkeypatch.setattr(orchestrator_agent, "run_devops_agent", fake_devops)
    monkeypatch.setattr(orchestrator_agent, "run_api_agent", fake_api)

    result = await orchestrator_agent.run_orchestrator_agent("FastAPI endpoint 하나 만들어줘")

    assert result == "api result"
    assert calls == ["api"]


@pytest.mark.asyncio
async def test_multi_agent_prompt_runs_both_when_explicit(monkeypatch) -> None:
    calls: list[str] = []

    async def fake_devops(prompt: str) -> str:
        calls.append("devops")
        return "devops result"

    async def fake_api(prompt: str) -> str:
        calls.append("api")
        return "api result"

    monkeypatch.setattr(orchestrator_agent, "run_devops_agent", fake_devops)
    monkeypatch.setattr(orchestrator_agent, "run_api_agent", fake_api)

    result = await orchestrator_agent.run_orchestrator_agent("현재 git 상태랑 내 public ip 둘 다 알려줘")

    assert "DevOps Agent 결과:" in result
    assert "API Agent 결과:" in result
    assert calls == ["devops", "api"]


@pytest.mark.asyncio
async def test_general_prompt_uses_general_agent(monkeypatch) -> None:
    calls: list[str] = []

    async def fake_devops(prompt: str) -> str:
        calls.append("devops")
        return "devops result"

    async def fake_api(prompt: str) -> str:
        calls.append("api")
        return "api result"

    class FakeResult:
        output = "general result"

    class FakeAgent:
        async def run(self, prompt: str) -> FakeResult:
            calls.append("general")
            return FakeResult()

    monkeypatch.setattr(orchestrator_agent, "run_devops_agent", fake_devops)
    monkeypatch.setattr(orchestrator_agent, "run_api_agent", fake_api)
    monkeypatch.setattr(orchestrator_agent, "build_orchestrator_agent", lambda: FakeAgent())

    result = await orchestrator_agent.run_orchestrator_agent("파이썬이 뭐야?")

    assert result == "general result"
    assert calls == ["general"]
