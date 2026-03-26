# Phase 3: Quality Distribution Insights - Research

**Researched:** 2026-03-25
**Domain:** Department quality distribution and high-frequency problem disease insights on top of the existing analytics dashboard stack
**Confidence:** MEDIUM

<user_constraints>
## User Constraints

### Locked Decisions
- Follow the existing frontend/dashboard patterns from Phase 2 instead of introducing a new stack.
- Phase 3 scope is limited to the management dashboard modules for department quality distribution and high-frequency problem disease insights.
- Phase 3 must satisfy `DIST-01`, `DIST-02`, `DIST-03`, `DISE-01`, and `DISE-02`.
- Time-range semantics, default cutoff, and filter wiring must continue to inherit the Phase 1 SQL semantic layer and the Phase 2 shared toolbar state.

### Claude's Discretion
- Exact response shape for new distribution and disease-insight APIs, as long as they preserve the existing `filters + payload rows` pattern.
- Exact component/file split for the new dashboard modules, as long as they plug into the existing dashboard page and shared styling tokens.
- Exact bubble-size scaling formula and word-cloud font sizing, as long as the mapping is deterministic, readable, and faithful to PRD semantics.

### Deferred Ideas (OUT OF SCOPE)
- Drilldown/export flows and role-permission handling belong to Phase 5.
- Doctor-side realtime evaluation belongs to Phase 4.
- Formal quality-index formula remains out of scope until business rules are confirmed.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIST-01 | 用户可以查看按科室分布的气泡图，X 轴为门诊量，Y 轴为诊断依据不完整比例 | Recommend SQL distribution aggregate + ECharts scatter/bubble projection with backend-driven metrics |
| DIST-02 | 气泡图可以用气泡大小表示评估病例数，用颜色表示诊断缺漏比例 | Recommend `symbolSize` projection from evaluated count and `visualMap` color mapping from missing-diagnosis rate |
| DIST-03 | 用户可以按科室类型筛选分布图，并在悬停时查看科室详细数据 | Reuse shared toolbar filter state, add backend-fed department-type options, and lock tooltip contract |
| DISE-01 | 用户可以查看高发问题病种词云，默认展示问题数量靠前的病种 | Recommend dedicated disease aggregate ranked by problem count with default top 20 |
| DISE-02 | 词云颜色和布局可以体现病种问题严重程度，并遵循 PRD 中的排序逻辑 | Recommend `echarts-wordcloud` with backend-provided severity tier and deterministic top-N ordering |
</phase_requirements>

## Summary

Phase 3 should be implemented as two more dashboard modules on top of the Phase 2 shell, not as a new application slice. The existing page already has the correct top-level filter state, HTTP bridge style, module state handling, styling tokens, and Vitest-based component tests. The missing work is in the semantic layer: there are no SQL functions, Python query methods, or API wrappers yet for department distribution or disease insights, even though the Phase 1 data model already contains `department`, `department_type`, and `disease` dimensions and the filter contract already carries `departmentTypeIds` and `diseaseIds`.

The strongest implementation path is to keep Phase 3 backend-first and projection-only in the UI. Add one SQL semantic query for department distribution and one for disease insights, expose them through thin Python/API wrappers matching the existing overview/trend pattern, and render them with ECharts. The bubble chart fits native ECharts scatter + `visualMap` well. The word cloud should use the `echarts-wordcloud` extension rather than hand-rolled absolute positioning or custom canvas math. The main ambiguity is business semantics for disease ranking and severity when one case has both problem flags; that needs to be locked explicitly before implementation or at least surfaced as an assumption.

**Primary recommendation:** Keep the Phase 2 stack and page structure unchanged, add backend semantic queries for distribution and disease ranking, render department bubbles with ECharts scatter/visualMap, and render the disease cloud with `echarts-wordcloud` while locking the disease ranking formula up front.

## Project Constraints (from CLAUDE.md)

