# Quick Task 260326-kyf Plan

## Task

Migrate the backend HTTP entrypoint from the stdlib server to FastAPI while preserving the current API paths and frontend compatibility.

## Must Haves

- Keep existing `/api/...` routes unchanged.
- Reuse existing handler, domain, and SQL logic instead of rewriting business code.
- Enforce the same manager-only access checks for drilldown and export routes.
- Update local startup flow to run the FastAPI app through `uvicorn`.
- Declare the new Python dependencies and add a lightweight app-level smoke test.

## Execution Notes

- Adapt the current `handle_*` functions behind FastAPI route handlers by reconstructing the original request target.
- Keep error payloads aligned with the old server where practical, especially `missing_query_param`, `forbidden`, and `not_found`.
- Verify syntax locally; note any runtime validation blocked by missing Python packages in the environment.
