from __future__ import annotations

import json
from http import HTTPStatus

from src.api.evaluation.contracts import RequestValidationError, RealtimeEvaluationRequest
from src.api.evaluation.orchestration import DEFAULT_TIMEOUT_SECONDS, run_realtime_evaluation
from src.api.evaluation.provider import RealtimeEvaluationProvider


def handle_realtime_evaluation(
    body: bytes,
    *,
    provider: RealtimeEvaluationProvider | None = None,
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
) -> tuple[dict, HTTPStatus]:
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {"error": "invalid_json"}, HTTPStatus.BAD_REQUEST

    if not isinstance(payload, dict):
        return {"error": "invalid_payload"}, HTTPStatus.BAD_REQUEST

    try:
        request = RealtimeEvaluationRequest.from_dict(payload)
    except RequestValidationError as exc:
        return {"error": str(exc)}, HTTPStatus.BAD_REQUEST

    result = run_realtime_evaluation(request, provider=provider, timeout_seconds=timeout_seconds)
    return result.to_dict(), HTTPStatus.OK
