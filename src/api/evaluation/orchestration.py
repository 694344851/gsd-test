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
from src.api.evaluation.repository import DatabaseEvaluationRepository, EvaluationRepository

DEFAULT_TIMEOUT_SECONDS = 10.0
ASSISTIVE_NOTICE = "本结果仅用于辅助诊断质量评估，不替代医生临床判断。"


def run_realtime_evaluation(
    request: RealtimeEvaluationRequest,
    *,
    provider: RealtimeEvaluationProvider | None = None,
    repository: EvaluationRepository | None = None,
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
) -> RealtimeEvaluationResult:
    evaluation_id = generate_evaluation_id()
    active_repository = repository or _default_repository()
    if active_repository is not None:
        active_repository.create_attempt(request, evaluation_id=evaluation_id)
    started_at = monotonic()
    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit((provider or HeuristicRealtimeEvaluationProvider()).evaluate, request)

    try:
        payload = future.result(timeout=timeout_seconds)
    except FutureTimeoutError:
        future.cancel()
        result = build_timeout_result(
            evaluation_id=evaluation_id,
            elapsed_ms=_elapsed_ms(started_at),
            timeout_seconds=timeout_seconds,
        )
        if active_repository is not None:
            active_repository.mark_timeout(evaluation_id, request, result)
        return result
    except Exception:
        result = build_failed_result(
            evaluation_id=evaluation_id,
            elapsed_ms=_elapsed_ms(started_at),
        )
        if active_repository is not None:
            active_repository.mark_failed(evaluation_id, request, result)
        return result
    finally:
        executor.shutdown(wait=False, cancel_futures=True)

    result = RealtimeEvaluationResult.from_provider_payload(
        payload,
        evaluation_id=evaluation_id,
        elapsed_ms=_elapsed_ms(started_at),
        assistive_notice=ASSISTIVE_NOTICE,
    )
    if active_repository is not None:
        active_repository.mark_success(evaluation_id, request, result)
    return result


def _elapsed_ms(started_at: float) -> int:
    return int((monotonic() - started_at) * 1000)


def _default_repository() -> EvaluationRepository | None:
    try:
        return DatabaseEvaluationRepository()
    except ValueError:
        return None
