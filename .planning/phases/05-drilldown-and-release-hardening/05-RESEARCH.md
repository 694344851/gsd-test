# Phase 5: Drilldown and Release Hardening - Research

**Researched:** 2026-03-25
**Domain:** 管理端下钻明细、病例导出、角色权限、上线前验收
**Confidence:** MEDIUM

## User Constraints

No phase-specific `CONTEXT.md` exists for Phase 5.

Locked decisions from current project artifacts:
- Keep the existing greenfield repo shape instead of introducing a new platform.
- Reuse the Phase 1 analytics semantic layer instead of recalculating metrics in the frontend.
- Reuse Phase 4 persisted realtime evaluation records for downstream analytics/drilldown where possible.
- Preserve the host-mounted doctor embed model; doctor UI does not take router ownership.

Claude's discretion:
- Choose the management-side drilldown routing approach.
- Choose the detail table implementation.
- Choose the export delivery shape.
- Define the release hardening checklist and validation coverage.

Deferred ideas (out of scope):
- Governance subscriptions/alerts (`GOV-*`)
- Cross-campus benchmarking
- Mobile/native clients
- Non-outpatient scenarios

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPER-01 | 管理者可以从首页下钻到科室、医生或病种维度的问题明细 | Add URL-backed management routes, scoped drilldown query contracts, and server-driven detail tables. |
| OPER-02 | 管理者可以查看并下载问题病例，支持进一步人工复核 | Add backend CSV export endpoint that shares the same scoped query/filter contract as the detail page. |
| OPER-03 | 系统需要对不同角色开放相应查询能力，避免医生和管理端权限混淆 | Add request-scoped server-side authorization gates and a role/resource matrix verified per endpoint. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- 必须集成现有门诊病历系统，不能破坏原系统核心诊疗流程。
- 实时诊鉴结果目标约 10 秒返回，医生侧链路不能被 Phase 5 改动拖慢。
- 统计指标和环比口径必须一致，管理端下钻和导出必须复用同一套口径。
- 后端设计需兼容当前 PostgreSQL 数据源或明确迁移方案。
- 产品只能做辅助评估与提示，不能表达为自动诊断结论。
- v1 优先完成门诊诊鉴首页和实时诊鉴主链路，复杂治理能力延后。
- 文档/代码改动应通过 GSD workflow 产出，不要绕过规划工件直接修改仓库。

## Summary

Phase 5 is the first phase that cuts across every layer already built: homepage filters and cards from Phases 2-3, persisted evaluation records from Phase 4, and the SQL semantic model from Phase 1. The planning risk is not the UI itself; it is keeping drilldown, export, and permission boundaries aligned so the visible rows, downloaded rows, and allowed rows are identical.

The current codebase has no router, no authorization layer, and no paged detail endpoints. It does already have two useful foundations: a shared `DashboardFilters` contract in the frontend and a shared `AnalyticsFilters` contract plus lightweight HTTP handlers in the backend. Phase 5 should extend those seams instead of introducing a second query model.

Release hardening should be planned as a real deliverable, not a cleanup footnote. The phase needs explicit acceptance for metric consistency, role boundary checks, and end-to-end management flows because broken access control and export mismatches are the highest-risk release defects here.

