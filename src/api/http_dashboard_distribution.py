from __future__ import annotations

from src.api.analytics.department_distribution import build_department_distribution_response
from src.domain.analytics.contracts import AnalyticsFilters
from urllib.parse import parse_qs, urlparse


def _get_list(values: dict[str, list[str]], key: str) -> list[str] | None:
    items = [item for item in values.get(key, []) if item]
    return items or None


def parse_distribution_filters(path: str) -> AnalyticsFilters:
    query = parse_qs(urlparse(path).query)
    return AnalyticsFilters(
        as_of_date=query["as_of_date"][0],
        range_key=query["range_key"][0],
        start_date=query.get("start_date", [None])[0],
        end_date=query.get("end_date", [None])[0],
        department_ids=_get_list(query, "department_ids"),
        department_type_ids=_get_list(query, "department_type_ids"),
        doctor_ids=_get_list(query, "doctor_ids"),
        disease_ids=_get_list(query, "disease_ids"),
    )


def handle_distribution(path: str) -> dict:
    return build_department_distribution_response(parse_distribution_filters(path))