- Start file-changing work through the GSD workflow; Phase research is already in that workflow.
- Do not recommend approaches that break the existing outpatient EMR core workflow.
- Keep statistical definitions consistent; frontend code must not redefine metric semantics.
- PostgreSQL compatibility remains required for the analytics layer.
- Clinical safety positioning remains assistive, not autonomous diagnosis.
- v1 scope prioritizes the management dashboard and realtime core path; advanced governance stays deferred.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 (repo-pinned) | Existing dashboard component/runtime layer | Already in production path for Phase 2 modules; avoids needless upgrade churn in Phase 3 |
| Vite | 5.4.10 (repo-pinned) | Existing frontend build/dev server | Already configured with React plugin and API proxy in `frontend/vite.config.ts` |
| Vitest | 2.1.3 (repo-pinned) | Existing frontend test runner | Existing dashboard tests already pass on this stack |
| ECharts | 5.6.0 (repo-pinned) | Bubble chart and shared chart primitives | Already used for Phase 2 trend chart and supports scatter/visualMap |
| echarts-for-react | 3.0.2 (repo-pinned) | Existing React wrapper for ECharts | Already established in the current dashboard chart rendering path |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `echarts-wordcloud` | 2.1.0 (recommended add) | Word-cloud series extension for ECharts | Required if Phase 3 must deliver an actual PRD-style word cloud instead of a fallback ranked tag list |
| Shared CSS token file | existing | Consistent dashboard surfaces, spacing, and colors | Extend the Phase 2 token contract rather than introducing a design system |
| Python analytics query layer | existing | Stable application boundary over SQL semantic functions | Add new methods instead of querying SQL directly from HTTP handlers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `echarts-wordcloud` | Custom positioned HTML/CSS words | Faster to start, but collision, readability, and responsive behavior become hand-rolled problems |
| ECharts scatter | Hand-built SVG bubble chart | Harder to maintain tooltip, color scale, and responsive sizing semantics |
| Repo-pinned React/Vite/Vitest/ECharts versions | Upgrade to current registry latest versions in Phase 3 | Adds avoidable migration risk unrelated to `DIST-*` and `DISE-*` requirements |

**Installation:**
```bash
npm --prefix frontend install echarts-wordcloud
```

**Version verification:** Registry checks on 2026-03-25 showed current latest versions `react@19.2.4` (published 2026-01-26), `vite@8.0.2` (2026-03-23), `vitest@4.1.1` (2026-03-23), `echarts@6.0.0` (2025-07-30), `echarts-for-react@3.0.6` (2026-01-21), and `echarts-wordcloud@2.1.0` (2022-11-24). Phase 3 should stay on the repo-pinned Phase 2 stack and only add `echarts-wordcloud`, whose peer dependency is `echarts ^5.0.1`.

## Architecture Patterns

### Recommended Project Structure
```text
sql/
├── migrations/
│   └── 003_phase3_distribution_insights.sql   # New semantic functions for departments and diseases
└── tests/
    ├── dist_01_department_distribution.sql    # SQL assertion file
    └── dise_01_problem_diseases.sql           # SQL assertion file

src/
├── api/
│   ├── analytics/
│   │   ├── distribution.py                    # Thin response builder
│   │   └── disease_insights.py                # Thin response builder
│   ├── http_dashboard_distribution.py         # HTTP filter parsing parity with Phase 2
│   └── http_dashboard_diseases.py
└── domain/
    └── analytics/
        ├── contracts.py                       # Add DepartmentDistributionRow / DiseaseInsightRow
        └── query_service.py                   # Add get_department_distribution / get_problem_disease_cloud

frontend/src/
├── app/
│   └── dashboard-overview-page.tsx            # Extend existing page with Phase 3 sections
├── components/
│   ├── department-distribution-section.tsx
│   ├── department-type-filter.tsx
│   ├── department-distribution-chart.tsx
│   ├── problem-disease-section.tsx
│   └── problem-disease-cloud.tsx
├── lib/
│   ├── distribution-api.ts
│   ├── disease-insights-api.ts
│   ├── distribution-chart-options.ts
│   ├── disease-cloud-options.ts
│   ├── distribution-contracts.ts
│   └── disease-insights-contracts.ts
└── components/__tests__/
    ├── department-distribution-section.test.tsx
    └── problem-disease-section.test.tsx
```

