from __future__ import annotations

from dataclasses import asdict
from typing import Any

from src.domain.analytics.contracts import AnalyticsFilters
from src.domain.analytics.query_service import (
    QueryExecutor,
    get_disease_insights,
    serialize_filters,
)


def build_disease_insights_response(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> dict[str, Any]:
    return {
        "filters": serialize_filters(filters),
        "rows": [
            asdict(row)
            for row in get_disease_insights(
                filters,
                executor=executor,
                connection_string=connection_string,
            )
        ],
    }
