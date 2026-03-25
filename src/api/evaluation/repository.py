from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol, cast

from src.api.evaluation.contracts import (
    RealtimeEvaluationRequest,
    RealtimeEvaluationResult,
    generate_evaluation_id,
)


class EvaluationRepository(Protocol):
    def create_attempt(self, request: RealtimeEvaluationRequest, *, evaluation_id: str | None = None) -> str:
        ...

    def mark_success(self, evaluation_id: str, request: RealtimeEvaluationRequest, result: RealtimeEvaluationResult) -> None:
        ...

    def mark_timeout(self, evaluation_id: str, request: RealtimeEvaluationRequest, result: RealtimeEvaluationResult) -> None:
        ...

    def mark_failed(self, evaluation_id: str, request: RealtimeEvaluationRequest, result: RealtimeEvaluationResult) -> None:
        ...


@dataclass(slots=True)
class DatabaseEvaluationRepository:
    connection_string: str | None = None
    root_dir: Path | None = None

    def __post_init__(self) -> None:
        self.connection_string = self.connection_string or os.environ.get("DATABASE_URL")
        self.root_dir = self.root_dir or Path(__file__).resolve().parents[3]
        if not self.connection_string:
            raise ValueError("DATABASE_URL is required to persist realtime evaluations")

    def create_attempt(self, request: RealtimeEvaluationRequest, *, evaluation_id: str | None = None) -> str:
        resolved_evaluation_id = evaluation_id or generate_evaluation_id()
        self._execute(
            """
            insert into realtime_evaluation (
              evaluation_id,
              encounter_id,
              case_id,
              patient_id,
              triggered_by_doctor_id,
              status
            ) values ($1, $2, $3, $4, $5, 'pending');

            insert into realtime_evaluation_detail (
              evaluation_id,
              encounter_snapshot
            ) values ($1, $6::jsonb)
            on conflict (evaluation_id) do update
            set
              encounter_snapshot = excluded.encounter_snapshot,
              updated_at = now();
            """.strip(),
            [
                resolved_evaluation_id,
                request.encounter_id,
                request.case_id,
                request.patient_id,
                request.triggered_by_doctor_id,
                json.dumps(request.encounter_snapshot.to_dict(), ensure_ascii=True),
            ],
        )
        return resolved_evaluation_id

    def mark_success(self, evaluation_id: str, request: RealtimeEvaluationRequest, result: RealtimeEvaluationResult) -> None:
        payload = result.to_dict()
        self._execute(
            """
            update realtime_evaluation
            set
              completed_at = now(),
              status = 'success',
              diagnosis_basis_incomplete = $2,
              missing_diagnosis = $3,
              quality_index_score = $4,
              elapsed_ms = $5,
              error_message = null
            where evaluation_id = $1;

            insert into realtime_evaluation_detail (
              evaluation_id,
              encounter_snapshot,
              basis_completeness,
              potential_missing_diagnoses,
              rationale,
              suggestions,
              response_payload
            ) values (
              $1,
              $6::jsonb,
              $7::jsonb,
              $8::jsonb,
              $9::jsonb,
              $10::jsonb,
              $11::jsonb
            )
            on conflict (evaluation_id) do update
            set
              encounter_snapshot = excluded.encounter_snapshot,
              basis_completeness = excluded.basis_completeness,
              potential_missing_diagnoses = excluded.potential_missing_diagnoses,
              rationale = excluded.rationale,
              suggestions = excluded.suggestions,
              response_payload = excluded.response_payload,
              updated_at = now();
            """.strip(),
            [
                evaluation_id,
                _diagnosis_basis_incomplete(result),
                _missing_diagnosis(result),
                _quality_index_score(payload),
                result.elapsed_ms,
                json.dumps(request.encounter_snapshot.to_dict(), ensure_ascii=True),
                json.dumps(result.basis_completeness, ensure_ascii=True),
                json.dumps(result.potential_missing_diagnoses, ensure_ascii=True),
                json.dumps(result.rationale, ensure_ascii=True),
                json.dumps(result.suggestions, ensure_ascii=True),
                json.dumps(payload, ensure_ascii=True),
            ],
        )

    def mark_timeout(self, evaluation_id: str, request: RealtimeEvaluationRequest, result: RealtimeEvaluationResult) -> None:
        self._mark_terminal(
            evaluation_id,
            request,
            result,
            status="timeout",
            error_message="timed out",
        )

    def mark_failed(self, evaluation_id: str, request: RealtimeEvaluationRequest, result: RealtimeEvaluationResult) -> None:
        self._mark_terminal(
            evaluation_id,
            request,
            result,
            status="failed",
            error_message="evaluation failed",
        )

    def _mark_terminal(
        self,
        evaluation_id: str,
        request: RealtimeEvaluationRequest,
        result: RealtimeEvaluationResult,
        *,
        status: str,
        error_message: str,
    ) -> None:
        self._execute(
            """
            update realtime_evaluation
            set
              completed_at = now(),
              status = $2,
              diagnosis_basis_incomplete = $3,
              missing_diagnosis = $4,
              quality_index_score = null,
              elapsed_ms = $5,
              error_message = $6
            where evaluation_id = $1;

            insert into realtime_evaluation_detail (
              evaluation_id,
              encounter_snapshot,
              basis_completeness,
              potential_missing_diagnoses,
              rationale,
              suggestions,
              response_payload
            ) values (
              $1,
              $7::jsonb,
              $8::jsonb,
              $9::jsonb,
              $10::jsonb,
              $11::jsonb,
              $12::jsonb
            )
            on conflict (evaluation_id) do update
            set
              encounter_snapshot = excluded.encounter_snapshot,
              basis_completeness = excluded.basis_completeness,
              potential_missing_diagnoses = excluded.potential_missing_diagnoses,
              rationale = excluded.rationale,
              suggestions = excluded.suggestions,
              response_payload = excluded.response_payload,
              updated_at = now();
            """.strip(),
            [
                evaluation_id,
                status,
                _diagnosis_basis_incomplete(result),
                _missing_diagnosis(result),
                result.elapsed_ms,
                error_message,
                json.dumps(request.encounter_snapshot.to_dict(), ensure_ascii=True),
                json.dumps(result.basis_completeness, ensure_ascii=True),
                json.dumps(result.potential_missing_diagnoses, ensure_ascii=True),
                json.dumps(result.rationale, ensure_ascii=True),
                json.dumps(result.suggestions, ensure_ascii=True),
                json.dumps(result.to_dict(), ensure_ascii=True),
            ],
        )

    def _execute(self, sql: str, params: list[Any]) -> list[dict[str, Any]]:
        command = [
            "node",
            "scripts/query-pg.mjs",
            cast(str, self.connection_string),
            sql,
            json.dumps(params, ensure_ascii=True),
        ]
        result = subprocess.run(
            command,
            cwd=self.root_dir,
            check=True,
            capture_output=True,
            text=True,
        )
        return cast(list[dict[str, Any]], json.loads(result.stdout or "[]"))


