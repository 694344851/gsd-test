from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from time import monotonic

from src.api.evaluation.contracts import (
    RealtimeEvaluationRequest,
    RealtimeEvaluationResult,
    build_failed_result,
    build_timeout_result,
    generate_evaluation_id,
)
from src.api.evaluation.provider import HeuristicRealtimeEvaluationProvider, RealtimeEvaluationProvider

DEFAULT_TIMEOUT_SECONDS = 10.0
ASSISTIVE_NOTICE = "本结果仅用于辅助诊断质量评估，不替代医生临床判断。"


def run_realtime_evaluation(
    request: RealtimeEvaluationRequest,
    *,
    provider: RealtimeEvaluationProvider | None = None,
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
) -> RealtimeEvaluationResult:
    evaluation_id = generate_evaluation_id()
    started_at = monotonic()
    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit((provider or HeuristicRealtimeEvaluationProvider()).evaluate, request)

    try:
        payload = future.result(timeout=timeout_seconds)
    except FutureTimeoutError:
        future.cancel()
        return build_timeout_result(
            evaluation_id=evaluation_id,
            elapsed_ms=_elapsed_ms(started_at),
            timeout_seconds=timeout_seconds,
        )
    except Exception:
        return build_failed_result(
            evaluation_id=evaluation_id,
            elapsed_ms=_elapsed_ms(started_at),
        )
    finally:
        executor.shutdown(wait=False, cancel_futures=True)

    return RealtimeEvaluationResult.from_provider_payload(
        payload,
        evaluation_id=evaluation_id,
        elapsed_ms=_elapsed_ms(started_at),
        assistive_notice=ASSISTIVE_NOTICE,
    )


def _elapsed_ms(started_at: float) -> int:
    return int((monotonic() - started_at) * 1000)
