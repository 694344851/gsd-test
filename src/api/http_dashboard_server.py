from __future__ import annotations

import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from src.api.http_dashboard_drilldown import handle_problem_drilldown
from src.api.http_dashboard_export import handle_problem_case_export
from src.api.http_dashboard_disease import handle_disease_insights
from src.api.http_dashboard_distribution import handle_distribution
from src.api.http_dashboard_overview import handle_overview
from src.api.http_dashboard_trend import handle_trend
from src.api.http_realtime_evaluation import handle_realtime_evaluation
from src.api.security.viewer_context import ViewerAccessError, require_manager_access


class DashboardRequestHandler(BaseHTTPRequestHandler):
    server_version = "DashboardHTTP/0.1"

    def do_GET(self) -> None:
        try:
            if self.path.startswith("/api/analytics/overview"):
                self._write_json(handle_overview(self.path))
                return
            if self.path.startswith("/api/analytics/trend"):
                self._write_json(handle_trend(self.path))
                return
            if self.path.startswith("/api/analytics/distribution"):
                self._write_json(handle_distribution(self.path))
                return
            if self.path.startswith("/api/analytics/disease-insights"):
                self._write_json(handle_disease_insights(self.path))
                return
            if self.path.startswith("/api/problem-drilldown"):
                require_manager_access(self.headers)
                self._write_json(handle_problem_drilldown(self.path))
                return
            if self.path.startswith("/api/problem-cases/export"):
                require_manager_access(self.headers)
                body, headers = handle_problem_case_export(self.path)
                self._write_bytes(body, headers=headers)
                return
            self._write_json({"error": "not_found"}, status=HTTPStatus.NOT_FOUND)
        except KeyError as exc:
            self._write_json({"error": f"missing_query_param:{exc.args[0]}"}, status=HTTPStatus.BAD_REQUEST)
        except ViewerAccessError as exc:
            self._write_json({"error": "forbidden", "message": str(exc)}, status=exc.status)
        except Exception as exc:  # pragma: no cover
            self._write_json({"error": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_POST(self) -> None:
        try:
            if self.path == "/api/realtime-evaluation":
                payload, status = handle_realtime_evaluation(self._read_request_body())
                self._write_json(payload, status=status)
                return
            self._write_json({"error": "not_found"}, status=HTTPStatus.NOT_FOUND)
        except Exception as exc:  # pragma: no cover
            self._write_json({"error": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def log_message(self, format: str, *args: object) -> None:
        return

    def _read_request_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0"))
        return self.rfile.read(length)

    def _write_json(self, payload: dict, *, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._write_bytes(
            body,
            status=status,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )

    def _write_bytes(
        self,
        body: bytes,
        *,
        status: HTTPStatus = HTTPStatus.OK,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.send_response(status)
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def create_dashboard_server(host: str = "127.0.0.1", port: int = 8000) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), DashboardRequestHandler)
