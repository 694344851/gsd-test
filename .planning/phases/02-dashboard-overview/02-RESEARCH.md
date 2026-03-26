# Phase 2: Dashboard Overview - Research

**Researched:** 2026-03-25
**Domain:** Dashboard overview frontend over the Phase 1 SQL/Python analytics layer
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### 时间筛选体验
- **D-01:** 首页顶部采用“快捷时间范围选择 + 自定义时间入口”的组合方案，而不是自由输入优先。
- **D-02:** 快捷时间范围直接覆盖 PRD 中的常用范围：近三个月、近半年、近一年、过去30天、过去7天、上周、上个月、上个季度、上一年、自定义时间。
- **D-03:** 顶部需要始终展示当前起止日期与默认截止规则，文案明确到具体日期，而不是只显示相对时间名称。
- **D-04:** 默认加载仍严格继承 Phase 1：以“昨日”为截止口径，默认选中“近三个月”，展示 13 个按周聚合的时间单元。

### 概览卡片内容
- **D-05:** 首页概览卡固定展示 5 张卡，顺序为：门诊量、评估病例数、诊断依据不完整比例、缺失诊断比例、整体诊断质量指数。
- **D-06:** 每张卡采用“主值 + 较上期变化”结构，不增加额外说明文案作为主视觉层级，保持首页扫描效率。
- **D-07:** “门诊量”默认显示按就诊记录统计的口径，“评估病例数”默认显示成功评估病例数；不在首页卡片直接暴露备用统计口径。
- **D-08:** 整体诊断质量指数在业务公式未确认前，卡片位置保留，但默认展示占位状态，不展示伪造数值，也不展示环比。

### 数值与环比规则
- **D-09:** 数值展示规则严格按 PRD：比例默认百分比，保留两位小数并去除无意义尾零；整体诊断质量指数保留两位小数；数量指标按整数显示。
- **D-10:** 环比视觉规则严格沿用 PRD。
- **D-11:** 上期值为 0、上期值缺失、或当前不具备可比性的情况统一显示 `N/A`。
- **D-12:** 较上期完全无变化时统一显示 `较上期 --`。

### 趋势图表现与交互
- **D-13:** 趋势图采用 PRD 指定的双轴组合图。
- **D-14:** 门诊量与评估病例数采用“灰色总门诊量 + 蓝色评估病例数”的重叠/遮罩柱表现。
- **D-15:** 趋势图默认同时展示两条比例折线。
- **D-16:** Tooltip 必须同时展示时间标签和 4 个核心指标，并保持白底浅灰边框风格。
- **D-17:** 时间粒度切换完全继承 Phase 1 的 SQL 语义层，不允许前端自行推导时间桶或改写统计口径。

### 空态与异常态
- **D-18:** 所选时间范围无数据时展示明确空态，不用 `0` 冒充真实统计结果。
- **D-19:** 存在部分数据缺失时按单指标缺失处理，不让整个模块失败。
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-02 | 用户可以切换 PRD 定义的时间维度并看到正确的起止时间 | 快捷范围+自定义控件、明确起止日期展示、粒度切换规则 |
| DASH-03 | 首页概览卡正确展示本期值、环比变化和 N/A 规则 | 卡片格式化、变化符号、占位与异常态规则 |
| DASH-04 | 首页概览卡至少展示 5 个核心指标 | 五卡布局、质量指数占位策略 |
| TREN-01 | 用户可以查看趋势图，按时间维度切换横坐标粒度 | 双轴组合图与按粒度切换的 chart option |
| TREN-02 | 趋势图可以同时展示数量与比例指标 | 柱+线混合、双轴、统一 tooltip |
| TREN-03 | 用户悬停趋势图任意点位时可以查看时间和指标值 | axis-trigger tooltip / crosshair / tooltip 格式化 |
</phase_requirements>

## Summary

