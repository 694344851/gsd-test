from __future__ import annotations

import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from src.api.http_dashboard_disease import handle_disease_insights
from src.api.http_dashboard_distribution import handle_distribution
from src.api.http_dashboard_overview import handle_overview
from src.api.http_dashboard_trend import handle_trend
from src.api.http_realtime_evaluation import handle_realtime_evaluation


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
            self._write_json({"error": "not_found"}, status=HTTPStatus.NOT_FOUND)
        except KeyError as exc:
            self._write_json({"error": f"missing_query_param:{exc.args[0]}"}, status=HTTPStatus.BAD_REQUEST)
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
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def create_dashboard_server(host: str = "127.0.0.1", port: int = 8000) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), DashboardRequestHandler)
