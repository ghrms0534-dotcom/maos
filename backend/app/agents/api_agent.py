from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider

from backend.app.agents.prompts import KOREAN_RESPONSE_RULES
from backend.app.config import get_settings
from backend.app.tools.registry import register_api_tools, route_api_tool_call


def build_api_agent() -> Agent[None, str]:
    settings = get_settings()
    model = OpenAIModel(
        settings.ollama_model,
        provider=OpenAIProvider(
            base_url=settings.ollama_openai_base_url,
            api_key="ollama",
        ),
    )
    agent = Agent(
        model,
        output_type=str,
        system_prompt=(
            "You are a public API-focused local agent. "
            "Use get_public_ip for public IP questions and get_github_repo_info for GitHub repository questions. "
            f"{KOREAN_RESPONSE_RULES}"
        ),
    )
    register_api_tools(agent)
    return agent


async def run_api_agent(prompt: str) -> str:
    routed_result = route_api_tool_call(prompt)
    if routed_result is not None:
        return routed_result

    agent = build_api_agent()
    result = await agent.run(prompt)
    return result.output