Phase 2 不是“把 SQL 查出来然后随便画一下”。真正的风险点在于：当前仓库已经有 Phase 1 的 SQL 语义层和 Python 查询层，但还没有任何前端壳、页面路由、状态管理或图表组件。因此 Phase 2 的计划必须同时覆盖“最小可用前端壳”与“首页三个核心模块”的交付，不然 planner 只会产出图表和卡片任务，却没有承载它们的 UI runtime。

最稳妥的路线是建立一个轻量但可扩展的 Web dashboard shell，然后让页面完全消费 Phase 1 已验证通过的 Python/SQL 语义层，不在前端重算时间窗口、环比或比例。图表层需要原生支持双 y 轴、柱线混合、axis-trigger tooltip 和时间轴标签切换；从官方文档看，Apache ECharts 原生支持多 y 轴、bar + line 组合和 axis tooltip/cross pointer，适配当前 PRD 要求更直接。React 官方文档强调组件化和状态驱动 UI，适合将“时间筛选、卡片、趋势图”拆成稳定组件；Vite 官方文档则给出现代前端默认脚手架和快速开发/生产构建路径，适合在当前绿地仓库里建立最小前端应用壳。

**Primary recommendation:** Phase 2 plans should include a minimal React + Vite dashboard shell and use ECharts for the mixed dual-axis trend chart, while consuming Phase 1 Python/SQL outputs as the single source of truth for all displayed metrics and date windows.

## Project Constraints (from AGENTS.md / PROJECT.md)

- 不能破坏现有门诊病历系统核心流程；Phase 2 聚焦管理端首页。
- 统计口径必须一致，因此前端不能推导业务语义。
- 当前 repo 仍接近绿地项目，已有可复用资产主要是 SQL 语义层和 Python 查询层。
- 管理端是 Web 仪表盘优先，不做移动端原生 App。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | current docs | Component-based dashboard UI | Official docs emphasize components, state, conditional rendering, and event handling for interactive UIs |
| Vite | current docs | Frontend dev/build tool | Official docs position Vite as the default fast dev server + production bundler with React templates |
| Apache ECharts | current docs | Mixed bar/line dual-axis charting | Official docs explicitly support multiple y-axes, bar/line series, axis-trigger tooltip, and cross pointer |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| Plain CSS variables / module CSS | Tokenized dashboard styling without overcommitting to a design system | Good fit for early-phase dashboard work in a greenfield repo |
| Python query layer (`src/domain/analytics/query_service.py`) | Stable data access boundary | Reuse instead of duplicating metric math in the UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ECharts | Hand-rolled SVG/canvas or a lighter chart lib | Less direct support for the required dual-axis mixed chart and richer tooltip behavior |
| React + Vite | Pure server-rendered HTML | Faster to start, but weaker for interactive time switching and evolving dashboard modules |
| Frontend-side transforms | Recompute windows/ratios in UI | Violates Phase 1 semantic-layer constraint and risks metric drift |

## Architecture Patterns

### Recommended Project Structure
```text
frontend/
├── index.html
├── src/
│   ├── app/
│   │   └── dashboard-overview-page.tsx
│   ├── components/
│   │   ├── time-range-toolbar.tsx
│   │   ├── overview-card-grid.tsx
│   │   └── diagnosis-trend-chart.tsx
│   ├── lib/
│   │   ├── formatters.ts
│   │   └── chart-options.ts
│   └── styles/
│       └── dashboard.css
```

### Pattern 1: Semantic-Layer-First View Model
Build page view models from Phase 1 query outputs only. The UI layer formats values and labels, but does not derive alternative date windows, denominator rules, or fallback metrics.

### Pattern 2: Toolbar State Drives All Modules
Use a single top-level time-range state that feeds both overview cards and trend chart, so dashboard modules never drift out of sync.

### Pattern 3: Chart Config as Pure Projection
Keep ECharts options in a dedicated helper that projects semantic-layer rows into chart series/axes config, instead of mixing option generation into page components.