### Pattern 1: Semantic-Layer-First Aggregates
**What:** Put department and disease aggregation logic in SQL semantic functions, then surface typed Python rows and thin API wrappers.
**When to use:** Always for metrics, rankings, filter options, and time-window semantics.
**Example:**
```python
# Source: existing pattern in src/api/analytics/overview.py and src/api/analytics/trend.py
def build_distribution_response(filters: AnalyticsFilters, *, executor=None, connection_string=None) -> dict[str, Any]:
    rows = [
        row.__dict__
        for row in get_department_distribution(
            filters,
            executor=executor,
            connection_string=connection_string,
        )
    ]
    return {
        "filters": serialize_filters(filters),
        "rows": rows,
        "department_types": get_department_type_options(...),
    }
```

### Pattern 2: Shared Filter State, Module-Scoped Data Fetching
**What:** Reuse `DashboardOverviewPage` as the single owner of `DashboardFilters`; each Phase 3 section fetches its own payload based on those filters.
**When to use:** For department type changes, time-range changes, and future homepage module growth.
**Example:**
```tsx
// Source: existing pattern in frontend/src/components/overview-section.tsx and trend-section.tsx
useEffect(() => {
  let active = true;
  setStatus('loading');
  void loadDepartmentDistribution(filters)
    .then((response) => {
      if (!active) return;
      setRows(response.rows);
      setStatus('success');
    })
    .catch(() => {
      if (!active) return;
      setStatus('error');
    });
  return () => {
    active = false;
  };
}, [filters]);
```

### Pattern 3: Chart Option Builders as Pure Projections
**What:** Convert backend rows into ECharts options inside dedicated helpers, the same way Phase 2 keeps trend configuration in `chart-options.ts`.
**When to use:** For bubble coordinates, tooltip rows, `visualMap`, symbol-size scaling, and word-cloud color tiers.
**Example:**
```ts
// Source: ECharts scatter/visualMap pattern + existing frontend/src/lib/chart-options.ts discipline
export function buildDepartmentDistributionOption(rows: DepartmentDistributionRow[]): EChartsOption {
  return {
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: '门诊量' },
    yAxis: { type: 'value', name: '诊断依据不完整比例', axisLabel: { formatter: '{value}%' } },
    visualMap: {
      dimension: 4,
      min: 0,
      max: 100,
      calculable: false,
      inRange: { color: ['#DDEBFF', '#2F6BFF', '#163B91'] },
    },
    series: [{
      type: 'scatter',
      data: rows.map((row) => [
        row.outpatient_count,
        row.diagnosis_basis_incomplete_rate_by_success * 100,
        row.success_evaluated_count,
        row.department_name,
        row.missing_diagnosis_rate_by_success * 100,
      ]),
      symbolSize: (value) => projectBubbleSize(value[2] as number),
    }],
  };
}
```

### Pattern 4: Backend-Sourced Option Lists
**What:** Source department-type labels from analytics dimension tables, not hard-coded frontend enums.
**When to use:** For Phase 3 filter chips/selectors and later drilldown reuse.

### Anti-Patterns to Avoid
- **Frontend ranking math:** Do not compute disease ranking or severity buckets in React from raw case rows.
- **Widget-local time windows:** Do not let Phase 3 sections invent their own date window or bucket logic.
- **One-off fetch/query helpers:** Do not bypass the `query_service.py` and thin API pattern already established in Phase 1 and Phase 2.
- **Hand-made word placement:** Do not implement cloud layout with ad hoc CSS transforms or random positioning.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bubble chart rendering | Custom SVG/canvas bubble math | ECharts scatter + tooltip + `visualMap` | Native support for x/y/value encoding, responsive axes, and color mapping |
| Bubble color legend | Manual threshold styles in JSX | ECharts `visualMap` | Keeps color scale testable and consistent with data dimension mapping |
| Word cloud placement | Random DOM word positioning | `echarts-wordcloud` | Layout collision and font packing are non-trivial |
| Filter option source | Hard-coded department-type labels | SQL-backed dimension lookup | Prevents UI drift from source data |
| Problem ranking | Browser-side sorts over expanded records | SQL aggregate with explicit rank fields | Avoids duplicated semantics and unstable ordering |

**Key insight:** Phase 3 looks visually frontend-heavy, but the real complexity is semantic aggregation and multi-encoding chart contracts. The frontend should mostly project typed backend rows.

## Common Pitfalls

