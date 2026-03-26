---
phase: 05-drilldown-and-release-hardening
verified: 2026-03-26T10:20:18+08:00
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "管理端人工复核链路确认"
    expected: "管理者可以从首页进入下钻、核对问题病例列表并成功下载 CSV，且导出内容满足人工复核使用预期。"
    why_human: "仓库自动化只能证明 URL、查询语义和 CSV 合同，无法代替真实管理者确认字段可读性和人工复核体验。"
  - test: "真实宿主角色上下文接入确认"
    expected: "真实宿主向管理端与医生端分别注入正确的 viewer role/header，doctor 与 manager surface 不会串场或越权。"
    why_human: "本地只验证 `X-Viewer-Role` / `X-Viewer-Id` 合同和 403 语义，无法自动覆盖真实宿主接入行为。"
---

# Phase 5: Drilldown and Release Hardening Verification Report

**Phase Goal:** 交付问题病例下钻、导出、角色权限和上线前收口工作
**Verified:** 2026-03-26T10:20:18+08:00
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | 管理者可以从首页下钻到科室、医生或病种维度的问题明细 | ✓ VERIFIED | Homepage modules emit drilldown intents in [frontend/src/components/distribution-section.tsx](/home/healink/ykhl/test-ai/frontend/src/components/distribution-section.tsx) and [frontend/src/components/disease-insights-section.tsx](/home/healink/ykhl/test-ai/frontend/src/components/disease-insights-section.tsx); URL-driven shell renders detail states in [frontend/src/app/manager-drilldown-page.tsx](/home/healink/ykhl/test-ai/frontend/src/app/manager-drilldown-page.tsx) and is switched from [frontend/src/app/dashboard-overview-page.tsx](/home/healink/ykhl/test-ai/frontend/src/app/dashboard-overview-page.tsx). |
| 2 | 管理者可以查看并下载问题病例，支持进一步人工复核 | ✓ VERIFIED | Drilldown requests and export requests share the same typed filter serialization in [frontend/src/lib/manager-drilldown-api.ts](/home/healink/ykhl/test-ai/frontend/src/lib/manager-drilldown-api.ts) and [frontend/src/lib/export-api.ts](/home/healink/ykhl/test-ai/frontend/src/lib/export-api.ts); backend detail/export handlers both reuse `get_problem_case_rows(...)` in [src/api/http_dashboard_drilldown.py](/home/healink/ykhl/test-ai/src/api/http_dashboard_drilldown.py), [src/api/http_dashboard_export.py](/home/healink/ykhl/test-ai/src/api/http_dashboard_export.py), and [src/domain/analytics/query_service.py](/home/healink/ykhl/test-ai/src/domain/analytics/query_service.py). |
| 3 | 系统对不同角色开放相应查询能力，避免医生和管理端权限混淆 | ✓ VERIFIED | Shared viewer vocabulary exists in [frontend/src/lib/viewer-context-contracts.ts](/home/healink/ykhl/test-ai/frontend/src/lib/viewer-context-contracts.ts) and [src/api/security/viewer_context.py](/home/healink/ykhl/test-ai/src/api/security/viewer_context.py); manager routes enforce `require_manager_access(...)` in [src/api/http_dashboard_server.py](/home/healink/ykhl/test-ai/src/api/http_dashboard_server.py); UI boundaries are covered in [frontend/src/app/doctor-evaluation-page.tsx](/home/healink/ykhl/test-ai/frontend/src/app/doctor-evaluation-page.tsx) and [frontend/src/app/manager-drilldown-page.tsx](/home/healink/ykhl/test-ai/frontend/src/app/manager-drilldown-page.tsx). |
| 4 | 上线前关键业务链路和指标口径完成验收 | ✓ VERIFIED | Cross-phase automation covered manager drilldown/export and persisted realtime reuse through Vitest, Python smokes, and SQL tests including `eval_01_persistence_chain`; the residual gap is explicitly captured in human UAT rather than hidden as implicit risk. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `frontend/src/app/manager-drilldown-page.tsx` | URL-driven manager drilldown shell | ✓ VERIFIED | Handles loading, empty, error, success, export trigger, and role gating. |
| `frontend/src/lib/export-api.ts` | Typed export request builder from active drilldown scope | ✓ VERIFIED | Reuses current drilldown filters and manager viewer headers. |
| `src/api/http_dashboard_drilldown.py` | Real JSON drilldown endpoint | ✓ VERIFIED | Parses request params and delegates to canonical case-query helper. |
| `src/api/http_dashboard_export.py` | Real CSV export endpoint | ✓ VERIFIED | Serializes the same filtered case rows into deterministic CSV output. |
| `src/api/security/viewer_context.py` | Shared local/dev viewer-role contract | ✓ VERIFIED | Accepts `X-Viewer-Role` and `X-Viewer-Id`, rejects missing or non-manager access for manager routes. |
| `.planning/phases/05-drilldown-and-release-hardening/05-HUMAN-UAT.md` | Manual release checklist | ✓ VERIFIED | Captures the two remaining real-environment checks before release. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `frontend/src/components/distribution-section.tsx` | `frontend/src/app/manager-drilldown-page.tsx` | department/doctor drilldown intent encoded into URL state | ✓ WIRED | `DashboardOverviewPage` converts typed intents to `view=manager-drilldown` search state. |
| `frontend/src/components/disease-insights-section.tsx` | `frontend/src/app/manager-drilldown-page.tsx` | disease drilldown intent encoded into URL state | ✓ WIRED | Disease insight buttons open the same drilldown shell with disease scope. |
| `frontend/src/lib/manager-drilldown-api.ts` | `src/api/http_dashboard_drilldown.py` | real manager detail route | ✓ WIRED | Frontend loads `/api/problem-drilldown` with manager viewer headers. |
| `frontend/src/lib/export-api.ts` | `src/api/http_dashboard_export.py` | real CSV export route | ✓ WIRED | Frontend requests `/api/problem-cases/export` with the same active drilldown filters. |
| `src/api/http_dashboard_drilldown.py` | `src/domain/analytics/query_service.py` | canonical problem-case query | ✓ WIRED | Handler reuses `get_problem_case_rows(...)` and `summarize_problem_case_rows(...)`. |
| `src/api/http_dashboard_export.py` | `src/domain/analytics/query_service.py` | export reuses the canonical problem-case query | ✓ WIRED | CSV rows come from the same helper as the detail view. |
| `frontend/src/lib/viewer-context-contracts.ts` | `src/api/security/viewer_context.py` | shared viewer role vocabulary | ✓ WIRED | Both sides use `manager` / `doctor` as the explicit role contract. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Homepage drilldown entrypoints and manager shell behavior pass | `cd frontend && npm test -- --run src/components/__tests__/distribution-section.test.tsx src/components/__tests__/disease-insights-section.test.tsx src/app/__tests__/manager-drilldown-page.test.tsx src/app/__tests__/dashboard-overview-page.test.tsx src/app/__tests__/doctor-evaluation-page.test.tsx` | `5` test files, `15` tests passed | ✓ PASS |
| Python manager routes and security modules compile | `python3 -m py_compile src/api/http_dashboard_server.py src/api/http_dashboard_drilldown.py src/api/http_dashboard_export.py src/api/security/viewer_context.py src/api/security/role_access_smoke.py src/api/analytics/drilldown_smoke.py src/api/analytics/export_smoke.py src/domain/analytics/query_service.py` | exited `0` | ✓ PASS |
| Drilldown handler smoke passes | `python3 src/api/analytics/drilldown_smoke.py` | exited `0` | ✓ PASS |
| Export handler smoke passes | `python3 src/api/analytics/export_smoke.py` | exited `0` | ✓ PASS |
| Role gate smoke passes | `python3 src/api/security/role_access_smoke.py` | exited `0` | ✓ PASS |
| SQL drilldown semantics pass | `export DATABASE_URL=... && PATH=... bash sql/tests/run-phase-01.sh oper_01_problem_drilldown` | exited `0` against local PostgreSQL | ✓ PASS |
| SQL export semantics pass | `export DATABASE_URL=... && PATH=... bash sql/tests/run-phase-01.sh oper_02_case_export` | exited `0` against local PostgreSQL | ✓ PASS |
| Phase 4 persisted realtime reuse still passes | `export DATABASE_URL=... && PATH=... bash sql/tests/run-phase-01.sh eval_01_persistence_chain` | exited `0` against local PostgreSQL | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `OPER-01` | `05-01`, `05-02`, `05-03` | 管理者可以从首页下钻到科室、医生或病种维度的问题明细 | ✓ SATISFIED | Typed drilldown intent, URL-driven shell, and real backend detail handler are present across [frontend/src/app/dashboard-overview-page.tsx](/home/healink/ykhl/test-ai/frontend/src/app/dashboard-overview-page.tsx), [frontend/src/app/manager-drilldown-page.tsx](/home/healink/ykhl/test-ai/frontend/src/app/manager-drilldown-page.tsx), and [src/api/http_dashboard_drilldown.py](/home/healink/ykhl/test-ai/src/api/http_dashboard_drilldown.py). |
| `OPER-02` | `05-02`, `05-03` | 管理者可以查看并下载问题病例，支持进一步人工复核 | ✓ SATISFIED | Export trigger and CSV endpoint exist in [frontend/src/components/export-cases-button.tsx](/home/healink/ykhl/test-ai/frontend/src/components/export-cases-button.tsx), [frontend/src/lib/export-api.ts](/home/healink/ykhl/test-ai/frontend/src/lib/export-api.ts), and [src/api/http_dashboard_export.py](/home/healink/ykhl/test-ai/src/api/http_dashboard_export.py). |
| `OPER-03` | `05-03` | 系统需要对不同角色开放相应查询能力，避免医生和管理端权限混淆 | ✓ SATISFIED | Shared viewer-role contracts and route-level manager checks exist in [frontend/src/lib/viewer-context-contracts.ts](/home/healink/ykhl/test-ai/frontend/src/lib/viewer-context-contracts.ts), [src/api/security/viewer_context.py](/home/healink/ykhl/test-ai/src/api/security/viewer_context.py), and [src/api/http_dashboard_server.py](/home/healink/ykhl/test-ai/src/api/http_dashboard_server.py). |

