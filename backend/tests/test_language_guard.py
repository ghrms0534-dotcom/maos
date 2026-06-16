from backend.app.agent.language_guard import SAFE_LANGUAGE_FALLBACK, contains_blocked_cjk, ensure_korean_only_answer


KOREAN_HELLO = "\uc548\ub155\ud558\uc138\uc694"
MIXED_CHINESE = "\uc548\ub155\ud558\uc138\uc694 \u5982\u4f55\u53ef\u4ee5\u5e2e\u52a9\u60a8"
JAPANESE_HELLO = "\u3053\u3093\u306b\u3061\u306f"


def test_contains_blocked_cjk_allows_korean() -> None:
    assert contains_blocked_cjk(KOREAN_HELLO) is False
    assert contains_blocked_cjk(f"hello {KOREAN_HELLO} 123") is False


def test_contains_blocked_cjk_blocks_chinese_and_japanese() -> None:
    assert contains_blocked_cjk(MIXED_CHINESE) is True
    assert contains_blocked_cjk(JAPANESE_HELLO) is True


def test_ensure_korean_only_answer_returns_original_when_safe() -> None:
    assert ensure_korean_only_answer(KOREAN_HELLO) == KOREAN_HELLO


def test_ensure_korean_only_answer_returns_fallback_when_blocked() -> None:
    assert ensure_korean_only_answer(MIXED_CHINESE) == SAFE_LANGUAGE_FALLBACK
