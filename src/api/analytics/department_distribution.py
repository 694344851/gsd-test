from __future__ import annotations

from dataclasses import asdict
from typing import Any

from src.domain.analytics.contracts import AnalyticsFilters
from src.domain.analytics.query_service import (
    QueryExecutor,
    get_available_department_types,
    get_department_distribution,
    serialize_filters,
)


def build_department_distribution_response(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> dict[str, Any]:
    return {
        "filters": serialize_filters(filters),
        "available_department_types": [
            asdict(row)
            for row in get_available_department_types(
                filters,
                executor=executor,
                connection_string=connection_string,
            )
        ],
        "rows": [
            asdict(row)
            for row in get_department_distribution(
                filters,
                executor=executor,
                connection_string=connection_string,
            )
        ],
    }
