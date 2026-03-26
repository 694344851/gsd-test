---
phase: 01-data-foundation
plan: 02
subsystem: metrics
tags: [postgres, sql, aggregation, windowing, metrics]
requires: [01-01]
provides:
  - "Explicit as_of_date-driven time-window resolution for overview and trend queries"
  - "Shared SQL aggregate functions for overview summary and trend series"
  - "Fixture-backed assertions for default window, filters, denominator variants, and placeholder gating"
affects: [01-03, dashboard-overview, quality-distribution-insights]
tech-stack:
  added: [postgres]
  patterns: [explicit as_of_date windows, camelCase SQL contracts, disabled placeholder metric]
key-files:
  created:
    - sql/migrations/002_phase1_metrics.sql
    - sql/tests/data_02_aggregates.sql
    - sql/tests/dash_01_default_window.sql
    - src/domain/analytics/contracts.ts
  modified: []
key-decisions:
  - "Default overview/trend evaluated-case metric remains successEvaluatedCount, while triggeredEvaluationCount is preserved separately."
  - "Both success-denominator and encounter-denominator quality ratios remain available in the SQL semantic layer."
  - "quality_index_score stays internal and disabled via config, and is not exposed through outward Phase 1 query outputs."
requirements-completed: [DATA-02, DASH-01]
completed: 2026-03-25
---

# Phase 1 Plan 2: Metrics Summary

**Default window resolution and shared SQL aggregate semantics for overview and trend analytics**

## Accomplishments
- Added `analytics.resolve_time_window`, `analytics.get_overview_summary`, and `analytics.get_trend_series` to keep default cutoff, bucket grain, filters, and ratio math in one SQL semantic layer.
- Locked deterministic shift encoding as `AM` / `PM` in hospital local time and aligned the default `last_3_months` window with the PRD's weekly interpretation.
- Added assertion scripts covering time-window resolution, filter predicates, unique-patient outpatient counts, separate triggered vs successful evaluation counts, denominator variants, and the absence of `qualityIndexScore` from outward outputs.

## Files Created
- `sql/migrations/002_phase1_metrics.sql`
- `sql/tests/data_02_aggregates.sql`
- `sql/tests/dash_01_default_window.sql`
- `src/domain/analytics/contracts.ts`

## Verification
- Passed locally on the user's machine:
  - `bash sql/tests/run-phase-01.sh dash_01_default_window`
  - `bash sql/tests/run-phase-01.sh data_02_aggregates`

## Notes
- The contract file remained TypeScript because it was already partially created before the execution was interrupted. The later application/query layer was redirected to Python per user instruction.

## Self-Check: PASSED
- FOUND: `sql/migrations/002_phase1_metrics.sql`
- FOUND: `sql/tests/data_02_aggregates.sql`
- FOUND: `sql/tests/dash_01_default_window.sql`
