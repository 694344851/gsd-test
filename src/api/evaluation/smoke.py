from __future__ import annotations

import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.api.http_realtime_evaluation import handle_realtime_evaluation


REQUEST_PAYLOAD = {
    "encounter_id": "enc-smoke-001",
    "case_id": "case-smoke-001",
    "patient_id": "patient-smoke-001",
    "triggered_by_doctor_id": "doctor-smoke-001",
    "encounter_snapshot": {
        "chief_complaint": "发热 2 天。",
        "history_of_present_illness": "伴咳嗽。",
        "physical_exam": "双肺呼吸音粗。",
        "auxiliary_exam": "血常规提示白细胞升高。",
        "diagnoses": [{"disease_name": "上呼吸道感染", "is_primary": True}],
    },
}


class SuccessProvider:
    def evaluate(self, request):  # noqa: ANN001
        return {
            "basis_completeness": {
                "verdict": "complete",
                "summary": "当前病历已包含主要诊断依据。",
                "missing_items": [],
            },
            "potential_missing_diagnoses": [],
            "rationale": [f"已收到 {request.encounter_id} 的完整病历快照。"],
            "suggestions": ["继续结合临床判断完成诊疗决策。"],
        }


class TimeoutProvider:
    def evaluate(self, request):  # noqa: ANN001, ARG002
        time.sleep(0.05)
        return {
            "basis_completeness": {"verdict": "complete", "summary": "never", "missing_items": []},
            "potential_missing_diagnoses": [],
            "rationale": [],
            "suggestions": [],
        }


class FailedProvider:
    def evaluate(self, request):  # noqa: ANN001, ARG002
        raise RuntimeError("provider exploded")


def main() -> int:
    body = json.dumps(REQUEST_PAYLOAD, ensure_ascii=False).encode("utf-8")

    success_payload, success_status = handle_realtime_evaluation(body, provider=SuccessProvider(), timeout_seconds=0.5)
    assert success_status.value == 200
    assert success_payload["status"] == "success"
    assert success_payload["basis_completeness"]["verdict"] == "complete"

    timeout_payload, timeout_status = handle_realtime_evaluation(body, provider=TimeoutProvider(), timeout_seconds=0.01)
    assert timeout_status.value == 200
    assert timeout_payload["status"] == "timeout"
    assert timeout_payload["suggestions"]

    failed_payload, failed_status = handle_realtime_evaluation(body, provider=FailedProvider(), timeout_seconds=0.5)
    assert failed_status.value == 200
    assert failed_payload["status"] == "failed"
    assert failed_payload["basis_completeness"]["summary"]
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
