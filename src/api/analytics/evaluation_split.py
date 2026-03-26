from __future__ import annotations

from typing import Any

from src.domain.analytics.contracts import AnalyticsFilters
from src.domain.analytics.query_service import QueryExecutor, get_evaluation_split, serialize_filters


def build_evaluation_split_response(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> dict[str, Any]:
    return {
        "filters": serialize_filters(filters),
        "split": get_evaluation_split(
            filters,
            executor=executor,
            connection_string=connection_string,
        ).__dict__,
    }
