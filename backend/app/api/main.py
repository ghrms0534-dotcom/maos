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


async def _stream_chat_events(message: str) -> AsyncIterator[str]:
    yield _trace_event("User Request Received", "Chat request accepted by FastAPI.")

    intent, route = _router_decision(message)
    yield _trace_event("Intent Classification", f"Classified as {intent}.")
    yield _trace_event("MCP Router Decision", f"Routed to {route}.")
    yield _trace_event("Tool Selected", route)
    yield _trace_event("Tool Execution Started", "Existing Agent runner started.")

    try:
        answer = await asyncio.wait_for(runner.run_agent(message), timeout=CHAT_TIMEOUT_SECONDS)
    except TimeoutError:
        yield _trace_event("Tool Response Returned", "Agent response timed out.", "error")
        yield _event({"type": "error", "message": "Agent response timed out."})
        return
    except Exception:
        yield _trace_event("Tool Response Returned", "Agent execution failed.", "error")
        yield _event({"type": "error", "message": "Agent execution failed."})
        return

    yield _trace_event("Tool Response Returned", "Agent runner returned a response.")
    yield _trace_event("LLM Response Generated", "Final answer is ready.")
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
