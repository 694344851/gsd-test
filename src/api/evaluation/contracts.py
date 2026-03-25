from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal
from uuid import uuid4


class RequestValidationError(ValueError):
    pass


@dataclass(slots=True)
class RealtimeEvaluationRequestDiagnosis:
    disease_name: str
    is_primary: bool
    disease_code: str | None = None

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "RealtimeEvaluationRequestDiagnosis":
        disease_name = str(payload.get("disease_name", "")).strip()
        if not disease_name:
            raise RequestValidationError("diagnoses[].disease_name is required")
        return cls(
            disease_name=disease_name,
            is_primary=bool(payload.get("is_primary", False)),
            disease_code=str(payload["disease_code"]).strip() if payload.get("disease_code") else None,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "disease_code": self.disease_code,
            "disease_name": self.disease_name,
            "is_primary": self.is_primary,
        }


@dataclass(slots=True)
class RealtimeEvaluationEncounterSnapshot:
    chief_complaint: str | None
    history_of_present_illness: str | None
    physical_exam: str | None
    auxiliary_exam: str | None
    diagnoses: list[RealtimeEvaluationRequestDiagnosis]

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "RealtimeEvaluationEncounterSnapshot":
        diagnoses_payload = payload.get("diagnoses")
        if not isinstance(diagnoses_payload, list) or len(diagnoses_payload) == 0:
            raise RequestValidationError("encounter_snapshot.diagnoses must be a non-empty list")

        return cls(
            chief_complaint=_optional_text(payload.get("chief_complaint")),
            history_of_present_illness=_optional_text(payload.get("history_of_present_illness")),
            physical_exam=_optional_text(payload.get("physical_exam")),
            auxiliary_exam=_optional_text(payload.get("auxiliary_exam")),
            diagnoses=[RealtimeEvaluationRequestDiagnosis.from_dict(item) for item in diagnoses_payload],
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "chief_complaint": self.chief_complaint,
            "history_of_present_illness": self.history_of_present_illness,
            "physical_exam": self.physical_exam,
            "auxiliary_exam": self.auxiliary_exam,
            "diagnoses": [diagnosis.to_dict() for diagnosis in self.diagnoses],
        }


@dataclass(slots=True)
class RealtimeEvaluationRequest:
    encounter_id: str
    case_id: str
    patient_id: str
    triggered_by_doctor_id: str
    encounter_snapshot: RealtimeEvaluationEncounterSnapshot

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "RealtimeEvaluationRequest":
        snapshot_payload = payload.get("encounter_snapshot")
        if not isinstance(snapshot_payload, dict):
            raise RequestValidationError("encounter_snapshot is required")

        return cls(
            encounter_id=_required_text(payload, "encounter_id"),
            case_id=_required_text(payload, "case_id"),
            patient_id=_required_text(payload, "patient_id"),
            triggered_by_doctor_id=_required_text(payload, "triggered_by_doctor_id"),
            encounter_snapshot=RealtimeEvaluationEncounterSnapshot.from_dict(snapshot_payload),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "encounter_id": self.encounter_id,
            "case_id": self.case_id,
            "patient_id": self.patient_id,
            "triggered_by_doctor_id": self.triggered_by_doctor_id,
            "encounter_snapshot": self.encounter_snapshot.to_dict(),
        }


@dataclass(slots=True)
class RealtimeEvaluationResult:
    evaluation_id: str
    status: Literal["success", "timeout", "failed"]
    elapsed_ms: int
    assistive_notice: str
    basis_completeness: dict[str, Any]
    potential_missing_diagnoses: list[dict[str, Any]]
    rationale: list[str]
    suggestions: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "evaluation_id": self.evaluation_id,
            "status": self.status,
            "elapsed_ms": self.elapsed_ms,
            "assistive_notice": self.assistive_notice,
            "basis_completeness": self.basis_completeness,
            "potential_missing_diagnoses": self.potential_missing_diagnoses,
            "rationale": self.rationale,
            "suggestions": self.suggestions,
        }

    @classmethod
    def from_provider_payload(
        cls,
        payload: dict[str, Any],
        *,
        evaluation_id: str,
        elapsed_ms: int,
        assistive_notice: str,
    ) -> "RealtimeEvaluationResult":
        return cls(
            evaluation_id=evaluation_id,
            status="success",
            elapsed_ms=elapsed_ms,
            assistive_notice=assistive_notice,
            basis_completeness=_normalize_basis(payload.get("basis_completeness")),
            potential_missing_diagnoses=_normalize_missing_diagnoses(payload.get("potential_missing_diagnoses")),
            rationale=_normalize_string_list(payload.get("rationale")),
            suggestions=_normalize_string_list(payload.get("suggestions")),
        )


def build_timeout_result(*, evaluation_id: str, elapsed_ms: int, timeout_seconds: float) -> RealtimeEvaluationResult:
    return RealtimeEvaluationResult(
        evaluation_id=evaluation_id,
        status="timeout",
        elapsed_ms=elapsed_ms,
        assistive_notice="本结果仅用于辅助诊断质量评估，不替代医生临床判断。",
        basis_completeness={
            "verdict": "incomplete",
            "summary": f"本次诊鉴在 {int(timeout_seconds)} 秒时限内未返回完整结果。",
            "missing_items": [],
        },
        potential_missing_diagnoses=[],
        rationale=[],
        suggestions=["请医生结合当前病历决定是否稍后重试诊鉴。"],
    )


def build_failed_result(*, evaluation_id: str, elapsed_ms: int) -> RealtimeEvaluationResult:
    return RealtimeEvaluationResult(
        evaluation_id=evaluation_id,
        status="failed",
        elapsed_ms=elapsed_ms,
        assistive_notice="本结果仅用于辅助诊断质量评估，不替代医生临床判断。",
        basis_completeness={
            "verdict": "incomplete",
            "summary": "本次诊鉴执行失败，暂未生成可供参考的结构化评估结果。",
            "missing_items": [],
        },
        potential_missing_diagnoses=[],
        rationale=[],
        suggestions=["请核对病历内容后重试，如仍失败请联系支持人员。"],
    )


def generate_evaluation_id() -> str:
    return f"eval-{uuid4().hex[:12]}"


def _required_text(payload: dict[str, Any], key: str) -> str:
    value = _optional_text(payload.get(key))
    if not value:
        raise RequestValidationError(f"{key} is required")
    return value


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _normalize_basis(value: Any) -> dict[str, Any]:
    payload = value if isinstance(value, dict) else {}
    verdict = payload.get("verdict")
    if verdict not in {"complete", "incomplete"}:
        verdict = "incomplete"
    missing_items = _normalize_string_list(payload.get("missing_items"))
    return {
        "verdict": verdict,
        "summary": _optional_text(payload.get("summary")) or "未返回诊断依据完整性说明。",
        "missing_items": missing_items,
    }


def _normalize_missing_diagnoses(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []

    normalized: list[dict[str, Any]] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        disease_name = _optional_text(item.get("disease_name"))
        if not disease_name:
            continue
        confidence_label = item.get("confidence_label")
        if confidence_label not in {"high", "medium", "low"}:
            confidence_label = "low"
        normalized.append(
            {
                "disease_name": disease_name,
                "confidence_label": confidence_label,
                "rationale": _optional_text(item.get("rationale")) or "未返回具体依据说明。",
            }
        )
    return normalized


def _normalize_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [text for item in value if (text := _optional_text(item))]
