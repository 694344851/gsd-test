---
phase: 1
slug: data-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — Wave 0 |
| **Config file** | none — see Wave 0 |
| **Quick run command** | `test -x sql/tests/run-phase-01.sh && rg -n 'data_01_mapping|data_02_aggregates|data_03_status_split|dash_01_default_window|phase_01_seed.sql|unique_patient_outpatient_count' sql/tests/run-phase-01.sh sql/tests/fixtures/phase_01_seed.sql sql/tests/data_01_mapping.sql` |
| **Full suite command** | `unavailable until DB test harness is added` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every bootstrap task commit:** Run the smallest relevant static/bootstrap verification path
- **After every SQL-producing task commit:** Run the smallest relevant SQL assertion file against fixture data
- **After every plan wave:** Run all Phase 1 SQL assertions plus one end-to-end overview query snapshot
- **Before `$gsd-verify-work`:** Full Phase 1 SQL suite must be green
- **Max feedback latency:** 25 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | DATA-01 | bootstrap/static | `test -x sql/tests/run-phase-01.sh && rg -n 'data_01_mapping|data_02_aggregates|data_03_status_split|dash_01_default_window|phase_01_seed.sql|unique_patient_outpatient_count' sql/tests/run-phase-01.sh sql/tests/fixtures/phase_01_seed.sql sql/tests/data_01_mapping.sql` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | DATA-01 | SQL integration | `bash sql/tests/run-phase-01.sh data_01_mapping` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | DATA-02 | SQL integration | `psql "$DATABASE_URL" -f sql/tests/data_02_aggregates.sql` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | DASH-01 | SQL unit/integration | `psql "$DATABASE_URL" -f sql/tests/dash_01_default_window.sql` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | DATA-03 | SQL integration | `psql "$DATABASE_URL" -f sql/tests/data_03_status_split.sql` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `sql/tests/fixtures/` — stable encounter/evaluation sample rows covering success, failed, timeout, and not-triggered cases
- [ ] `sql/tests/data_01_mapping.sql` — field mapping assertions for facts and dimensions
- [ ] `sql/tests/data_02_aggregates.sql` — metric and denominator assertions
- [ ] `sql/tests/data_03_status_split.sql` — evaluated vs unevaluated assertions
- [ ] `sql/tests/dash_01_default_window.sql` — default range assertions around week/month/year boundaries
- [ ] `DB test runner decision` — `psql` scripts or app-level integration tests

---

## Manual-Only Verifications

All phase behaviors should be covered by SQL-based automated verification once Wave 0 is complete.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