### Pitfall 1: Disease Ranking Semantics Are Left Implicit
**What goes wrong:** The team ships a word cloud, but cannot explain whether a case with both flags counts once or twice.
**Why it happens:** PRD says “依据不完整 + 缺失诊断数量” and also says use a “综合问题比例”, which can be interpreted as summed counts, unioned cases, or summed rates.
**How to avoid:** Lock two explicit backend fields before implementation: `problem_count_for_rank` and `problem_severity_for_color`, with denominator documented.
**Warning signs:** SQL and frontend tests use different top-20 expectations for the same seed data.

### Pitfall 2: Bubble Size Becomes Unreadable
**What goes wrong:** A few large departments dominate the plot and smaller departments become invisible.
**Why it happens:** Raw evaluated counts are mapped directly to radius without clamping or square-root scaling.
**How to avoid:** Use a deterministic `symbolSize` projection with min/max clamps and test a low/mid/high count sample.
**Warning signs:** Multiple points render as near-zero dots or giant overlapping circles.

### Pitfall 3: Department-Type Filter Is Hard-Coded
**What goes wrong:** The UI exposes stale or incomplete type labels that do not match the database.
**Why it happens:** It is tempting to hard-code “产科门诊/妇科门诊/肿瘤科门诊” from the PRD screenshot.
**How to avoid:** Fetch filter options from `analytics.dim_department_type` and keep IDs plus display names in the API payload.
**Warning signs:** Filter options differ between environments or seed data changes break the UI.

### Pitfall 4: Color Semantics Drift Between Bubble Chart and Word Cloud
**What goes wrong:** One module uses darker color for higher missing rate, while the other uses darker color for higher total problem count without documenting the distinction.
**Why it happens:** Both modules encode severity, but their dimensions are different.
**How to avoid:** Name the encoded field explicitly in each payload and keep legends/copy aligned with that field.
**Warning signs:** Reviewers cannot tell what “deep blue” means in each module.

### Pitfall 5: SQL Verification Is Planned But Not Actually Runnable
**What goes wrong:** Planner assumes database-backed SQL assertions are available, but `DATABASE_URL` is missing in the environment.
**Why it happens:** `psql` exists locally, so it looks ready until test execution time.
**How to avoid:** Treat DB-backed SQL checks as blocked until `DATABASE_URL` is supplied; keep frontend contract tests as the fallback baseline.
**Warning signs:** `sql/tests/run-phase-01.sh` exits immediately with `DATABASE_URL must be set`.

## Code Examples

Verified patterns from the current codebase and official chart docs:

### Department Distribution API Query Builder
```ts
// Source: frontend/src/lib/trend-api.ts and overview-api.ts
function buildDistributionQuery(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set('range_key', filters.rangeKey);
  params.set('as_of_date', filters.asOfDate);
  if (filters.startDate) params.set('start_date', filters.startDate);
  if (filters.endDate) params.set('end_date', filters.endDate);
  filters.departmentTypeIds?.forEach((value) => params.append('department_type_ids', value));
  return params;
}
```

### Bubble Tooltip Contract
```ts
// Source: existing tooltip discipline in frontend/src/lib/chart-options.ts
function formatDepartmentTooltip(row: DepartmentDistributionRow): string {
  return [
    `<div style="display:grid;gap:8px;">`,
    `<div style="font-weight:600;">${row.department_name}</div>`,
    `<div>科室类型：${row.department_type_name}</div>`,
    `<div>门诊量：${row.outpatient_count}</div>`,
    `<div>评估病例数：${row.success_evaluated_count}</div>`,
    `<div>诊断依据不完整比例：${formatPercent(row.diagnosis_basis_incomplete_rate_by_success)}</div>`,
    `<div>缺失诊断比例：${formatPercent(row.missing_diagnosis_rate_by_success)}</div>`,
    `</div>`,
  ].join('');
}
```

