from pydantic_ai import Agent

from backend.app.agents.orchestrator_agent import build_orchestrator_agent, run_orchestrator_agent


def build_local_agent() -> Agent[None, str]:
    return build_orchestrator_agent()


async def run_local_agent(prompt: str) -> str:
    return await run_orchestrator_agent(prompt)
