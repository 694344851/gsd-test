from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.api.security.viewer_context import ViewerAccessError, require_manager_access


def main() -> int:
    manager = require_manager_access(
        {
            "X-Viewer-Role": "manager",
            "X-Viewer-Id": "manager-001",
        }
    )
    assert manager.viewer_role == "manager"

    try:
        require_manager_access({"X-Viewer-Role": "doctor", "X-Viewer-Id": "doctor-001"})
    except ViewerAccessError as exc:
        assert str(exc) == "manager access required"
    else:  # pragma: no cover
        raise AssertionError("doctor should not be allowed to access manager routes")

    try:
        require_manager_access({})
    except ViewerAccessError as exc:
        assert str(exc) == "viewer role required"
    else:  # pragma: no cover
        raise AssertionError("missing viewer role should be rejected")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
