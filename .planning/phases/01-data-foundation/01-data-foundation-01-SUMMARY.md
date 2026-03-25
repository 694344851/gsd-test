---
phase: 01-data-foundation
plan: 01
subsystem: database
tags: [postgres, sql, staging, analytics, testing, pg]
requires: []
provides:
  - "Phase 1 SQL runner with deterministic fixtures and mapping assertions"
  - "Source-shaped staging contracts with key fallback and deduplication"
  - "Analytics dimensions, dual facts, case mart, and outpatient volume mart"
affects: [01-02, 01-03, dashboard-overview, realtime-evaluation]
tech-stack:
  added: [pg]
  patterns: [dual-fact star schema, source-contract staging views, refresh-driven SQL verification]
key-files:
  created:
    - sql/tests/run-phase-01.sh
    - sql/tests/fixtures/phase_01_seed.sql
    - sql/tests/data_01_mapping.sql
    - docs/data-source-inventory.md
    - docs/data-field-mapping.md
    - sql/staging/001_phase1_source_contracts.sql
    - sql/migrations/001_phase1_foundation.sql
    - scripts/psql-lite.mjs
    - bin/psql
    - package.json
  modified: []
key-decisions:
  - "Keep outpatient encounters and evaluation attempts as separate facts joined by encounter_id/case_id."
  - "Resolve case-level semantics from the latest successful evaluation while preserving failed and timeout attempts in the event fact."
  - "Use a repo-local psql wrapper backed by Node pg because the execution environment lacked a system psql client."
patterns-established:
  - "Stage raw source placeholders into normalized contract views before loading analytics tables."
  - "Refresh analytics facts and marts from fixture-loaded source tables through a single SQL function."
requirements-completed: [DATA-01]
duration: 25 min
completed: 2026-03-25
---

# Phase 1 Plan 1: Data Foundation Summary

**Deterministic PostgreSQL verification harness with source-contract staging, dual facts, and case-level evaluation semantics**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-25T02:30:53Z
- **Completed:** 2026-03-25T02:56:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Added a Phase 1 SQL runner, seeded outpatient/diagnosis/evaluation fixtures, and mapping assertions for the required analytics objects.
- Documented source inventory, join-key rules, and field mappings for `src_outpatient_encounters`, `src_outpatient_diagnoses`, and `src_evaluation_events`.
- Implemented staging contracts, analytics dimensions, encounter and evaluation facts, `analytics.mart_case_evaluation`, and `analytics.mart_outpatient_volume`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the Phase 1 SQL validation harness and fixture dataset** - `5cdfda8` (feat)
2. **Task 2: Implement the analytics schema, dual facts, dimensions, and case-level semantic view** - `4a5b086` (feat)

## Files Created/Modified
- `sql/tests/run-phase-01.sh` - Named SQL test runner that applies migrations, staging, fixtures, and one assertion file.
- `sql/tests/fixtures/phase_01_seed.sql` - Deterministic source-shaped fixture data covering success, failed, timeout, and not-triggered encounter states.
- `sql/tests/data_01_mapping.sql` - Assertions for staging contracts, facts, marts, null-key rejection, and outpatient counts.
- `docs/data-source-inventory.md` - Source inventory and join-key/deduplication rules for outpatient, diagnosis, and evaluation inputs.
- `docs/data-field-mapping.md` - Mapping matrix from source fields into staging, facts, dimensions, and marts.
- `sql/staging/001_phase1_source_contracts.sql` - Source normalization and deduplication views with `encounter_id`/`case_id` fallback logic.
- `sql/migrations/001_phase1_foundation.sql` - Raw placeholder source tables, analytics schema, refresh function, dimensions, facts, indexes, and materialized marts.
- `scripts/psql-lite.mjs` - Lightweight `psql` compatibility wrapper backed by Node `pg` for local plan verification.

## Decisions Made
- Kept the dual-fact model from planning as actual schema, with one row per encounter and one row per evaluation attempt.
- Derived `not_triggered` only in `analytics.mart_case_evaluation`; no synthetic event rows were persisted.
- Preserved both encounter-count and unique-patient-count outpatient metrics in the same mart so later plans can build default and alternate denominators from one source.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added a repo-local `psql` wrapper for SQL verification**
- **Found during:** Task 2
- **Issue:** The environment had no system `psql`, so the required `bash sql/tests/run-phase-01.sh data_01_mapping` path could not execute.
- **Fix:** Added `package.json` with `pg`, plus `scripts/psql-lite.mjs` and `bin/psql`, then ran the plan verification with `PATH` preferring the repo-local wrapper.
- **Files modified:** `.gitignore`, `package.json`, `bin/psql`, `scripts/psql-lite.mjs`
- **Verification:** `PATH="/home/healink/ykhl/test-ai/bin:$PATH" DATABASE_URL='postgresql://postgres:password@100.100.30.201:5432/mydatabase' bash sql/tests/run-phase-01.sh data_01_mapping`
- **Committed in:** `5cdfda8`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation was required to execute the planned SQL verification in the provided environment. No product-scope change.

## Issues Encountered
- The sandbox blocked direct TCP access to PostgreSQL. Verification succeeded after running the SQL runner with escalated network access.

## Known Stubs
- `docs/data-field-mapping.md:24` keeps `quality_index_score` labeled as a placeholder because the business formula for the overall diagnosis quality index is intentionally deferred by D-08. This does not block DATA-01.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 1 plan 2 can build default windows and aggregation semantics directly on the committed marts and fixture-backed SQL runner.
- The local verification path now works in-repo without requiring a system PostgreSQL client, but still needs network access to the target PostgreSQL instance.

## Self-Check: PASSED
- FOUND: `.planning/phases/01-data-foundation/01-data-foundation-01-SUMMARY.md`
- FOUND: `5cdfda8`
- FOUND: `4a5b086`
