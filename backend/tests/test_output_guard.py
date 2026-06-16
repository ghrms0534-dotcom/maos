from backend.app.agent.output_guard import (
    RAW_OUTPUT_FALLBACK_PREFIX,
    build_raw_output_fallback,
    build_summarize_prompt,
    looks_like_raw_tool_output,
    stringify_tool_result,
)


KUBECTL_RAW_OUTPUT = """NAMESPACE     NAME                         READY   STATUS    RESTARTS   AGE
default       api-55d8c7f7d9-abcde          1/1     Running   0          10m
kube-system   coredns-668d6bf9bc-xyz12      1/1     Running   0          5m
"""


def test_detects_raw_kubectl_output() -> None:
    assert looks_like_raw_tool_output(KUBECTL_RAW_OUTPUT) is True


def test_detects_repeated_kubernetes_status_values() -> None:
    assert looks_like_raw_tool_output("pod-a Running\npod-b CrashLoopBackOff") is True


def test_detects_json_yaml_and_traceback() -> None:
    assert looks_like_raw_tool_output('{"status": "ok"}') is True
    assert looks_like_raw_tool_output("status: ok\nname: api") is True
    assert looks_like_raw_tool_output("Traceback (most recent call last):\nRuntimeError: boom") is True


def test_does_not_detect_normal_korean_sentence() -> None:
    assert looks_like_raw_tool_output("현재 상태는 정상입니다.") is False


def test_build_summarize_prompt_contains_original_message_and_raw_output() -> None:
    prompt = build_summarize_prompt("pod status", KUBECTL_RAW_OUTPUT)

    assert "pod status" in prompt
    assert "NAMESPACE" in prompt
    assert "원본 출력을 그대로 복붙하지 말고" in prompt


def test_raw_output_fallback_includes_raw_result() -> None:
    fallback = build_raw_output_fallback({"status": "ok"})

    assert fallback.startswith(RAW_OUTPUT_FALLBACK_PREFIX)
    assert '"status": "ok"' in fallback


def test_kubectl_table_fallback_keeps_readable_table() -> None:
    fallback = build_raw_output_fallback(KUBECTL_RAW_OUTPUT)

    assert fallback.startswith("현재 쿠버네티스 Pod 상태입니다.")
    assert "NAMESPACE" in fallback
    assert "READY" in fallback


def test_stringify_tool_result_formats_dict_and_list() -> None:
    assert stringify_tool_result({"status": "ok"}) == '{\n  "status": "ok"\n}'
    assert stringify_tool_result([{"name": "api"}]) == '[\n  {\n    "name": "api"\n  }\n]'