### Disease Cloud Row Shape
```python
# Source: recommended extension of src/domain/analytics/contracts.py
@dataclass(slots=True)
class DiseaseInsightRow:
    disease_id: str
    disease_name: str
    outpatient_count: int
    success_evaluated_count: int
    diagnosis_basis_incomplete_count: int
    missing_diagnosis_count: int
    problem_count_for_rank: int
    problem_severity_for_color: float
    severity_tier: int
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Widget-specific local filters | Shared page-level filter state in the dashboard shell | Phase 2 completed on 2026-03-25 | Phase 3 modules should subscribe to existing page filters |
| Frontend-generated chart semantics | Pure option-builder projection from backend rows | Phase 2 completed on 2026-03-25 | Bubble chart and word cloud should keep the same discipline |
| Custom chart implementations for each dashboard need | ECharts as the shared dashboard charting engine | Phase 2 completed on 2026-03-25 | Phase 3 only needs one extension package instead of a new chart stack |

**Deprecated/outdated:**
- Recomputing business metrics in the browser: outdated for this repo because Phase 1 locked SQL semantics and Phase 2 reinforced projection-only UI behavior.
- Introducing a new charting library just for word clouds: unnecessary when `echarts-wordcloud` fits the existing ECharts integration path.

## Open Questions

1. **Should disease ranking double-count a case that has both problem flags?**
   - What we know: PRD says rank by “诊断依据不完整 + 缺失诊断数量” and color by “综合问题比例”.
   - What's unclear: Whether ranking uses summed counts, unioned affected cases, or another normalized score.
   - Recommendation: Lock this in a small Phase 3 assumption note before implementation and reflect it in SQL assertion fixtures.

2. **Should department-type filtering be single-select or multi-select?**
   - What we know: PRD only requires “支持科室类型筛选”.
   - What's unclear: Whether management users need comparison across multiple types in one chart.
   - Recommendation: Start with single-select plus “全部”, because it matches Phase 2’s simple toolbar philosophy and keeps tooltip interpretation clean.

3. **Should the disease cloud support only the current time range or an extra “Top N” control?**
   - What we know: PRD says default Top XX disease, default 20.
   - What's unclear: Whether Top N is configurable in v1 or strictly fixed.
   - Recommendation: Ship fixed Top 20 in Phase 3 and keep configurability deferred unless a requirement is added.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Vite dev/build, Vitest, repo-local DB bridge | ✓ | 24.14.0 | — |
| npm | Frontend dependency install and test scripts | ✓ | 11.9.0 | — |
| Python 3 | Backend analytics API layer | ✓ | 3.12.3 | — |
| `psql` | Database-backed SQL semantic verification | ✓ | 16.13 | Use existing Node/Python mock-path tests if DB connection is unavailable |
| `DATABASE_URL` env var | Running SQL verification scripts and live analytics queries | ✗ | — | No DB-backed fallback for semantic SQL assertions |

**Missing dependencies with no fallback:**
- Live `DATABASE_URL` for Phase 3 SQL verification and end-to-end analytics query execution.

**Missing dependencies with fallback:**
- None. Frontend contract tests are available, but they do not replace DB-backed semantic verification.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.3 + Testing Library |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `npm --prefix frontend test -- src/components/__tests__/overview-section.test.tsx src/components/__tests__/trend-section.test.tsx src/app/__tests__/dashboard-overview-page.test.tsx` |
| Full suite command | `npm --prefix frontend test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIST-01 | Bubble chart uses outpatient count on X and diagnosis-basis-incomplete rate on Y | unit + component | `npm --prefix frontend test -- src/lib/__tests__/distribution-chart-options.test.ts src/components/__tests__/department-distribution-section.test.tsx` | ❌ Wave 0 |
| DIST-02 | Bubble size maps to evaluated count and color maps to missing-diagnosis rate | unit | `npm --prefix frontend test -- src/lib/__tests__/distribution-chart-options.test.ts` | ❌ Wave 0 |
| DIST-03 | Department-type filter updates payload and tooltip shows department details | component + interaction | `npm --prefix frontend test -- src/components/__tests__/department-distribution-section.test.tsx` | ❌ Wave 0 |
| DISE-01 | Default top-20 problem diseases render in the cloud payload order | unit + component | `npm --prefix frontend test -- src/lib/__tests__/disease-cloud-options.test.ts src/components/__tests__/problem-disease-section.test.tsx` | ❌ Wave 0 |
| DISE-02 | Color tiers/layout reflect PRD severity ordering | unit + component | `npm --prefix frontend test -- src/lib/__tests__/disease-cloud-options.test.ts src/components/__tests__/problem-disease-section.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm --prefix frontend test -- src/components/__tests__/department-distribution-section.test.tsx src/components/__tests__/problem-disease-section.test.tsx`
- **Per wave merge:** `npm --prefix frontend test`
- **Phase gate:** Frontend suite green plus DB-backed SQL assertions green once `DATABASE_URL` is available

