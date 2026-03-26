from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    import uvicorn
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "uvicorn is required to run the dashboard API. Sync the project environment with "
        "'uv sync'."
    ) from exc

from src.api.http_dashboard_server import create_dashboard_app


def main() -> None:
    host = os.environ.get("DASHBOARD_API_HOST", "127.0.0.1")
    port = int(os.environ.get("DASHBOARD_API_PORT", "8000"))
    uvicorn.run(create_dashboard_app(), host=host, port=port)


if __name__ == "__main__":
    main()
