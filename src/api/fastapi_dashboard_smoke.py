from __future__ import annotations

import asyncio
import sys
from http import HTTPStatus
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from httpx import ASGITransport, AsyncClient

import src.api.http_dashboard_server as dashboard_server


async def _exercise_app() -> None:
    dashboard_server.handle_overview = lambda path: {"path": path}
    dashboard_server.handle_problem_drilldown = lambda path: {"path": path}
    dashboard_server.handle_problem_case_export = (
        lambda path: (
            b"encounter_id\nenc-001\n",
            {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": 'attachment; filename="problem-cases.csv"',
            },
        )
    )
    dashboard_server.handle_realtime_evaluation = (
        lambda body: ({"received": body.decode("utf-8")}, HTTPStatus.ACCEPTED)
    )

    transport = ASGITransport(app=dashboard_server.create_dashboard_app())
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        overview = client.get(
            "/api/analytics/overview",
            params={"as_of_date": "2026-03-24", "range_key": "last_3_months"},
        )
        overview = await overview
        assert overview.status_code == 200
        assert overview.json()["path"] == "/api/analytics/overview?as_of_date=2026-03-24&range_key=last_3_months"

        forbidden = await client.get("/api/problem-drilldown")
        assert forbidden.status_code == 403
        assert forbidden.json()["error"] == "forbidden"

        manager = await client.get(
            "/api/problem-drilldown",
            headers={"X-Viewer-Role": "manager", "X-Viewer-Id": "manager-001"},
            params={
                "as_of_date": "2026-03-24",
                "range_key": "last_3_months",
                "dimension": "department",
                "dimension_value": "dept-ob",
                "dimension_label": "产科门诊",
            },
        )
        assert manager.status_code == 200

        export = await client.get(
            "/api/problem-cases/export",
            headers={"X-Viewer-Role": "manager", "X-Viewer-Id": "manager-001"},
            params={
                "as_of_date": "2026-03-24",
                "range_key": "last_3_months",
                "dimension": "department",
                "dimension_value": "dept-ob",
                "dimension_label": "产科门诊",
            },
        )
        assert export.status_code == 200
        assert export.headers["content-type"] == "text/csv; charset=utf-8"
        assert export.headers["content-disposition"] == 'attachment; filename="problem-cases.csv"'
        assert export.text == "encounter_id\nenc-001\n"

        realtime = await client.post("/api/realtime-evaluation", content=b'{"case_id":"case-001"}')
        assert realtime.status_code == 202
        assert realtime.json()["received"] == '{"case_id":"case-001"}'


def main() -> int:
    asyncio.run(_exercise_app())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
