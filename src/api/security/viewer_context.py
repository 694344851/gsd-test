from __future__ import annotations

from dataclasses import dataclass
from http import HTTPStatus
from typing import Mapping


@dataclass(slots=True)
class ViewerContext:
    viewer_role: str
    viewer_id: str | None = None


class ViewerAccessError(PermissionError):
    status = HTTPStatus.FORBIDDEN


def read_viewer_context(headers: Mapping[str, str]) -> ViewerContext:
    role = headers.get("X-Viewer-Role")
    if role not in {"manager", "doctor"}:
        raise ViewerAccessError("viewer role required")
    return ViewerContext(
        viewer_role=role,
        viewer_id=headers.get("X-Viewer-Id"),
    )


def require_manager_access(headers: Mapping[str, str]) -> ViewerContext:
    viewer = read_viewer_context(headers)
    if viewer.viewer_role != "manager":
        raise ViewerAccessError("manager access required")
    return viewer
