from __future__ import annotations

import csv
import io

from src.api.http_dashboard_drilldown import parse_problem_drilldown_request
from src.domain.analytics.query_service import QueryExecutor, get_problem_case_rows


def handle_problem_case_export(
    path: str,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> tuple[bytes, dict[str, str]]:
    filters, dimension, dimension_value, _, _ = parse_problem_drilldown_request(path)
    rows = get_problem_case_rows(
        filters,
        dimension=dimension,
        dimension_value=dimension_value,
        executor=executor,
        connection_string=connection_string,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "encounter_id",
            "patient_name",
            "department_name",
            "doctor_name",
            "primary_diagnosis_name",
            "evaluation_status",
            "diagnosis_basis_incomplete",
            "missing_diagnosis",
            "triggered_at",
        ]
    )
    for row in rows:
        writer.writerow(
            [
                row.encounter_id,
                row.patient_name,
                row.department_name,
                row.doctor_name,
                row.primary_diagnosis_name,
                row.evaluation_status,
                "true" if row.diagnosis_basis_incomplete else "false",
                "true" if row.missing_diagnosis else "false",
                row.triggered_at,
            ]
        )

    filename = f"problem-cases-{dimension}-{dimension_value}.csv"
    return output.getvalue().encode("utf-8"), {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": f'attachment; filename="{filename}"',
    }
