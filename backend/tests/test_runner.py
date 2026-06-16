import pytest

from backend.app.agent import runner
from backend.app.agent.language_guard import SAFE_LANGUAGE_FALLBACK
from backend.app.agent.output_guard import RAW_OUTPUT_FALLBACK_PREFIX


KUBECTL_RAW_OUTPUT = """NAMESPACE     NAME                         READY   STATUS    RESTARTS   AGE
default       api-55d8c7f7d9-abcde          1/1     Running   0          10m
kube-system   coredns-668d6bf9bc-xyz12      1/1     Running   0          5m
"""
KOREAN_OK = "\uc548\ub155\ud558\uc138\uc694! \ubb34\uc5c7\uc744 \ub3c4\uc640\ub4dc\ub9b4\uae4c\uc694?"
MIXED_CHINESE = "\uc548\ub155\ud558\uc138\uc694 \u5982\u4f55\u53ef\u4ee5\u5e2e\u52a9\u60a8"


@pytest.mark.asyncio
async def test_run_agent_retries_once_when_answer_contains_blocked_cjk(monkeypatch) -> None:
    calls: list[str] = []
    answers = [MIXED_CHINESE, KOREAN_OK]

    async def fake_call_agent_once(message: str) -> str:
        calls.append(message)
        return answers[len(calls) - 1]

    monkeypatch.setattr(runner, "_call_agent_once", fake_call_agent_once)

    answer = await runner.run_agent("hello")

    assert answer == KOREAN_OK
    assert len(calls) == 2
    assert "주의: 방금 답변에 중국어 또는 일본어가 섞였다" in calls[1]


@pytest.mark.asyncio
async def test_run_agent_returns_language_fallback_when_retry_still_contains_blocked_cjk(monkeypatch) -> None:
    calls: list[str] = []

    async def fake_call_agent_once(message: str) -> str:
        calls.append(message)
        return MIXED_CHINESE

    monkeypatch.setattr(runner, "_call_agent_once", fake_call_agent_once)

    answer = await runner.run_agent("hello")

    assert answer == SAFE_LANGUAGE_FALLBACK
    assert len(calls) == 2


@pytest.mark.asyncio
async def test_run_agent_summarizes_raw_tool_output(monkeypatch) -> None:
    calls: list[str] = []
    summary = "현재 Kubernetes Pod 2개가 실행 중이며 모두 Running 상태입니다."
    answers = [KUBECTL_RAW_OUTPUT, summary]

    async def fake_call_agent_once(message: str) -> str:
        calls.append(message)
        return answers[len(calls) - 1]

    monkeypatch.setattr(runner, "_call_agent_once", fake_call_agent_once)

    answer = await runner.run_agent("pod status")

    assert answer == summary
    assert len(calls) == 2
    assert "원본 출력을 그대로 복붙하지 말고" in calls[1]


@pytest.mark.asyncio
async def test_run_agent_includes_raw_output_when_summary_still_raw(monkeypatch) -> None:
    calls: list[str] = []

    async def fake_call_agent_once(message: str) -> str:
        calls.append(message)
        return KUBECTL_RAW_OUTPUT

    monkeypatch.setattr(runner, "_call_agent_once", fake_call_agent_once)

    answer = await runner.run_agent("pod status")

    assert answer.startswith("현재 쿠버네티스 Pod 상태입니다.")
    assert "NAMESPACE" in answer
    assert "READY" in answer
    assert "STATUS" in answer
    assert "RESTARTS" in answer
    assert "AGE" in answer
    assert len(calls) == 2


@pytest.mark.asyncio
async def test_run_agent_includes_raw_output_when_summary_raises(monkeypatch) -> None:
    calls: list[str] = []

    async def fake_call_agent_once(message: str) -> str:
        calls.append(message)
        if len(calls) == 1:
            return '{"status": "ok"}'
        raise RuntimeError("summary failed")

    monkeypatch.setattr(runner, "_call_agent_once", fake_call_agent_once)

    answer = await runner.run_agent("status")

    assert RAW_OUTPUT_FALLBACK_PREFIX in answer
    assert '"status": "ok"' in answer
    assert len(calls) == 2


@pytest.mark.asyncio
async def test_run_agent_stringifies_dict_tool_result(monkeypatch) -> None:
    calls: list[str] = []

    async def fake_call_agent_once(message: str):
        calls.append(message)
        if len(calls) == 1:
            return {"status": "ok"}
        return "상태는 정상입니다."

    monkeypatch.setattr(runner, "_call_agent_once", fake_call_agent_once)

    answer = await runner.run_agent("status")

    assert answer == "상태는 정상입니다."
    assert len(calls) == 2
