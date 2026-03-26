from __future__ import annotations

from dataclasses import asdict
from typing import Any

from src.domain.analytics.contracts import AnalyticsFilters
from src.domain.analytics.query_service import QueryExecutor, get_trend_series, serialize_filters


def build_trend_response(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> dict[str, Any]:
    series = [
        asdict(row)
        for row in get_trend_series(
            filters,
            executor=executor,
            connection_string=connection_string,
        )
    ]
    return {
        "filters": serialize_filters(filters),
        "series": series,
    }