@dataclass(slots=True)
class InMemoryEvaluationRecord:
    evaluation_id: str
    encounter_id: str
    case_id: str
    patient_id: str
    triggered_by_doctor_id: str
    status: str
    triggered_at: str
    completed_at: str | None = None
    diagnosis_basis_incomplete: bool = False
    missing_diagnosis: bool = False
    quality_index_score: float | None = None
    elapsed_ms: int | None = None
    error_message: str | None = None
    detail: dict[str, Any] | None = None


class InMemoryEvaluationRepository:
    def __init__(self) -> None:
        self.records: dict[str, InMemoryEvaluationRecord] = {}

    def create_attempt(self, request: RealtimeEvaluationRequest, *, evaluation_id: str | None = None) -> str:
        resolved_evaluation_id = evaluation_id or generate_evaluation_id()
        self.records[resolved_evaluation_id] = InMemoryEvaluationRecord(
            evaluation_id=resolved_evaluation_id,
            encounter_id=request.encounter_id,
            case_id=request.case_id,
            patient_id=request.patient_id,
            triggered_by_doctor_id=request.triggered_by_doctor_id,
            status="pending",
            triggered_at=_utc_now(),
            detail={"encounter_snapshot": request.encounter_snapshot.to_dict()},
        )
        return resolved_evaluation_id

    def mark_success(self, evaluation_id: str, request: RealtimeEvaluationRequest, result: RealtimeEvaluationResult) -> None:
        self._mark(
            evaluation_id,
            request,
            result,
            status="success",
            error_message=None,
            quality_index_score=_quality_index_score(result.to_dict()),
        )

    def mark_timeout(self, evaluation_id: str, request: RealtimeEvaluationRequest, result: RealtimeEvaluationResult) -> None:
        self._mark(evaluation_id, request, result, status="timeout", error_message="timed out", quality_index_score=None)

    def mark_failed(self, evaluation_id: str, request: RealtimeEvaluationRequest, result: RealtimeEvaluationResult) -> None:
        self._mark(
            evaluation_id,
            request,
            result,
            status="failed",
            error_message="evaluation failed",
            quality_index_score=None,
        )

    def _mark(
        self,
        evaluation_id: str,
        request: RealtimeEvaluationRequest,
        result: RealtimeEvaluationResult,
        *,
        status: str,
        error_message: str | None,
        quality_index_score: float | None,
    ) -> None:
        record = self.records[evaluation_id]
        record.status = status
        record.completed_at = _utc_now()
        record.diagnosis_basis_incomplete = _diagnosis_basis_incomplete(result)
        record.missing_diagnosis = _missing_diagnosis(result)
        record.quality_index_score = quality_index_score
        record.elapsed_ms = result.elapsed_ms
        record.error_message = error_message
        record.detail = {
            "encounter_snapshot": request.encounter_snapshot.to_dict(),
            "basis_completeness": result.basis_completeness,
            "potential_missing_diagnoses": result.potential_missing_diagnoses,
            "rationale": result.rationale,
            "suggestions": result.suggestions,
            "response_payload": result.to_dict(),
        }


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _diagnosis_basis_incomplete(result: RealtimeEvaluationResult) -> bool:
    return result.basis_completeness.get("verdict") != "complete"


def _missing_diagnosis(result: RealtimeEvaluationResult) -> bool:
    return len(result.potential_missing_diagnoses) > 0


def _quality_index_score(payload: dict[str, Any]) -> float | None:
    value = payload.get("quality_index_score")
    if value is None:
        return None
    return float(value)
