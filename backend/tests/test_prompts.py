from backend.app.agents.prompts import KOREAN_RESPONSE_RULES


def test_prompt_contains_korean_response_rules() -> None:
    assert "최종 답변은 반드시 자연스러운 한국어로만 작성한다" in KOREAN_RESPONSE_RULES
    assert "중국어 문장, 중국어 표현, 일본어 문장을 절대 섞지 않는다" in KOREAN_RESPONSE_RULES
    assert "사용자가 영어로 질문해도 기본 답변은 한국어로 한다" in KOREAN_RESPONSE_RULES


def test_prompt_contains_raw_tool_output_rules() -> None:
    assert "tool 결과를 그대로 복붙하지 않는다" in KOREAN_RESPONSE_RULES
    assert "kubectl, shell, JSON, YAML, table 출력은 한국어로 요약한다" in KOREAN_RESPONSE_RULES
    assert "raw output" in KOREAN_RESPONSE_RULES