**Primary recommendation:** add management-only URL routing plus a server-driven drilldown/export API that reuses analytics filters and is guarded by a central authorization check on every request.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-router-dom` | `7.13.2` | 管理端 drilldown 路由、路由参数、查询串同步 | Current standard router for React web apps; gives deep-linkable detail pages instead of local component state only. |
| `@tanstack/react-table` | `8.21.3` | 明细表格列定义、排序、分页状态 | Standard headless table layer for server-driven tables; avoids building table state logic by hand. |
| Python `csv` stdlib | `3.12.3` local runtime | 服务端 CSV 导出 | Official standard library handles quoting/newlines correctly and avoids a frontend-only export mismatch. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing `react` | `18.3.1` repo-pinned | 管理端页面和组件 | Keep existing React baseline; Phase 5 does not need a framework migration. |
| Existing `vite` | `5.4.10` repo-pinned | 前端 build/test toolchain | Keep current Vite app structure and add routing inside it. |
| Web `URLSearchParams` | Platform API | drilldown filters 与 export 参数共用 | Use for deterministic URL serialization that matches current frontend query builders. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-router-dom` | manual view switching + `history.pushState` | Lower dependency count, but you would reimplement route matching, back/forward behavior, and drilldown deep links. |
| `@tanstack/react-table` | custom HTML table state | Fine for static tables, but Phase 5 needs sortable/paged/filterable detail grids and will accumulate edge cases fast. |
| Python `csv` export | browser-side CSV assembly (`Blob` + manual string escaping) | Works for tiny happy-path datasets, but increases correctness drift against backend filters and Excel quoting issues. |

**Installation:**
```bash
npm --prefix frontend install react-router-dom@7.13.2 @tanstack/react-table@8.21.3
```

**Version verification:** verified on 2026-03-25 with `npm view`.
- `react-router-dom@7.13.2` published 2026-03-23
- `@tanstack/react-table@8.21.3` published 2025-04-14
- `papaparse@5.5.3` is current as of 2025-05-19, but not recommended here because export should stay server-side

## Architecture Patterns

### Recommended Project Structure
```text
frontend/src/
├── app/
│   ├── dashboard-app.tsx          # BrowserRouter shell for management UI
│   ├── dashboard-overview-page.tsx
│   └── drilldown-page.tsx         # detail page for department/doctor/disease scopes
├── components/
│   └── drilldown/
│       ├── issue-case-table.tsx
│       ├── drilldown-header.tsx
│       └── drilldown-filters.tsx
└── lib/
    ├── drilldown-api.ts
    ├── drilldown-contracts.ts
    └── auth-context.ts

src/
├── api/
│   ├── authz.py                   # request role parsing + guard helpers
│   ├── http_dashboard_drilldown.py
│   └── http_dashboard_export.py
├── api/analytics/
│   └── drilldown.py               # response builders
└── domain/analytics/
    ├── drilldown_contracts.py
    └── query_service.py           # add drilldown list/export queries

sql/
└── migrations/
    └── 006_phase5_drilldown.sql   # scoped detail function(s)
```

### Pattern 1: URL-backed management drilldown
**What:** Use real routes plus query-string filters so homepage state, detail page state, and export parameters are all serializable and shareable.
**When to use:** Any manager-facing drilldown entry from overview cards, distribution bubbles, or disease cloud.
**Example:**
```tsx
// Source: React Router docs + current frontend query-builder pattern
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom';

function DrilldownPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const scope = searchParams.get('scope') ?? 'department';
  const entityId = searchParams.get('entity_id');

  function updatePage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  }

  return <section data-scope={scope} data-entity-id={entityId} />;
}

export function DashboardApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardOverviewPage />} />
        <Route path="/drilldown" element={<DrilldownPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Pattern 2: Server-driven detail table
**What:** Let the backend own filtering, sorting, and pagination; let the frontend table own only view state.
**When to use:** Issue-case detail lists that can grow beyond a single visible page or be exported.
**Example:**
```tsx
// Source: TanStack Table pagination/column docs, adapted for this repo
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<IssueCaseRow>[] = [
  { accessorKey: 'encounter_id', header: '就诊号' },
  { accessorKey: 'doctor_name', header: '医生' },
  { accessorKey: 'issue_type', header: '问题类型' },
  { accessorKey: 'triggered_at', header: '评估时间' },
];