Phase 05 requirement IDs declared across plan frontmatter: `OPER-01`, `OPER-02`, `OPER-03`.
Cross-check against [REQUIREMENTS.md](/home/healink/ykhl/test-ai/.planning/REQUIREMENTS.md): all three IDs are present and accounted for. No Phase 05 orphaned requirements were found.

### Residual Risks

- Real manager review usability still needs human confirmation: the repository can prove row-set alignment and CSV shape, but not whether the exported fields are sufficient for operational review.
- Real host integration still needs human confirmation: local/dev tests prove the viewer-header contract and UI guards, but not the actual host bootstrap implementation.

### Human Verification Required

### 1. 管理端人工复核链路确认

**Test:** 在真实管理端使用首页筛选、科室/医生/病种下钻和 CSV 导出，抽样核对屏幕病例与下载文件。  
**Expected:** drilldown 页面、导出文件和人工复核习惯一致，管理者能直接用于后续复核。  
**Why human:** 自动化无法评价真实运营使用体验与字段可读性。

### 2. 真实宿主角色上下文接入确认

**Test:** 在真实宿主里分别以 manager 与 doctor 身份进入管理端和医生端 surface。  
**Expected:** manager 可以访问首页下钻与导出，doctor 可以访问医生端诊鉴，双方不会越权或串场。  
**Why human:** 本地 smoke 只覆盖约定 headers 和 403 语义，无法确认真实宿主注入逻辑。

### Gaps Summary

未发现阻断 Phase 5 目标达成的代码级缺口。自动化已覆盖首页到下钻、下钻到导出、角色拒绝语义以及 Phase 4 持久化链路复用；剩余项均属于真实管理端使用体验和真实宿主集成验证，适合进入 verify-work 或上线前人工确认。

---

_Verified: 2026-03-26T10:20:18+08:00_  
_Verifier: Codex_
