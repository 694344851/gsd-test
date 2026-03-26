from __future__ import annotations

from dataclasses import asdict
from typing import Any

from src.domain.analytics.contracts import AnalyticsFilters
from src.domain.analytics.query_service import (
    QueryExecutor,
    get_overview_summary,
    get_previous_overview_summary,
    serialize_filters,
)


def build_overview_response(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> dict[str, Any]:
    summary = get_overview_summary(
        filters,
        executor=executor,
        connection_string=connection_string,
    )
    previous_summary = get_previous_overview_summary(
        filters,
        current_summary=summary,
        executor=executor,
        connection_string=connection_string,
    )
    return {
        "filters": serialize_filters(filters),
        "summary": asdict(summary),
        "previous_summary": None if previous_summary is None else asdict(previous_summary),
    }