const table = useReactTable({
  data: rows,
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
  rowCount: totalCount,
  state: { pagination },
});
```

### Pattern 3: Shared query contract for page and export
**What:** The detail page API and export API should accept the same scope/filter/sort contract; export adds only file-format concerns.
**When to use:** Every exported dataset that originates from a visible manager drilldown.
**Example:**
```python
# Source: current AnalyticsFilters pattern + Python csv docs
@dataclass(slots=True)
class DrilldownFilters(AnalyticsFilters):
    scope: Literal["department", "doctor", "disease"]
    entity_id: str
    issue_kind: Literal["basis_incomplete", "missing_diagnosis", "all"] = "all"
    page: int = 1
    page_size: int = 50
    sort_by: str = "triggered_at"
    sort_order: Literal["asc", "desc"] = "desc"
```

### Pattern 4: Central request authorization
**What:** Parse caller identity/role once per request and enforce permission checks in a shared helper before invoking analytics queries or export.
**When to use:** All manager analytics endpoints and all doctor-side record lookups.
**Example:**
```python
# Source: OWASP Authorization Cheat Sheet principles, adapted to current http.server stack
def require_role(request_role: str | None, allowed: set[str]) -> None:
    if request_role not in allowed:
        raise PermissionError("forbidden")

def handle_export(path: str, headers: Mapping[str, str]) -> tuple[bytes, dict[str, str], int]:
    require_role(headers.get("X-User-Role"), {"manager", "quality_admin"})
    filters = parse_drilldown_filters(path)
    return build_export_response(filters)
```

### Anti-Patterns to Avoid
- **Frontend-only permissions:** hiding buttons is not authorization; the backend must reject unauthorized requests.
- **Separate export query logic:** if export SQL differs from page SQL, users will download rows they never saw.
- **Client-side full-data tables:** loading entire drilldown datasets into the browser will break pagination, export parity, and memory usage.
- **Adding router ownership to doctor embed:** the doctor-side embedded page is intentionally host-mounted; keep routing scoped to management UI.
- **Recomputing issue semantics from raw payload JSON:** reuse persisted Phase 4 summary/detail fields and SQL semantics instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Management routing | ad hoc `useState` page switching | `react-router-dom` | Back/forward navigation, shareable URLs, and route params are already solved. |
| Detail table state | custom sorting/pagination reducer | `@tanstack/react-table` + server-driven data | Table state looks simple until sorting, empty states, and column metadata pile up. |
| CSV escaping | string join with commas/newlines | Python `csv.DictWriter` | Excel/newline/quote handling is easy to get wrong. |
| Authorization | per-handler inline role checks scattered in code | centralized `authz.py` helper + matrix tests | Reduces bypass bugs and keeps role rules auditable. |
| Export parity | duplicate SQL for “download” | shared drilldown query contract | Prevents visible rows and exported rows from diverging. |

**Key insight:** the dangerous custom work in this phase is not visual polish; it is state synchronization. Use one filter contract, one query path, and one authorization gate.

## Common Pitfalls

### Pitfall 1: Losing filter context during drilldown
**What goes wrong:** User clicks from homepage into a detail page but loses time range or selected entity filters.
**Why it happens:** Homepage state is stored only in React component memory.
**How to avoid:** Serialize drilldown state into the URL and derive page fetches from query params.
**Warning signs:** Refreshing the detail page changes the dataset or resets the scope.

### Pitfall 2: Exported rows do not match visible rows
**What goes wrong:** The CSV contains more or fewer cases than the user sees in the table.
**Why it happens:** Export endpoint rebuilds filters separately or omits issue/sort/scope parameters.
**How to avoid:** Export endpoint should consume the same parsed filter object as the detail list endpoint.
**Warning signs:** Manual spot-check on a small filter set returns different counts between table and CSV.

### Pitfall 3: Horizontal privilege escalation
**What goes wrong:** A doctor or lower-privilege user can call management endpoints directly.
**Why it happens:** Permissions are enforced only in the frontend, or handlers trust client-supplied identifiers.
**How to avoid:** Enforce deny-by-default authorization in every request path and test forbidden responses explicitly.
**Warning signs:** Any curl request with a forged role/header can access manager data.

### Pitfall 4: Export blocks request threads or exhausts memory
**What goes wrong:** Large exports freeze the lightweight HTTP server or build giant in-memory strings.
**Why it happens:** Entire result sets are materialized before writing, with no practical row cap or timeout plan.
**How to avoid:** Set explicit row limits for v1 exports and stream/write rows incrementally through `csv`.
**Warning signs:** Export latency grows linearly with row count and timeouts appear in manual testing.

### Pitfall 5: “Release hardening” becomes undocumented manual intuition
**What goes wrong:** Phase code ships, but metric checks, role matrix checks, and critical path UAT are never captured.
**Why it happens:** Release readiness is left as generic QA instead of explicit acceptance work.
**How to avoid:** Plan a concrete release checklist tied to OPER requirements and existing metric semantics.
**Warning signs:** No single artifact answers “what exactly was validated before go-live?”

## Code Examples

Verified patterns from official sources:

### Shared CSV writer for export
```python
# Source: https://docs.python.org/3/library/csv.html
import csv
import io

