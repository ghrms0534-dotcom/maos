import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from backend.app.agent import runner, tools
from backend.app.api.schemas import ChatRequest, ChatResponse
from backend.app.tools import registry


app = FastAPI(title="pydantic-ai-agent")
CHAT_TIMEOUT_SECONDS = 90

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/tools")
async def get_tools() -> dict[str, list[dict[str, str]]]:
    return {"tools": tools.list_tools()}


def _event(payload: dict[str, str]) -> str:
    return json.dumps(payload, ensure_ascii=False) + "\n"


def _trace_event(label: str, description: str, status: str = "complete") -> str:
    return _event({"type": "trace", "label": label, "description": description, "status": status})


def _router_decision(message: str) -> tuple[str, str]:
    intent = registry.classify_intent(message).value
    if registry.explicitly_requests_multiple_agents(message):
        return intent, "DevOps Agent + API Agent"
    if registry.has_devops_intent(message):
        return intent, "DevOps Agent"
    if registry.has_api_intent(message):
        return intent, "API Agent"
    return intent, "General Orchestrator"


def _selected_tool(message: str) -> str | None:
    normalized = message.lower()
    intent = registry.classify_intent(message)

    if registry.has_git_query_intent(message):
        return "get_git_status"
    if intent == registry.Intent.SUMMARY:
        return "summarize_k8s_pods"
    if intent == registry.Intent.POD:
        return "get_k8s_pods"
    if intent == registry.Intent.DEPLOYMENT:
        return "get_k8s_deployments"
    if intent == registry.Intent.SERVICE:
        return "get_k8s_services"
    if intent == registry.Intent.NAMESPACE:
        return "get_k8s_namespaces"
    if intent == registry.Intent.NODE:
        return "get_k8s_nodes"
    if any(keyword in normalized for keyword in ["public ip", "공인 ip", "퍼블릭 ip"]):
        return "get_public_ip"
    if registry.REPO_PATTERN.search(message) and any(
        keyword in normalized for keyword in ["repo", "repository", "저장소", "github"]
    ):
        return "get_github_repo_info"

    return None


def _activity_intent(intent: str, tool_name: str | None) -> str:
    if tool_name in {
        "get_k8s_pods",
        "summarize_k8s_pods",
        "get_k8s_deployments",
        "get_k8s_services",
        "get_k8s_namespaces",
        "get_k8s_nodes",
    }:
        return "KUBERNETES"
    if tool_name == "get_git_status":
        return "GIT"
    if tool_name == "get_github_repo_info":
        return "GITHUB"
    if tool_name == "get_public_ip":
        return "NETWORK"
    return intent


async def _stream_chat_events(message: str) -> AsyncIterator[str]:
    yield _trace_event("요청 수신", "FastAPI가 사용자 요청을 받았습니다.")

    intent, route = _router_decision(message)
    tool_name = _selected_tool(message)
    yield _trace_event("의도 분석", f"내부 분류: {_activity_intent(intent, tool_name)}")
    yield _trace_event("라우터 판단", f"실행 경로: {route}")
    if tool_name:
        yield _trace_event("도구 선택", f"{tool_name} 선택됨")
        yield _trace_event("도구 실행", "기존 에이전트 러너가 선택된 도구 흐름을 실행합니다.")
    else:
        yield _trace_event("도구 선택", "도구 사용 없음")
        yield _trace_event("에이전트 실행", "기존 에이전트 러너가 일반 응답 흐름을 실행합니다.")

    try:
        answer = await asyncio.wait_for(runner.run_agent(message), timeout=CHAT_TIMEOUT_SECONDS)
    except TimeoutError:
        yield _trace_event("실행 실패", "에이전트 응답 시간이 초과되었습니다.", "error")
        yield _event({"type": "error", "message": "에이전트 응답 시간이 초과되었습니다."})
        return
    except Exception:
        yield _trace_event("실행 실패", "에이전트 실행 중 오류가 발생했습니다.", "error")
        yield _event({"type": "error", "message": "에이전트 실행 중 오류가 발생했습니다."})
        return

    yield _trace_event("응답 생성", "에이전트 러너가 응답을 반환했습니다.")
    yield _trace_event("완료", "최종 답변이 준비되었습니다.")
    yield _event({"type": "answer", "answer": answer})


async def handle_chat(request: ChatRequest) -> ChatResponse:
    try:
        answer = await asyncio.wait_for(
            runner.run_agent(request.message),
            timeout=CHAT_TIMEOUT_SECONDS,
        )
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail="Agent response timed out.") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Agent execution failed.") from exc

    return ChatResponse(answer=answer)


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    return await handle_chat(request)


@app.post("/api/chat", response_model=ChatResponse)
async def api_chat(request: ChatRequest) -> ChatResponse:
    return await handle_chat(request)


@app.post("/api/chat/stream")
async def api_chat_stream(request: ChatRequest) -> StreamingResponse:
    return StreamingResponse(_stream_chat_events(request.message), media_type="application/x-ndjson")