### Pattern 4: Empty/Partial/Error States Per Module
Cards and chart should support module-level empty or partial states so one missing metric doesn’t collapse the whole page.

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dual-axis mixed chart | Custom SVG math | ECharts multi-axis bar/line series | Already supports the needed chart grammar |
| Page-wide date sync | Independent local states in each widget | Shared toolbar state | Prevents card/chart drift |
| Metric formatting | Inline string concatenation across components | Shared formatter helpers | Keeps PRD rules consistent |
| Tooltip aggregation | Manual DOM overlay logic | Chart library tooltip + formatter | Less fragile and easier to test |

## Common Pitfalls

### Pitfall 1: Frontend Recomputes “较上期”
If the page calculates deltas independently of the backend time window semantics, card numbers and trend points will drift.

### Pitfall 2: Quality Index Placeholder Leaks as Real Metric
Phase 1 locked the quality index as internal placeholder only. Phase 2 must keep the card slot without implying a formal computed score.

### Pitfall 3: Trend Chart Simplifies Away One Metric
The PRD expects quantity + ratio together. Planning a single-line or single-axis chart would fail the phase even if the chart “works”.

### Pitfall 4: Missing Frontend Shell in a Greenfield Repo
Without explicitly planning the app shell, router/root page, and chart container runtime, task execution will stall on missing scaffolding.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none yet — Wave 0 or first UI plan establishes frontend test/runtime toolchain |
| Config file | none yet |
| Quick run command | unavailable until frontend shell exists |
| Full suite command | unavailable until frontend shell exists |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-02 | 时间范围切换 + 起止日期显示 | component/integration | `frontend test for toolbar range switching` | ❌ Wave 0 |
| DASH-03 | 卡片环比 / N/A 规则 | component | `frontend test for card formatting` | ❌ Wave 0 |
| DASH-04 | 五张概览卡都展示 | component/snapshot | `frontend test for five-card render` | ❌ Wave 0 |
| TREN-01 | 时间粒度切换驱动横轴 | component/integration | `frontend test for chart grain switching` | ❌ Wave 0 |
| TREN-02 | 双轴组合图展示 4 指标 | component/integration | `frontend test for series wiring` | ❌ Wave 0 |
| TREN-03 | tooltip 展示时间和指标值 | interaction | `frontend test for tooltip formatter` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] Frontend app shell / package manager decision
- [ ] Test runner decision for dashboard UI
- [ ] Shared formatter helpers for numbers, deltas, and `N/A`
- [ ] Chart option builder with verifiable series/axis contract

## Sources

### Primary
- `.planning/phases/02-dashboard-overview/02-CONTEXT.md` — locked Phase 2 implementation decisions
- `.planning/phases/01-data-foundation/01-CONTEXT.md` — inherited metric, filter, and time-window semantics
- `.planning/phases/01-data-foundation/01-VERIFICATION.md` — verified Phase 1 outputs that Phase 2 must consume
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria
- `.planning/REQUIREMENTS.md` — `DASH-02` through `TREN-03` requirement mapping
- `门诊诊鉴首页-(全栈).md` §3.1.1 F1/F2/F3 — PRD behavior for time filter, cards, and trend chart
- React Quick Start: https://react.dev/learn — official component/state model for interactive UI
- Vite Getting Started: https://vite.dev/guide/ — official dev/build workflow and React template path
- Apache ECharts Axis Handbook: https://echarts.apache.org/handbook/en/concepts/axis/ — official multi-axis and axis tooltip support
- Apache ECharts Basic Bar: https://echarts.apache.org/handbook/en/how-to/chart-types/bar/basic-bar/ — official bar series usage
- Apache ECharts Basic Line: https://echarts.apache.org/handbook/en/how-to/chart-types/line/basic-line/ — official line series usage

## Metadata

**Confidence breakdown:**
- Frontend shell recommendation: MEDIUM — current repo has no UI stack yet, so shell choice is still greenfield
- Charting recommendation: HIGH — ECharts docs directly match dual-axis mixed chart needs
- Semantic-layer integration: HIGH — Phase 1 verification already proved the backend outputs exist and are stable

**Research date:** 2026-03-25
**Valid until:** 2026-04-24