def build_csv(rows: list[dict[str, object]]) -> str:
    output = io.StringIO(newline="")
    writer = csv.DictWriter(
        output,
        fieldnames=["encounter_id", "case_id", "doctor_name", "issue_type", "triggered_at"],
        quoting=csv.QUOTE_MINIMAL,
    )
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()
```

### Attachment response for browser download
```python
# Source: MDN Content-Disposition guidance, adapted to current http.server server
filename = "problem-cases-2026-03-25.csv"
headers = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": f'attachment; filename="{filename}"',
}
```

### Drilldown link from an overview module
```tsx
// Source: React Router docs, adapted for this repo
import { Link, createSearchParams } from 'react-router-dom';

<Link
  to={{
    pathname: '/drilldown',
    search: createSearchParams({
      scope: 'department',
      entity_id: departmentId,
      issue_kind: 'basis_incomplete',
      range_key: filters.rangeKey,
      as_of_date: filters.asOfDate,
    }).toString(),
  }}
>
  查看问题明细
</Link>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Local component state controls all navigation | URL-backed routing/search params | Modern React Router data model | Deep links, refresh safety, and browser navigation become first-class. |
| Client-rendered “simple table” without structure | Headless table libraries with server-driven pagination | Common by TanStack Table v8 era | Better control over large datasets without UI framework lock-in. |
| Browser-side CSV assembly | Server-generated CSV with attachment headers | Long-standing best practice, reinforced by export correctness needs | Keeps export logic aligned with backend filters and quoting rules. |
| Role checks implied by UI entry points | Explicit deny-by-default authorization on every request | OWASP authorization guidance | Prevents broken access control from direct endpoint access. |

**Deprecated/outdated:**
- Frontend-only RBAC assumptions: insufficient for manager-only data.
- Separate “display query” and “export query”: too error-prone for regulated quality review workflows.

## Open Questions

1. **What exact role/identity payload will the host system provide to this app?**
   - What we know: PRD distinguishes doctors from management users, and Phase 5 requires clear permission boundaries.
   - What's unclear: exact transport mechanism (header, cookie, reverse-proxy injection, signed token) is not defined in repo artifacts.
   - Recommendation: lock this before planning 05-03; authorization tasks depend on it.

2. **What is the v1 export size limit and acceptable latency?**
   - What we know: users need downloadable problem cases for manual review.
   - What's unclear: whether export is expected to support full-period dumps or only scoped current filter results with a practical cap.
   - Recommendation: set a row cap and response-time target during planning to avoid accidental long-running exports.

3. **What exact columns must appear in drilldown and export?**
   - What we know: problem case review needs department/doctor/disease scope plus case-level quality findings.
   - What's unclear: whether reviewers need patient identifiers, encounter snapshot excerpts, rationale text, or only operational IDs.
   - Recommendation: define a canonical review dataset once and reuse it for both table columns and CSV headers.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | frontend build/tests, repo-local PG bridge | ✓ | `v24.14.0` | — |
