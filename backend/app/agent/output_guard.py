import json
import re
from typing import Any


RAW_OUTPUT_FALLBACK_PREFIX = "도구 실행은 성공했지만 요약 중 오류가 발생했습니다. 원문 결과는 아래와 같습니다:"
K8S_STATUS_PREFIX = "현재 쿠버네티스 Pod 상태입니다."
K8S_TABLE_HEADER_PATTERN = re.compile(r"NAMESPACE\s+NAME\s+READY\s+STATUS\s+RESTARTS\s+AGE")
K8S_STATUS_PATTERN = re.compile(r"\b(Running|Pending|CrashLoopBackOff|ImagePullBackOff)\b")
JSON_LIKE_PATTERN = re.compile(r"^\s*[\[{][\s\S]*[\]}]\s*$")
YAML_LIKE_PATTERN = re.compile(r"(?m)^\s*[\w.-]+:\s+.+$")
TRACEBACK_PATTERN = re.compile(r"Traceback \(most recent call last\)|^\s*(Error|Exception|RuntimeError):", re.MULTILINE)


def stringify_tool_result(result: Any) -> str:
    if isinstance(result, str):
        return result

    if isinstance(result, dict | list):
        return json.dumps(result, ensure_ascii=False, indent=2)

    return str(result)


def looks_like_kubectl_pod_table(text: str) -> bool:
    return K8S_TABLE_HEADER_PATTERN.search(text) is not None


def looks_like_raw_tool_output(text: str) -> bool:
    if text.startswith("현재 ") and "쿠버네티스" in text:
        return False

    if looks_like_kubectl_pod_table(text):
        return True

    if len(K8S_STATUS_PATTERN.findall(text)) >= 2:
        return True

    stripped = text.strip()
    if JSON_LIKE_PATTERN.match(stripped):
        return True

    if YAML_LIKE_PATTERN.search(text) and "\n" in text:
        return True

    if TRACEBACK_PATTERN.search(text):
        return True

    return False


def build_summarize_prompt(original_message: str, raw_output: str) -> str:
    return (
        "아래는 사용자의 원래 질문과 도구 실행 결과입니다.\n"
        "원본 출력을 그대로 복붙하지 말고, 핵심 상태와 문제가 있으면 원인을 자연스러운 한국어로 요약하세요.\n"
        "kubectl, shell, JSON, YAML, table 출력은 절대 그대로 반환하지 마세요.\n"
        "최종 답변은 반드시 한국어로 작성하세요.\n\n"
        f"[원래 질문]\n{original_message}\n\n"
        f"[도구 실행 결과]\n{raw_output}"
    )


def build_raw_output_fallback(raw_output: Any) -> str:
    raw_text = stringify_tool_result(raw_output)
    if looks_like_kubectl_pod_table(raw_text):
        return f"{K8S_STATUS_PREFIX}\n\n{raw_text}"

    return f"{RAW_OUTPUT_FALLBACK_PREFIX}\n\n{raw_text}"
