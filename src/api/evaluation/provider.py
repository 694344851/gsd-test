from __future__ import annotations

from typing import Any, Protocol

from src.api.evaluation.contracts import RealtimeEvaluationRequest


class RealtimeEvaluationProvider(Protocol):
    def evaluate(self, request: RealtimeEvaluationRequest) -> dict[str, Any]:
        ...


class HeuristicRealtimeEvaluationProvider:
    def evaluate(self, request: RealtimeEvaluationRequest) -> dict[str, Any]:
        snapshot = request.encounter_snapshot
        missing_items: list[str] = []
        if not snapshot.history_of_present_illness:
            missing_items.append("补充现病史关键症状演变")
        if not snapshot.auxiliary_exam:
            missing_items.append("补录相关辅助检查结果")

        verdict = "complete" if len(missing_items) == 0 else "incomplete"
        summary = "当前诊断依据较为完整。" if verdict == "complete" else "现病史或辅助检查依据仍需补充。"

        primary_diagnosis = next((item for item in snapshot.diagnoses if item.is_primary), snapshot.diagnoses[0])
        potential_missing = []
        if verdict == "incomplete":
            potential_missing = [
                {
                    "disease_name": primary_diagnosis.disease_name,
                    "confidence_label": "low",
                    "rationale": "当前病历仍有关键依据待补充，建议结合临床表现复核相关诊断。",
                }
            ]

        return {
            "basis_completeness": {
                "verdict": verdict,
                "summary": summary,
                "missing_items": missing_items,
            },
            "potential_missing_diagnoses": potential_missing,
            "rationale": [
                "系统基于当前主诉、现病史、查体、辅助检查和已录入诊断做辅助评估。",
            ],
            "suggestions": ["结合病历完整性补充关键信息后，可再次触发诊鉴。"],
        }
