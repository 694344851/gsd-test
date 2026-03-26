---
phase: 05-drilldown-and-release-hardening
plan: 02
subsystem: api
tags: [python, react, csv, postgres, drilldown, export]
requires:
  - phase: 05-01
    provides: URL-driven manager drilldown shell and typed request/response contracts
provides:
  - real manager drilldown endpoint backed by canonical problem-case query semantics
  - CSV export endpoint that reuses the same filtered case query as the on-screen detail view
  - frontend binding for detail loading and export download against manager-scoped routes
affects: [05-03, manager-review, analytics, sql-tests]
tech-stack:
  added: []
  patterns:
    - canonical case-query reuse across JSON detail and CSV export
    - backend-owned CSV serialization with frontend download trigger only
key-files:
  created:
    - src/api/http_dashboard_drilldown.py
    - src/api/http_dashboard_export.py
    - src/api/analytics/drilldown_smoke.py
    - src/api/analytics/export_smoke.py
    - sql/tests/oper_01_problem_drilldown.sql
    - sql/tests/oper_02_case_export.sql
    - frontend/src/components/export-cases-button.tsx
    - frontend/src/lib/export-api.ts
  modified:
    - src/api/http_dashboard_server.py
    - src/domain/analytics/query_service.py
    - sql/tests/run-phase-01.sh
    - frontend/src/lib/manager-drilldown-api.ts
    - frontend/src/app/manager-drilldown-page.tsx
key-decisions:
  - "Detail JSON and CSV export must call the same `get_problem_case_rows(...)` helper so managers never download a different row set than they reviewed on screen."
  - "CSV generation stays on the backend and uses deterministic filenames derived from the active drilldown scope."
patterns-established:
  - "Keep manager detail/export semantics in the analytics query layer and reuse them across HTTP handlers."
  - "Use direct-run smoke scripts plus SQL assertions for behavior that spans HTTP formatting and data semantics."
requirements-completed: [OPER-01, OPER-02]
duration: session-managed
completed: 2026-03-26
---

# Phase 05 Plan 02: Drilldown and Release Hardening Summary

**Real manager drilldown and filtered CSV export over one shared problem-case query path**

## Performance

- **Duration:** session-managed
- **Started:** not captured after executor handoff
- **Completed:** 2026-03-26T10:20:18+08:00
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Added `/api/problem-drilldown` and bound the manager drilldown UI to real backend data instead of seeded-only local responses.
- Added `/api/problem-cases/export` with backend CSV serialization and deterministic `Content-Disposition` filename behavior.
- Extended the analytics query layer with canonical case-row and summary helpers reused by both detail and export flows.
- Added Python smokes and SQL tests proving drilldown rows, export row sets, and CSV response contracts.

## Task Commits

No task commits were created in this execution. The executor stalled before commit/summary generation, and the work was completed directly in the shared working tree.

## Files Created/Modified

- `src/api/http_dashboard_drilldown.py` - parses drilldown query params and maps filtered results into the typed manager payload
- `src/api/http_dashboard_export.py` - serializes the filtered problem-case row set to CSV
- `src/api/http_dashboard_server.py` - dispatches the new manager drilldown and export routes
- `src/domain/analytics/query_service.py` - adds `get_problem_case_rows(...)`, `summarize_problem_case_rows(...)`, and filter serialization helpers
- `frontend/src/lib/manager-drilldown-api.ts` - binds the typed drilldown loader to `/api/problem-drilldown`
- `frontend/src/lib/export-api.ts` - builds the export request from the active drilldown request
- `frontend/src/components/export-cases-button.tsx` - renders the manager-facing export trigger and browser download flow
- `src/api/analytics/drilldown_smoke.py` - verifies representative drilldown behavior through the handler seam
- `src/api/analytics/export_smoke.py` - verifies CSV content type, filename, and representative row serialization
- `sql/tests/oper_01_problem_drilldown.sql` - asserts filtered drilldown semantics
- `sql/tests/oper_02_case_export.sql` - asserts the export row set remains aligned with the filtered problem-case scope

## Decisions Made

- Reused Phase 4 persisted evaluation summary data in the case query so manager drilldown focuses on the latest clinically relevant problem-state per encounter.
- Kept export behavior as a pure server concern so managers download the authoritative row set rather than a client-reconstructed table snapshot.

## Deviations from Plan

None. Scope and artifacts matched the plan. Operationally, SQL verification required elevated sandbox permissions because the test runner connects to local PostgreSQL on `127.0.0.1:5432`.

## Issues Encountered

- Local PostgreSQL checks could not run inside the sandbox network restrictions and had to be rerun with approval.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Wave 3 can enforce role gating and release-readiness checks on top of already-real drilldown and export routes without changing the underlying case semantics.

---
*Phase: 05-drilldown-and-release-hardening*
*Completed: 2026-03-26*
