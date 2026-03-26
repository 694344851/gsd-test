# Phase 5: Drilldown and Release Hardening - Research

**Researched:** 2026-03-25
**Domain:** Manager-side drilldown, case export, role boundary enforcement, and release hardening on top of the existing React dashboard, Python HTTP server, and PostgreSQL analytics layer
**Confidence:** MEDIUM

<user_constraints>
## User Constraints

> No `05-CONTEXT.md` exists yet. The constraints below are the concrete planning inputs extracted from [`ROADMAP.md`](/home/healink/ykhl/test-ai/.planning/ROADMAP.md), [`REQUIREMENTS.md`](/home/healink/ykhl/test-ai/.planning/REQUIREMENTS.md), [`PROJECT.md`](/home/healink/ykhl/test-ai/.planning/PROJECT.md), Phase 4 artifacts, and [`门诊诊鉴首页-(全栈).md`](/home/healink/ykhl/test-ai/门诊诊鉴首页-(全栈).md).

### Locked Decisions
- Phase 5 scope is limited to `OPER-01`, `OPER-02`, and `OPER-03`.
- This phase must build on the current repo reality: React frontend in `frontend/src`, Python stdlib HTTP handlers in `src/api`, and PostgreSQL-driven analytics semantics under `sql/` and `src/domain/analytics/query_service.py`.
- Managers must be able to drill down from the existing homepage signals into problem-case detail at department, doctor, or disease granularity.
- Managers must be able to export the filtered problem-case list for manual review.
- Doctor-side realtime evaluation and manager-side analytics must have clear role boundaries; Phase 5 should not introduce a full IAM platform.
- Release hardening must cover key business flows and metrics continuity across Phases 1-4, not just new Phase 5 endpoints in isolation.
- The likely plan split should remain the roadmap split:
  1. drilldown detail page and filter linkage
  2. case export/download
  3. role boundary, UAT, and release readiness

### Claude's Discretion
- Exact route/mount implementation details, as long as drilldown state is URL-addressable and does not force an unnecessary application rewrite.
- Exact API contract split between detail query and export endpoints, as long as it keeps filters explicit and reusable.
- Exact role propagation mechanism, as long as it is enforced server-side and visible in frontend bootstrap assumptions.
- Exact validation split across Vitest, Python smoke scripts, SQL assertions, and manual UAT.

### Deferred Ideas (OUT OF SCOPE)
- SSO, RBAC admin consoles, permission self-service, or multi-tenant auth policy management.
- Background export jobs, async notification delivery, or large-file export infrastructure.
- Deep case-review workflow tooling beyond filtered view and download.
- Governance alerts, subscriptions, and cross-institution benchmarking from v2.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPER-01 | 管理者可以从首页下钻到科室、医生或病种维度的问题明细 | Recommend homepage-to-detail navigation plus a typed drilldown query contract that reuses existing filter semantics |
| OPER-02 | 管理者可以查看并下载问题病例，支持进一步人工复核 | Recommend a server-generated CSV export path sourced from the same filtered case query as the detail page |
| OPER-03 | 系统需要对不同角色开放相应查询能力，避免医生和管理端权限混淆 | Recommend explicit viewer-role bootstrap context and server-side route gating instead of UI-only hiding |
</phase_requirements>

## Summary

Phase 5 should finish the manager workflow by extending the existing dashboard into a second view layer for filtered case detail, not by creating a separate operations product. The existing homepage already exposes the signals managers care about, and Phase 4 now persists realtime evaluation detail. The missing work is to connect those aggregate views to case-level records, expose an export path over the same filters, and prevent doctor and manager surfaces from crossing access boundaries.

The safest repo-native design is a URL-driven manager drilldown shell backed by new GET endpoints on the current Python server. Drilldown requests should carry the current homepage filters plus a typed dimension target (`department`, `doctor`, `disease`) and selected value. Those selections need to survive refresh and copy-paste, so the detail view should be encoded in route/search state rather than hidden local component state. The backend should translate those filters into a case-level query over the Phase 1/3/4 tables, returning both a compact summary header and paged case rows. Export should reuse the same query builder and serialize CSV on the server so the frontend only initiates download rather than reconstructing data client-side.

Role handling should stay intentionally narrow. The repo still has no auth/session platform, so Phase 5 should assume the host/bootstrap layer provides a trusted `viewer_role` and identity context. That role must still be enforced in backend handlers; hiding links in the UI is not enough. This gives the phase a credible boundary without inventing infrastructure the codebase does not own.

**Primary recommendation:** Implement Phase 5 as a manager drilldown/detail workflow plus CSV export and request-level role gating, while treating bootstrap role context as an explicit host integration assumption and validating the full manager-to-doctor boundary with targeted smoke tests and human UAT.

## Project Constraints (from AGENTS.md / PROJECT.md)

