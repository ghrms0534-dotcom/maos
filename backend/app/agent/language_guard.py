import re


BLOCKED_CJK_PATTERN = re.compile(r"[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]")
SAFE_LANGUAGE_FALLBACK = "응답에 외국어가 섞여 한국어로 다시 정리하지 못했습니다. 다시 질문해 주세요."


def contains_blocked_cjk(text: str) -> bool:
    return BLOCKED_CJK_PATTERN.search(text) is not None


def ensure_korean_only_answer(answer: str) -> str:
    if contains_blocked_cjk(answer):
        return SAFE_LANGUAGE_FALLBACK

    return answer