| npm | frontend dependency install/tests | ✓ | `11.9.0` | — |
| Python 3 | backend handlers/export implementation | ✓ | `3.12.3` | — |
| PostgreSQL CLI (`psql`) | manual query verification | ✓ | `16.13` | use repo-local `node scripts/query-pg.mjs` |
| `pytest` | backend unit test framework | ✗ | — | add `pytest`, or use temporary Python smoke scripts |
| `DATABASE_URL` env | live analytics/export queries | ✗ | — | executor injection/manual fixtures only |

**Missing dependencies with no fallback:**
- None for planning itself. Live backend verification will need a real `DATABASE_URL`.

**Missing dependencies with fallback:**
- `pytest` missing; frontend can still be validated with Vitest and backend can use smoke scripts until Wave 0 installs it.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `Vitest 2.1.3` for frontend; backend currently has ad hoc Python smoke scripts, not a formal test runner |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `npm --prefix frontend test` |
| Full suite command | `npm --prefix frontend test` plus targeted Python smoke scripts such as `python3 src/domain/analytics/reuse_smoke.py` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPER-01 | 首页入口可下钻到科室/医生/病种问题明细，并保留筛选条件 | component + route integration | `npm --prefix frontend test -- src/app/__tests__/drilldown-page.test.tsx` | ❌ Wave 0 |
| OPER-02 | 明细页可下载与当前筛选一致的问题病例 CSV | backend handler/unit + frontend trigger | `python3 -m pytest tests/test_dashboard_export.py -q` | ❌ Wave 0 |
| OPER-03 | 医生端与管理端访问边界明确，未授权请求返回 forbidden | backend auth unit + manual smoke | `python3 -m pytest tests/test_authz.py -q` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm --prefix frontend test`
- **Per wave merge:** `npm --prefix frontend test` plus backend smoke/auth/export checks
- **Phase gate:** role matrix checks + export parity checks + critical management/doctor journeys green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/app/__tests__/drilldown-page.test.tsx` — covers route parsing, empty state, and filter carryover for `OPER-01`
- [ ] `frontend/src/components/__tests__/issue-case-table.test.tsx` — covers table pagination/sort state for `OPER-01`
- [ ] `tests/test_dashboard_export.py` — covers CSV headers, filter parity, and attachment response for `OPER-02`
- [ ] `tests/test_authz.py` — covers allow/deny matrix for `OPER-03`
- [ ] Framework install: `python3 -m pip install pytest` — backend test runner missing

## Sources

### Primary (HIGH confidence)
- `npm view react-router-dom version time --json` (queried 2026-03-25) - current package version and publish date
- `npm view @tanstack/react-table version time --json` (queried 2026-03-25) - current package version and publish date
- `https://reactrouter.com/en/en/v6/start/concepts` - `BrowserRouter`, nested routes, `useSearchParams` concepts
- `https://tanstack.com/table/latest/docs/guide/pagination` - manual/server pagination pattern
- `https://tanstack.com/table/latest/docs/guide/column-defs` - headless column definition pattern
- `https://docs.python.org/3/library/csv.html` - CSV writer/DictWriter behavior and newline guidance
- `https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition` - download attachment header behavior
- `https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html` - least privilege, deny by default, validate every request

### Secondary (MEDIUM confidence)
- Repo sources under `frontend/src/lib/*.ts`, `src/api/http_dashboard_*.py`, and `src/domain/analytics/query_service.py` - existing filter/query/handler seams this phase should extend
- `门诊诊鉴首页-(全栈).md` - product scenarios for management drilldown/export

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions were verified live and the chosen libraries solve the exact missing concerns in the current stack.
- Architecture: MEDIUM - strongly grounded in current repo seams, but exact auth transport from the host system is still unknown.
- Pitfalls: HIGH - backed by OWASP guidance plus clear mismatch risks visible in the current architecture.

**Research date:** 2026-03-25
**Valid until:** 2026-04-24
