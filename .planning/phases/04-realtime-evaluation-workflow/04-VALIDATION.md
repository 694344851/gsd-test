---
phase: 04
slug: realtime-evaluation-workflow
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.3 + Testing Library for frontend; SQL assertion scripts for data layer; direct `python3` smoke checks until `pytest` is installed |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && npm test -- --run <test-file>` or `python3 src/api/evaluation/smoke.py` |
| **Full suite command** | `cd frontend && npm test -- --run src/app/__tests__/doctor-evaluation-page.test.tsx src/components/__tests__/doctor-evaluation-panel.test.tsx && python3 src/api/evaluation/smoke.py && DATABASE_URL=... PATH="/home/healink/ykhl/test-ai/bin:$PATH" bash sql/tests/run-phase-01.sh eval_01_persistence_chain` |
| **Estimated runtime** | ~25 seconds for task-level feedback, ~60 seconds for full phase gate |

---

## Sampling Rate

- **After every task commit:** Run the fastest task-specific slice under 30 seconds: `cd frontend && npm test -- --run <test-file>`, `python3 src/api/evaluation/smoke.py`, or targeted `python3 -m py_compile ...`
- **After every plan wave:** Run `cd frontend && npm test`
- **Before `$gsd-verify-work`:** Frontend tests plus focused persistence SQL assertions must be green
- **Max feedback latency:** 30 seconds for per-task sampling, 60 seconds only at the phase gate

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | EVAL-01 | component | `cd frontend && npm test -- --run src/app/__tests__/doctor-evaluation-page.test.tsx` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | EVAL-03 | component | `cd frontend && npm test -- --run src/components/__tests__/doctor-evaluation-panel.test.tsx` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 2 | EVAL-02 | python smoke | `python3 -m py_compile src/api/http_dashboard_server.py src/api/http_realtime_evaluation.py src/api/evaluation/contracts.py src/api/evaluation/orchestration.py src/api/evaluation/provider.py src/api/evaluation/smoke.py && python3 src/api/evaluation/smoke.py` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 2 | EVAL-03 | frontend integration | `cd frontend && npm test -- --run src/components/__tests__/doctor-evaluation-panel.test.tsx src/app/__tests__/doctor-evaluation-page.test.tsx` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 3 | EVAL-04 | SQL + repository | `export DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/postgres' && PATH="/home/healink/ykhl/test-ai/bin:$PATH" bash sql/tests/run-phase-01.sh eval_01_persistence_chain` | ✅ | ⬜ pending |
| 04-03-02 | 03 | 3 | analytics reuse smoke | `python3 -m py_compile src/api/evaluation/repository.py src/api/evaluation/orchestration.py src/api/http_realtime_evaluation.py src/domain/analytics/contracts.py src/domain/analytics/query_service.py src/domain/analytics/reuse_smoke.py && python3 src/domain/analytics/reuse_smoke.py` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `frontend/src/components/__tests__/doctor-evaluation-panel.test.tsx` — planned as the component coverage entrypoint for trigger and result states
- [x] `frontend/src/app/__tests__/doctor-evaluation-page.test.tsx` — planned as the page-shell coverage entrypoint for the embeddable doctor view
- [x] Python verification strategy locked to direct smoke scripts: `src/api/evaluation/smoke.py` and `src/domain/analytics/reuse_smoke.py`
- [x] `sql/tests/eval_01_persistence_chain.sql` — planned SQL assertions for persisted evaluation outcomes
- [x] Fixture payloads for the EMR encounter snapshot contract are part of the smoke-script path

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Doctor panel remains non-disruptive to the existing EMR workflow | EVAL-01 | Requires checking embedding behavior inside the host shell, which the repo does not own | Mount the doctor page/panel in the target host shell and confirm the `诊鉴` trigger does not alter the underlying record-entry flow |
| Clinical wording remains assistive rather than autonomous | EVAL-03 | Tone and safety positioning need product review beyond automated string presence | Inspect success, timeout, and failed states in the UI and confirm assistive notice stays visible with no autonomous-diagnosis phrasing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
