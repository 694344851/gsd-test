from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from src.domain.analytics.contracts import AnalyticsFilters, ProblemCaseDimension
from src.domain.analytics.query_service import (
    QueryExecutor,
    get_problem_case_rows,
    serialize_filters,
    summarize_problem_case_rows,
)


def _get_list(values: dict[str, list[str]], key: str) -> list[str] | None:
    items = [item for item in values.get(key, []) if item]
    return items or None


def _parse_dimension(value: str | None) -> ProblemCaseDimension:
    if value not in {"department", "doctor", "disease"}:
        raise KeyError("dimension")
    return value


def parse_problem_drilldown_request(path: str) -> tuple[AnalyticsFilters, ProblemCaseDimension, str, str, str]:
    query = parse_qs(urlparse(path).query)
    filters = AnalyticsFilters(
        as_of_date=query["as_of_date"][0],
        range_key=query["range_key"][0],
        start_date=query.get("start_date", [None])[0],
        end_date=query.get("end_date", [None])[0],
        department_ids=_get_list(query, "department_ids"),
        department_type_ids=_get_list(query, "department_type_ids"),
        doctor_ids=_get_list(query, "doctor_ids"),
        disease_ids=_get_list(query, "disease_ids"),
    )
    dimension = _parse_dimension(query.get("dimension", [None])[0])
    dimension_value = query["dimension_value"][0]
    dimension_label = query["dimension_label"][0]
    source_module = query.get("source_module", ["overview"])[0]
    return filters, dimension, dimension_value, dimension_label, source_module


def handle_problem_drilldown(
    path: str,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> dict:
    filters, dimension, dimension_value, dimension_label, source_module = parse_problem_drilldown_request(path)
    rows = get_problem_case_rows(
        filters,
        dimension=dimension,
        dimension_value=dimension_value,
        executor=executor,
        connection_string=connection_string,
    )
    summary = summarize_problem_case_rows(rows)
    return {
        "request": {
            "dimension": dimension,
            "dimension_value": dimension_value,
            "dimension_label": dimension_label,
            "source_module": source_module,
            "filters": serialize_filters(filters),
        },
        "summary": {
            "total_case_count": summary.total_case_count,
            "diagnosis_basis_incomplete_count": summary.diagnosis_basis_incomplete_count,
            "missing_diagnosis_count": summary.missing_diagnosis_count,
        },
        "rows": [
            {
                "encounter_id": row.encounter_id,
                "patient_name": row.patient_name,
                "department_name": row.department_name,
                "doctor_name": row.doctor_name,
                "primary_diagnosis_name": row.primary_diagnosis_name,
                "evaluation_status": row.evaluation_status,
                "diagnosis_basis_incomplete": row.diagnosis_basis_incomplete,
                "missing_diagnosis": row.missing_diagnosis,
                "triggered_at": row.triggered_at,
            }
            for row in rows
        ],
    }
