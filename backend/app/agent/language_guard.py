import re


BLOCKED_CJK_PATTERN = re.compile(r"[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]")
AWKWARD_MIXED_PATTERN = re.compile(
    r"_[A-Za-z가-힣]{2,}_|[가-힣][A-Za-z]{2,}|[가-힣]+(?:를|을|이|가|은|는|에|에서|으로|와|과|도)\s+[a-z]{3,}"
)
SAFE_LANGUAGE_FALLBACK = "응답에 외국어가 섞여 한국어로 다시 정리하지 못했습니다. 다시 질문해 주세요."


def contains_blocked_cjk(text: str) -> bool:
    return BLOCKED_CJK_PATTERN.search(text) is not None


def contains_awkward_mixed_language(text: str) -> bool:
    return AWKWARD_MIXED_PATTERN.search(text) is not None


def ensure_korean_only_answer(answer: str) -> str:
    if contains_blocked_cjk(answer):
        return SAFE_LANGUAGE_FALLBACK

    return answer


def ensure_natural_korean_answer(answer: str) -> str:
    if contains_awkward_mixed_language(answer):
        return SAFE_LANGUAGE_FALLBACK

    return ensure_korean_only_answer(answer)
