---
phase: 05
slug: drilldown-and-release-hardening
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.3 + Testing Library for frontend; SQL assertion scripts for analytics semantics; direct `python3` smoke checks for HTTP/role/export behavior |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && npm test -- --run <test-file>` or `python3 src/api/analytics/drilldown_smoke.py` |
| **Full suite command** | `cd frontend && npm test -- --run src/app/__tests__/manager-drilldown-page.test.tsx src/components/__tests__/distribution-section.test.tsx src/components/__tests__/disease-insights-section.test.tsx src/app/__tests__/doctor-evaluation-page.test.tsx && python3 src/api/analytics/drilldown_smoke.py && python3 src/api/analytics/export_smoke.py && python3 src/api/security/role_access_smoke.py && export DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/postgres' && PATH=\"/home/healink/ykhl/test-ai/bin:$PATH\" bash sql/tests/run-phase-01.sh oper_01_problem_drilldown oper_02_case_export` |
| **Estimated runtime** | ~30 seconds for task-level feedback, ~75 seconds for the full phase gate |

---

## Sampling Rate

- **After every task commit:** Run the fastest task-specific slice under 30 seconds: targeted Vitest, `python3` smoke, or focused `python3 -m py_compile ...`
- **After every plan wave:** Run `cd frontend && npm test`
- **Before `$gsd-verify-work`:** Frontend drilldown coverage, backend smoke checks, and SQL assertions for detail/export semantics must be green
- **Max feedback latency:** 30 seconds for per-task sampling, 75 seconds only at the full phase gate

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | OPER-01 | frontend navigation | `cd frontend && npm test -- --run src/components/__tests__/distribution-section.test.tsx src/components/__tests__/disease-insights-section.test.tsx src/app/__tests__/manager-drilldown-page.test.tsx` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | OPER-01 | frontend state seam | `cd frontend && npm test -- --run src/app/__tests__/manager-drilldown-page.test.tsx src/components/__tests__/distribution-section.test.tsx src/components/__tests__/disease-insights-section.test.tsx` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 2 | OPER-01 | backend/query smoke | `python3 -m py_compile src/api/http_dashboard_drilldown.py src/api/analytics/drilldown_smoke.py src/domain/analytics/query_service.py && python3 src/api/analytics/drilldown_smoke.py` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | OPER-02 | SQL export semantics | `export DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/postgres' && PATH=\"/home/healink/ykhl/test-ai/bin:$PATH\" bash sql/tests/run-phase-01.sh oper_02_case_export` | ✅ | ⬜ pending |
| 05-02-03 | 02 | 2 | OPER-02 | CSV behavior smoke | `python3 -m py_compile src/api/http_dashboard_export.py src/api/analytics/export_smoke.py src/domain/analytics/query_service.py && python3 src/api/analytics/export_smoke.py` | ✅ | ⬜ pending |
| 05-03-01 | 03 | 3 | OPER-03 | role boundary smoke | `python3 -m py_compile src/api/http_dashboard_server.py src/api/http_dashboard_drilldown.py src/api/http_dashboard_export.py src/api/security/viewer_context.py src/api/security/role_access_smoke.py && python3 src/api/security/role_access_smoke.py` | ✅ | ⬜ pending |
| 05-03-02 | 03 | 3 | release hardening | regression + artifact gate | `cd frontend && npm test -- --run src/app/__tests__/manager-drilldown-page.test.tsx src/app/__tests__/doctor-evaluation-page.test.tsx && export DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/postgres' && PATH=\"/home/healink/ykhl/test-ai/bin:$PATH\" bash sql/tests/run-phase-01.sh oper_01_problem_drilldown oper_02_case_export eval_01_persistence_chain && test -f .planning/phases/05-drilldown-and-release-hardening/05-VERIFICATION.md && test -f .planning/phases/05-drilldown-and-release-hardening/05-HUMAN-UAT.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `frontend/src/app/__tests__/manager-drilldown-page.test.tsx` — planned as the main manager detail-shell entrypoint
- [x] `frontend/src/components/__tests__/distribution-section.test.tsx` — existing file can be extended for drilldown click behavior
- [x] `frontend/src/components/__tests__/disease-insights-section.test.tsx` — existing file can be extended for drilldown click behavior
- [x] `src/api/analytics/drilldown_smoke.py` — planned smoke entrypoint for detail query wiring
- [x] `src/api/analytics/export_smoke.py` — planned smoke entrypoint for CSV headers, filename, and representative rows
- [x] `src/api/security/role_access_smoke.py` — planned smoke entrypoint for role-gated route behavior
- [x] `sql/tests/oper_01_problem_drilldown.sql` — planned SQL assertion for drilldown row semantics
- [x] `sql/tests/oper_02_case_export.sql` — planned SQL assertion for export row semantics

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 管理者确认下钻筛选、病例字段和导出文件足够支持人工复核 | OPER-01, OPER-02 | Requires product/user judgment on operational review usability | In the real manager workflow, click through from homepage signals, inspect case rows, download the file, and confirm the result is suitable for follow-up review |
| 医生端与管理端 bootstrap/宿主集成没有角色串场 | OPER-03 | Host role context is provided outside this repo and cannot be fully simulated here | Verify a doctor host only exposes doctor evaluation entrypoints, and a manager host exposes dashboard/drilldown/export without leaking doctor-only embed behavior |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 75s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