- Use the GSD workflow artifacts; planning must stay inside `.planning/phases/05-drilldown-and-release-hardening/`.
- Do not break the outpatient EMR core flow or the embedded doctor evaluation entrypoint from Phase 4.
- Keep analytics semantics in the backend/query layer; frontend drilldown pages must not redefine metric formulas.
- PostgreSQL compatibility remains required.
- Clinical positioning remains assistive; manager analytics and doctor evaluation are different surfaces with different access rules.

## Standard Stack

### Core
| Library / Layer | Version | Purpose | Why Standard Here |
|-----------------|---------|---------|-------------------|
| React | 18.3.1 (repo-pinned) | Manager drilldown/detail UX | Existing dashboard shell and test stack already use React |
| Vite | 5.4.10 (repo-pinned) | Existing frontend runtime and `/api` proxy | Already configured and sufficient for another manager view |
| Vitest + Testing Library | 2.1.3 / 16.3.0 (repo-pinned) | Navigation, role-state, and download-trigger coverage | Existing frontend tests already cover dashboard and doctor flows |
| Python stdlib HTTP server | repo-local | Drilldown, export, and role-gated route handling | Matches current API architecture; no second web framework required |
| PostgreSQL semantic layer | repo-local | Case-level drilldown filtering and export source of truth | Existing aggregate semantics and Phase 4 detail persistence already live here |

### Supporting
| Library / Layer | Version | Purpose | When to Use |
|-----------------|---------|---------|-------------|
| Existing analytics filter contracts | repo-local | Preserve time-range and comparison semantics across homepage and detail pages | Reuse rather than inventing a second filter model |
| CSV serialization via Python stdlib | repo-local | Lightweight export responses | Sufficient because Phase 5 exports filtered review lists, not large async batches |
| Query service helpers | repo-local | Shared SQL execution and row mapping | Extend `src/domain/analytics/query_service.py` for detail/export accessors |
| Bootstrap role context contracts | new, repo-local | Explicit host-provided viewer role and identity | Required because there is no auth stack in-repo |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extend current dashboard app with a drilldown shell | Create a separate management frontend | Duplicates tooling and fragments filter logic |
| Server-side CSV endpoint | Client-side CSV generation from rendered table data | Risks mismatch with backend filters and role enforcement |
| Request-level `viewer_role` gate | Full auth provider / session middleware | Better long-term, but not credible inside current repo scope |
| Reuse one case-query builder for detail and export | Build separate SQL paths for screen and export | Faster short-term, but creates semantic drift exactly where release hardening should reduce it |

**Installation:** No new runtime dependency is required for planning. Implementation can stay on the current frontend/backend stack.

## Architecture Patterns

### Recommended Project Structure
```text
frontend/src/
├── app/
│   ├── dashboard-overview-page.tsx
│   ├── manager-drilldown-page.tsx          # New manager detail shell
│   └── doctor-evaluation-page.tsx
├── components/
│   ├── distribution-section.tsx            # Add click-through affordances
│   ├── disease-insights-section.tsx        # Add click-through affordances
│   ├── manager-drilldown-header.tsx
│   ├── problem-case-table.tsx
│   ├── drilldown-filter-summary.tsx
│   └── export-cases-button.tsx
├── lib/
│   ├── manager-drilldown-api.ts
│   ├── manager-drilldown-contracts.ts
│   ├── export-api.ts
│   └── viewer-context-contracts.ts
└── styles/
    └── dashboard.css

src/api/
├── http_dashboard_server.py
├── http_dashboard_drilldown.py             # New GET detail endpoint handler
├── http_dashboard_export.py                # New CSV export handler
└── security/
    ├── __init__.py
    └── viewer_context.py                   # Parse and validate viewer role bootstrap data

src/domain/analytics/
├── contracts.py
└── query_service.py                        # Add drilldown/export query helpers

sql/
├── tests/
│   ├── oper_01_problem_drilldown.sql
│   └── oper_02_case_export.sql
```

### Pattern 1: Homepage Modules Emit Typed Drilldown Intents
**What:** The homepage should not embed case tables inline. Existing distribution and disease modules should emit a typed intent that opens the manager drilldown view with current filters plus the selected department/doctor/disease dimension, and that intent must be representable in the URL.
**When to use:** For all manager-side drilldown entrypoints.
**Example:**
```ts
export interface DrilldownIntent {
  dimension: 'department' | 'doctor' | 'disease';
  dimension_label: string;
  dimension_value: string;
  source_module: 'distribution' | 'disease_insights' | 'overview';
  filters: DashboardFilters;
}
```

