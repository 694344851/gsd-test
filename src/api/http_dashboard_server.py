from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.api.http_dashboard_disease import handle_disease_insights
from src.api.http_dashboard_distribution import handle_distribution
from src.api.http_dashboard_drilldown import handle_problem_drilldown
from src.api.http_dashboard_export import handle_problem_case_export
from src.api.http_dashboard_overview import handle_overview
from src.api.http_dashboard_trend import handle_trend
from src.api.http_realtime_evaluation import handle_realtime_evaluation
from src.api.security.viewer_context import ViewerAccessError, require_manager_access


def _request_target(request: Request) -> str:
    query = request.url.query
    return f"{request.url.path}?{query}" if query else request.url.path


def _manager_access_error(request: Request) -> JSONResponse | None:
    try:
        require_manager_access(request.headers)
    except ViewerAccessError as exc:
        return JSONResponse(
            status_code=int(exc.status),
            content={"error": "forbidden", "message": str(exc)},
        )
    return None


def create_dashboard_app() -> FastAPI:
    app = FastAPI(title="Outpatient Quality Dashboard API")

    @app.exception_handler(KeyError)
    async def handle_missing_query_param(_: Request, exc: KeyError) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={"error": f"missing_query_param:{exc.args[0]}"},
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        if exc.status_code == 404:
            return JSONResponse(status_code=404, content={"error": "not_found"})
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail if isinstance(exc.detail, str) else "http_error"},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)},
        )

    @app.get("/api/analytics/overview")
    async def overview(request: Request) -> dict:
        return handle_overview(_request_target(request))

    @app.get("/api/analytics/trend")
    async def trend(request: Request) -> dict:
        return handle_trend(_request_target(request))

    @app.get("/api/analytics/distribution")
    async def distribution(request: Request) -> dict:
        return handle_distribution(_request_target(request))

    @app.get("/api/analytics/disease-insights")
    async def disease_insights(request: Request) -> dict:
        return handle_disease_insights(_request_target(request))

    @app.get("/api/problem-drilldown", response_model=None)
    async def problem_drilldown(request: Request) -> Any:
        access_error = _manager_access_error(request)
        if access_error is not None:
            return access_error
        return handle_problem_drilldown(_request_target(request))

    @app.get("/api/problem-cases/export", response_model=None)
    async def problem_case_export(request: Request) -> Response:
        access_error = _manager_access_error(request)
        if access_error is not None:
            return access_error
        body, headers = handle_problem_case_export(_request_target(request))
        return Response(content=body, headers=headers)

    @app.post("/api/realtime-evaluation")
    async def realtime_evaluation(request: Request) -> JSONResponse:
        payload, status = handle_realtime_evaluation(await request.body())
        return JSONResponse(content=payload, status_code=int(status))

    return app


app = create_dashboard_app()
