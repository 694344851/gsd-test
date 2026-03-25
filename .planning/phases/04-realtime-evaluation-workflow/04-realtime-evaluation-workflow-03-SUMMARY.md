---
phase: 04-realtime-evaluation-workflow
plan: 03
subsystem: api
tags: [postgres, python, react, analytics, realtime-evaluation]
requires:
  - phase: 04-02
    provides: normalized realtime evaluation handler, provider orchestration, and doctor-side POST client
provides:
  - durable realtime evaluation attempt persistence with terminal outcome updates
  - analytics helper for reading persisted realtime evaluation summary fields and detail payloads
  - doctor-side trace id rendering for persisted evaluation records
affects: [phase-05-drilldown-and-release-hardening, analytics, doctor-ui]
tech-stack:
  added: []
  patterns: [attempt-first persistence, summary-plus-detail evaluation storage, analytics helper reuse]
key-files:
  created:
    - sql/migrations/005_phase4_realtime_evaluation.sql
    - sql/tests/eval_01_persistence_chain.sql
    - src/api/evaluation/repository.py
    - src/domain/analytics/reuse_smoke.py
  modified:
    - src/api/evaluation/orchestration.py
    - src/api/http_realtime_evaluation.py
    - src/domain/analytics/contracts.py
    - src/domain/analytics/query_service.py
    - frontend/src/components/doctor-evaluation-panel.tsx
    - frontend/src/components/__tests__/doctor-evaluation-panel.test.tsx
    - sql/tests/run-phase-01.sh
key-decisions:
  - "Persist Phase 4 evaluations in standalone realtime tables and reuse Phase 1 semantics through summary flags instead of forcing a dashboard refresh in the request path."
  - "Expose persisted evaluation reuse through a lightweight analytics helper over analytics.realtime_evaluation_summary plus detail joins."
  - "Surface evaluation_id in the doctor panel so every visible result maps to a durable backend record."
patterns-established:
  - "Persist attempt first, then mark success, timeout, or failed after provider execution."
  - "Store aggregate-friendly booleans alongside structured JSON detail so analytics reuse and future drilldown stay aligned."
requirements-completed: [EVAL-04, EVAL-02]
duration: 6 min
completed: 2026-03-25
---

# Phase 04 Plan 03: Realtime Evaluation Workflow Summary

**Realtime evaluation persistence with attempt/outcome tracking, analytics reuse helpers, and doctor-side trace ids**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-25T09:47:30Z
- **Completed:** 2026-03-25T09:53:42Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Added Phase 4 persistence tables, indexes, and a summary view for realtime evaluation attempts plus structured detail payloads.
- Wired orchestration to create attempts before provider execution and mark `success`, `timeout`, or `failed` outcomes after execution completes.
- Added an analytics helper and smoke coverage for reading persisted summary fields without triggering global dashboard recomputation.
- Exposed durable `evaluation_id` values in the doctor-side panel for traceability.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Phase 4 persistence schema and repository write path** - `9cb15d1` (feat)
2. **Task 2: Bridge persisted evaluation outcomes into analytics reuse** - `e9cda81` (feat)

## Files Created/Modified

- `sql/migrations/005_phase4_realtime_evaluation.sql` - Creates realtime persistence tables and `analytics.realtime_evaluation_summary`.
- `sql/tests/eval_01_persistence_chain.sql` - Asserts persisted `success`, `timeout`, and `failed` states plus structured detail storage.
- `src/api/evaluation/repository.py` - Implements database and in-memory repositories for attempt creation and terminal outcome updates.
- `src/api/evaluation/orchestration.py` - Persists attempt start and final status around provider execution.
- `src/api/http_realtime_evaluation.py` - Supports repository injection through the HTTP boundary.
- `src/domain/analytics/contracts.py` - Adds a persisted realtime evaluation reuse contract.
- `src/domain/analytics/query_service.py` - Adds a helper that reads persisted realtime summaries and detail payloads.
- `src/domain/analytics/reuse_smoke.py` - Verifies analytics helper behavior against persisted Phase 4-style rows.
- `frontend/src/components/doctor-evaluation-panel.tsx` - Displays the durable evaluation trace id.
- `frontend/src/components/__tests__/doctor-evaluation-panel.test.tsx` - Verifies the trace id remains visible in the success path.

## Decisions Made

- Persisted realtime evaluations in dedicated Phase 4 tables instead of writing directly into Phase 1 fact refresh tables, because the doctor-side request path cannot afford heavyweight analytics refresh work.
- Reused Phase 1 analytics semantics by storing `diagnosis_basis_incomplete`, `missing_diagnosis`, `status`, and optional `quality_index_score` on the durable summary row while keeping richer payloads in a separate detail table.
- Kept analytics reuse as an explicit helper in `query_service.py` so later drilldown work can consume persisted evaluation rows without introducing a parallel translation model.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Local PostgreSQL verification required elevated sandbox permissions because the test runner connects to `127.0.0.1:5432`. The verification command succeeded once rerun with approval.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 now has durable evaluation records and a reuse seam for future drilldown and management-side reuse.
- Phase 5 can build case-level drilldown and export flows on top of persisted `evaluation_id`, summary flags, and detail payloads.

## Self-Check

PASSED

- FOUND: `.planning/phases/04-realtime-evaluation-workflow/04-realtime-evaluation-workflow-03-SUMMARY.md`
- FOUND: `9cb15d1`
- FOUND: `e9cda81`

---
*Phase: 04-realtime-evaluation-workflow*
*Completed: 2026-03-25*
