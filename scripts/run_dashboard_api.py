from __future__ import annotations

import os

from src.api.http_dashboard_server import create_dashboard_server


def main() -> None:
    port = int(os.environ.get("DASHBOARD_API_PORT", "8000"))
    server = create_dashboard_server(port=port)
    print(f"dashboard api listening on http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
