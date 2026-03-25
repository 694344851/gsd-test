from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.domain.analytics.query_service import get_persisted_realtime_evaluation


class FakeExecutor:
    def fetch_all(self, sql: str, params: list[Any]) -> list[dict[str, Any]]:
        assert "analytics.realtime_evaluation_summary" in sql
        assert "realtime_evaluation_detail" in sql
        assert params == ["eval-persisted-001"]
        return [
            {
                "evaluationId": "eval-persisted-001",
                "encounterId": "enc-001",
                "caseId": "case-001",
                "status": "success",
                "diagnosisBasisIncomplete": True,
                "missingDiagnosis": True,
                "qualityIndexScore": None,
                "elapsedMs": 8123,
                "basisCompleteness": {
                    "verdict": "incomplete",
                    "summary": "现病史和辅助检查依据仍需补充。",
                    "missing_items": ["补充现病史关键症状演变"],
                },
                "rationale": ["已记录主诉和初步诊断。"],
                "suggestions": ["补录辅助检查结果。"],
                "potentialMissingDiagnoses": [
                    {
                        "disease_name": "疾病A",
                        "confidence_label": "low",
                        "rationale": "当前病历仍需补充关键依据。",
                    }
                ],
            }
        ]


def main() -> int:
    row = get_persisted_realtime_evaluation("eval-persisted-001", executor=FakeExecutor())
    assert row is not None
    assert row.evaluation_id == "eval-persisted-001"
    assert row.status == "success"
    assert row.diagnosis_basis_incomplete is True
    assert row.missing_diagnosis is True
    assert row.quality_index_score is None
    assert row.basis_summary == "现病史和辅助检查依据仍需补充。"
    assert row.suggestions == ["补录辅助检查结果。"]
    assert row.potential_missing_diagnoses[0]["disease_name"] == "疾病A"
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
