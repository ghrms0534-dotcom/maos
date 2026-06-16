import asyncio

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider

from backend.app.agents.api_agent import run_api_agent
from backend.app.agents.devops_agent import run_devops_agent
from backend.app.agents.prompts import KOREAN_RESPONSE_RULES
from backend.app.config import get_settings
from backend.app.tools.registry import explicitly_requests_multiple_agents, has_api_intent, has_devops_intent


def build_orchestrator_agent() -> Agent[None, str]:
    settings = get_settings()
    model = OpenAIModel(
        settings.ollama_model,
        provider=OpenAIProvider(
            base_url=settings.ollama_openai_base_url,
            api_key="ollama",
        ),
    )
    return Agent(
        model,
        output_type=str,
        system_prompt=(
            "You are a local general-purpose agent. "
            "Answer general chat, knowledge, and coding questions directly. "
            "Do not claim to have used DevOps or API tools unless a specialized agent result is provided. "
            f"{KOREAN_RESPONSE_RULES}"
        ),
    )


async def run_orchestrator_agent(prompt: str) -> str:
    if explicitly_requests_multiple_agents(prompt):
        devops_result, api_result = await asyncio.gather(
            run_devops_agent(prompt),
            run_api_agent(prompt),
        )
        return (
            "DevOps Agent 결과:\n"
            f"{devops_result}\n\n"
            "API Agent 결과:\n"
            f"{api_result}"
        )

    if has_devops_intent(prompt):
        return await run_devops_agent(prompt)

    if has_api_intent(prompt):
        return await run_api_agent(prompt)

    agent = build_orchestrator_agent()
    result = await agent.run(prompt)
    return result.output
