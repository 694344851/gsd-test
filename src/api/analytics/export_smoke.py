from __future__ import annotations

import csv
import io
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.api.http_dashboard_export import handle_problem_case_export


class FakeExecutor:
    def fetch_all(self, sql: str, params: list[Any]) -> list[dict[str, Any]]:
        assert "analytics.realtime_evaluation_summary" in sql
        assert params[-2:] == ["doctor", "doctor-001"]
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
    body, headers = handle_problem_case_export(
        "/api/problem-cases/export?as_of_date=2026-03-24&range_key=last_3_months&dimension=doctor&dimension_value=doctor-001&dimension_label=%E5%8C%BB%E7%94%9F%E4%B8%80&source_module=distribution",
        executor=FakeExecutor(),
    )
    assert headers["Content-Type"] == "text/csv; charset=utf-8"
    assert 'filename="problem-cases-doctor-doctor-001.csv"' in headers["Content-Disposition"]

    rows = list(csv.reader(io.StringIO(body.decode("utf-8"))))
    assert rows[0][0] == "encounter_id"
    assert rows[1][0] == "enc-001"
    assert rows[1][5] == "success"
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