### Pattern 2: Use One Canonical Case Query for Screen and Export
**What:** Build one backend query helper that resolves the filtered problem-case rows. The detail endpoint returns JSON; the export endpoint serializes those rows to CSV.
**When to use:** Always. This is the cleanest way to guarantee export matches what the manager reviewed on screen.
**Example:**
```python
def get_problem_case_rows(filters: DrilldownFilters, *, executor=execute_query) -> list[ProblemCaseRow]:
    sql = """
      select
        encounter_id,
        patient_name,
        department_name,
        doctor_name,
        primary_diagnosis_name,
        evaluation_status,
        diagnosis_basis_incomplete,
        missing_diagnosis,
        triggered_at
      from analytics_problem_case_detail
      where triggered_at between $1 and $2
        and ($3::text is null or department_name = $3)
        and ($4::text is null or doctor_name = $4)
        and ($5::text is null or primary_diagnosis_name = $5)
      order by triggered_at desc, encounter_id desc
    """
```

### Pattern 3: Server-Side Role Gate, Frontend Role-Aware Rendering
**What:** The frontend may hide manager-only entrypoints for doctors, but the backend must still reject manager drilldown/export requests unless `viewer_role=manager` is present and valid.
**When to use:** For every Phase 5 route.
**Example:**
```python
viewer = read_viewer_context(headers=self.headers)
if viewer.role != "manager":
    return write_json_error(handler, status=403, code="forbidden", message="manager access required")
```

### Pattern 4: Keep Doctor and Manager Mounts Separate
**What:** Continue treating the doctor panel and manager dashboard as separate mounts or explicit entry shells, even if they share contracts and styling tokens. Manager drilldown can add URL-driven navigation inside the dashboard surface without bleeding into the doctor embed surface.
**When to use:** Always. This avoids accidental leakage of manager UI into the EMR-embedded doctor surface.
**Example:** `mountDoctorEvaluationEmbed(...)` remains doctor-only; manager drilldown is reached from the dashboard shell or a dedicated manager mount function.

### Pattern 5: Release Hardening Means Cross-Phase Business Verification
**What:** Phase 5 should verify more than new feature existence. It should explicitly regression-check that Phase 3 homepage filters still align with Phase 5 detail rows and that Phase 4 persisted evaluations remain queryable in manager drilldown/export.
**When to use:** During plan 05-03 and before human verification.
**Example:** A smoke test can seed a persisted Phase 4 evaluation row and assert it appears in the manager drilldown list and CSV export under the expected filters.

## Implementation Notes from Current Codebase

- `frontend/src/app/dashboard-overview-page.tsx` is still a single-page dashboard shell with no router; Phase 5 should introduce the minimum URL-driven navigation needed for drilldown refresh/share/export fidelity, not leave drilldown hidden in ephemeral local state.
- `frontend/src/components/distribution-section.tsx` and `frontend/src/components/disease-insights-section.tsx` already own the most obvious drilldown entrypoints, but neither currently emits click-through navigation.
- `frontend/src/lib/analytics-filters.ts` already defines the canonical time-range/filter model; Phase 5 should reuse it for manager drilldown requests.
- `src/api/http_dashboard_server.py` already dispatches existing analytics GET routes and the Phase 4 realtime POST route, so new drilldown/export handlers fit naturally there.
- `src/domain/analytics/query_service.py` already exposes aggregate analytics queries and `get_persisted_realtime_evaluation(...)`; this is the correct extension point for case-level drilldown/export helpers.
- `sql/migrations/005_phase4_realtime_evaluation.sql` persists structured detail that Phase 5 can reuse; new drilldown/export work should prefer derived queries over schema churn unless a real gap appears.

## Validation Architecture

Phase 5 needs both feature validation and regression validation. The highest-risk failure mode is not “button missing”; it is semantic drift between homepage aggregate filters, detail rows, CSV export, and role boundaries. Validation should therefore pair frontend tests with backend/query smoke tests and SQL assertions over a shared fixture set.

Recommended validation split:

- `05-01` drilldown: Vitest coverage for homepage click-through and detail-shell rendering, plus SQL/Python checks that the selected dimension and filters resolve the expected case rows.
- `05-02` export: Python smoke coverage for CSV response shape and filename contract, plus SQL assertions that exported rows match the same filtered case set used by drilldown.
- `05-03` role/release hardening: smoke coverage for 403 behavior on manager-only routes, regression checks that doctor embed still works, and human UAT for real-world manager review/download flow.

Wave 0 should reserve the following test artifacts before implementation:

- `frontend/src/app/__tests__/manager-drilldown-page.test.tsx`
- `frontend/src/components/__tests__/distribution-section.test.tsx` updates for click-through behavior
- `frontend/src/components/__tests__/disease-insights-section.test.tsx` updates for click-through behavior
- `src/api/analytics/drilldown_smoke.py`
- `src/api/security/role_access_smoke.py`
- `sql/tests/oper_01_problem_drilldown.sql`
- `sql/tests/oper_02_case_export.sql`

Manual validation should stay limited to the gaps automation cannot credibly cover in-repo:

- Manager confirms the drilldown screen and export file support actual manual review workflow.
- Real host/bootstrap integration confirms doctor and manager surfaces receive the correct `viewer_role` context and do not cross-link incorrectly.
