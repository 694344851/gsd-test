from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.api.http_dashboard_drilldown import handle_problem_drilldown


class FakeExecutor:
    def fetch_all(self, sql: str, params: list[Any]) -> list[dict[str, Any]]:
        assert "analytics.realtime_evaluation_summary" in sql
        assert params[-2:] == ["department", "dept-ob"]
        return [
            {
                "encounterId": "enc-001",
                "patientName": "pat-001",
                "departmentId": "dept-ob",
                "departmentName": "产科门诊",
                "doctorId": "doctor-001",
                "doctorName": "医生一",
                "diseaseId": "disease-a",
                "primaryDiagnosisName": "疾病A",
                "evaluationStatus": "success",
                "diagnosisBasisIncomplete": True,
                "missingDiagnosis": False,
                "triggeredAt": "2026-03-24T09:12:00+08:00",
            }
        ]


def main() -> int:
    payload = handle_problem_drilldown(
        "/api/problem-drilldown?as_of_date=2026-03-24&range_key=last_3_months&dimension=department&dimension_value=dept-ob&dimension_label=%E4%BA%A7%E7%A7%91%E9%97%A8%E8%AF%8A&source_module=distribution",
        executor=FakeExecutor(),
    )
    assert payload["request"]["dimension"] == "department"
    assert payload["summary"]["total_case_count"] == 1
    assert payload["rows"][0]["department_name"] == "产科门诊"
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