### Wave 0 Gaps
- [ ] `sql/tests/dist_01_department_distribution.sql` — locks department aggregate semantics for `DIST-01` to `DIST-03`
- [ ] `sql/tests/dise_01_problem_diseases.sql` — locks disease ranking and severity semantics for `DISE-01` and `DISE-02`
- [ ] Update `sql/tests/run-phase-01.sh` or add a Phase 3 runner so new SQL assertion files are invocable
- [ ] `frontend/src/lib/__tests__/distribution-chart-options.test.ts` — locks bubble coordinates, color dimension, and size projection
- [ ] `frontend/src/lib/__tests__/disease-cloud-options.test.ts` — locks cloud ordering, color tiers, and fallback formatting
- [ ] `frontend/src/components/__tests__/department-distribution-section.test.tsx` — covers loading, empty, error, filter, and tooltip states
- [ ] `frontend/src/components/__tests__/problem-disease-section.test.tsx` — covers loading, empty, error, and top-20 render semantics

## Sources

### Primary (HIGH confidence)
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, and plan split
- `.planning/REQUIREMENTS.md` — `DIST-01` to `DISE-02`
- `.planning/STATE.md` — inherited Phase 1/2 decisions and blockers
- `门诊诊鉴首页-(全栈).md` §3.1.1 F4/F5 — PRD semantics for bubble chart and disease cloud
- `.planning/phases/02-dashboard-overview/02-CONTEXT.md` — locked frontend/dashboard principles inherited from Phase 2
- `.planning/phases/02-dashboard-overview/02-RESEARCH.md` — Phase 2 stack recommendation that is now implemented
- `.planning/phases/02-dashboard-overview/02-UI-SPEC.md` — token, layout, and interaction contract to extend
- `.planning/phases/02-dashboard-overview/02-dashboard-overview-02-SUMMARY.md` — established overview module patterns
- `.planning/phases/02-dashboard-overview/02-dashboard-overview-03-SUMMARY.md` — established trend chart option-builder/test patterns
- `src/domain/analytics/query_service.py` — current query-service boundary and filter contract
- `src/api/analytics/overview.py` — thin wrapper pattern
- `src/api/analytics/trend.py` — thin wrapper pattern
- `frontend/src/app/dashboard-overview-page.tsx` — shared filter owner for the dashboard page
- `frontend/src/components/overview-section.tsx` — section loading/empty/error pattern
- `frontend/src/components/trend-section.tsx` — chart section loading/empty/error pattern
- `frontend/src/lib/chart-options.ts` — pure ECharts option-builder pattern
- `frontend/package.json` — repo-pinned frontend stack versions
- `frontend/vite.config.ts` and `frontend/vitest.config.ts` — current runtime/test configuration
- https://echarts.apache.org/handbook/en/how-to/chart-types/scatter/basic-scatter/ — scatter series guidance
- https://echarts.apache.org/handbook/en/concepts/visual-map/ — official `visualMap` guidance for color mapping
- https://vite.dev/guide/ — existing Vite stack reference
- https://vitest.dev/guide/ — existing Vitest stack reference

### Secondary (MEDIUM confidence)
- https://www.npmjs.com/package/echarts-wordcloud — package metadata and registry verification for the recommended extension
- https://www.npmjs.com/package/echarts — registry verification for current latest ECharts version
- https://www.npmjs.com/package/react — registry verification for current latest React version
- `npm view react version`, `npm view vite version`, `npm view vitest version`, `npm view echarts version`, `npm view echarts-for-react version`, `npm view echarts-wordcloud version` run on 2026-03-25
- `npm view echarts-wordcloud peerDependencies --json` and `npm view echarts-for-react peerDependencies --json` run on 2026-03-25

### Tertiary (LOW confidence)
- Inference: disease severity denominator should stay aligned with Phase 1 “successful evaluation” ratio semantics. This is plausible from the existing metric model, but PRD wording alone does not fully confirm it.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Phase 2 already implemented and verified the repo stack; only one small extension is recommended
- Architecture: HIGH — current code strongly constrains the correct extension pattern
- Pitfalls: MEDIUM — technical pitfalls are clear, but disease-ranking business semantics remain ambiguous

**Research date:** 2026-03-25
**Valid until:** 2026-04-24
