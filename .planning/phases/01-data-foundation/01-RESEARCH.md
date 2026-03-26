# Phase 1: Data Foundation - Research

**Researched:** 2026-03-25
**Domain:** Outpatient analytics data foundation on PostgreSQL
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### 数据接入边界
- **D-01:** 采用双事实模型：门诊就诊事实与诊鉴评估事实分开建模，通过 `encounter_id` / `case_id` 关联，既支持全量门诊统计，也支持评估行为分析。
- **D-02:** 评估状态至少区分三态：未触发、评估成功、评估失败/超时。后续统计既能看覆盖率，也能识别稳定性问题。
- **D-03:** 单次门诊允许保留多次评估记录；统计默认取最后一次成功评估结果作为病例级归档口径。
- **D-04:** Phase 1 数据接入范围包含门诊病历主数据、诊断结果、诊鉴评估结果，以及科室、科室类型、医生、病种等基础维表，形成基础星型模型。

### 指标口径
- **D-05:** 门诊量默认按门诊就诊记录数统计，同时在模型层保留患者去重口径，供后续扩展。
- **D-06:** 评估病例数拆分为“触发数”和“成功评估数”两套口径；首页默认展示成功评估病例数。
- **D-07:** 诊断依据不完整比例和缺失诊断比例两套分母都保留：全部门诊量与成功评估病例数；首页默认按成功评估病例数出数。
- **D-08:** 整体诊断质量指数在 Phase 1 先作为可配置占位指标入模，默认不对外展示正式值，待业务确认公式后启用。

### 默认时间范围与截止规则
- **D-09:** 首页默认时间范围固定为“近三个月”，严格按 PRD 解释：按昨日所在周回溯 12 周并包含本周，共 13 个周单元。
- **D-10:** 所有统计默认截止到“昨日”，但基础接口支持传入 `as_of_date` 以支持补数、回放和重算。
- **D-11:** 数据不足时按已有数据部分展示，不补未来时间桶，也不因为样本不足而隐藏时间范围。
- **D-12:** Phase 1 同步锁定聚合粒度规则：过去 7 天/上周按班次，过去 30 天/上月按天，近三个月/近半年/上季度按周，近一年/上一年按月。

### 基础查询接口
- **D-13:** 采用分层接口策略：底层建设通用聚合服务，对外先暴露少量面向场景的查询接口。
- **D-14:** Phase 1 最小查询能力包含概览汇总、趋势时间序列、已评估/未评估拆分，不提前纳入科室/病种分布查询。
- **D-15:** Phase 1 筛选维度先开放时间范围、科室、科室类型、医生、病种，但不实现复杂联动和权限细化。
- **D-16:** 返回结果采用分层语义：领域查询结果保持稳定语义，接口响应再包装成概览/趋势等场景结构，避免被前端页面形态绑定。

### Claude's Discretion
- 指标与维度在数据库中的具体命名规范、表拆分方式和索引策略。
- `as_of_date` 的具体参数格式、默认值注入位置和错误处理方式。
- 通用聚合服务与场景接口的模块边界、DTO 命名和实现组织方式。

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | 系统可以接入门诊病历、诊断结果和评估结果数据，并形成统一分析数据模型 | 双事实星型模型、字段映射边界、基础维表、病例级归档规则 |
| DATA-02 | 系统可以按日、周、月等统计口径聚合门诊量、评估病例数、诊断依据不完整比例和缺失诊断比例 | `as_of_date` 驱动的时间桶规则、SQL 聚合层、分子分母双口径保留 |
| DATA-03 | 系统可以区分已评估与未评估病例，并支撑后续图表和下钻查询 | 评估状态三态、最后一次成功评估归档视图、已评估/未评估拆分查询 |
| DASH-01 | 用户可以在首页查看默认时间范围及其起止日期，默认口径符合 PRD 约定 | “昨日截止 + 13 个周单元”的默认窗口算法与稳定接口 contract |
</phase_requirements>

## Summary

Phase 1 应该按数据库优先的方式规划。当前仓库没有既有应用栈，也没有任何可复用的服务层或测试框架；真正稳定的约束来自 PRD、`01-CONTEXT.md` 和现有 PostgreSQL 前提。因此，规划时不应先锁死 ORM 或页面接口形态，而应先把统一粒度、事实表边界、默认时间口径和可复用聚合 contract 设计对。

最稳妥的方案是用 PostgreSQL 作为事实来源、时间口径执行层和首版聚合层：门诊就诊事实与评估事实分别建模，用统一维表对齐科室、医生、病种等筛选口径；通过视图或物化视图生成病例级“最后一次成功评估”归档结果；所有首页统计都从同一套 `as_of_date`、时间桶和分母规则推导，避免后续 Phase 2/3/5 出现同指标不同结果。

**Primary recommendation:** Use a PostgreSQL-first dimensional model with two fact tables, conformed dimensions, and `as_of_date`-driven SQL aggregation; do not compute Phase 1 metrics in frontend or ad hoc application code.

## Project Constraints (from CLAUDE.md)

- 必须集成现有门诊病历系统，不能破坏原系统核心诊疗流程。
- 实时诊鉴结果目标约 10 秒返回，后续设计不能阻塞该主链路。
- 统计指标和环比口径必须一致，管理端会据此做决策。
- 现有基础环境给出 PostgreSQL，后端设计需兼容该数据源或给出迁移方案。
- 产品只能做辅助评估与提示，不能表达为自动诊断结论。
- v1 优先完成首页和实时诊鉴主链路，复杂治理能力延后。
- 在修改代码或文档前，优先通过 GSD 工作流进入；当前任务已处于 phase research 流程内。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | 14.22+ compatible SQL | Source-of-truth schema, time bucketing, metric aggregation | Existing project constraint is PostgreSQL; official docs cover `date_trunc`, `date_bin`, `AT TIME ZONE`, partial indexes, and materialized views needed for this phase |
| PostgreSQL views | built-in | Stable semantic layer over raw source tables | Lets planners separate raw ingestion from case-level and dashboard-level semantics without binding to app DTOs |
| PostgreSQL materialized views | built-in | Cached summary sets for repeated dashboard queries | Officially supported for persisted summaries with refresh semantics; useful when “截止昨日” permits scheduled refresh |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `generate_series` | built-in | Generate full bucket calendars for day/week/month windows | Use when the API must return existing buckets consistently without inventing future buckets |
| Partial indexes | built-in | Keep “successful evaluation” and “active filter” queries fast | Use on hot subsets such as successful evaluations or latest-per-encounter lookup paths |
| SQL migration files | repo-native | Deterministic schema evolution and review | Use from the first implementation commit because there is no existing scaffold to inherit |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostgreSQL-side aggregation | App-side aggregation in Node/Python | Easier to prototype, but guarantees denominator drift and duplicate time-range logic across phases |
| Materialized summary layer | Only raw-table queries | Simpler at first, but repeated weekly/monthly aggregations will become the bottleneck for dashboard reuse |
| Conformed star schema | One denormalized “big table” | Faster initial load, but mixes encounter grain and evaluation grain and makes DATA-03 error-prone |

**Installation:**
```bash
# No package install is required to plan the data model.
# Phase 1 should start with SQL migrations and PostgreSQL connectivity checks.
```

**Version verification:** Official PostgreSQL docs show supported releases on 2026-02-26, including 14.22, 15.17, 16.13, 17.9, and 18.3. Because the actual hospital DB version is not yet validated, planning should target PostgreSQL 14.22+ compatible SQL and avoid newer-only features. Confidence: HIGH for PostgreSQL capability, MEDIUM for actual deployment version.

## Architecture Patterns

### Recommended Project Structure
```text
sql/
├── migrations/          # DDL, seed dimensions, indexes
├── staging/             # Source-normalization views over raw tables
├── marts/
│   ├── facts/           # encounter / evaluation facts
│   ├── dimensions/      # dept / dept_type / doctor / disease / date
│   └── aggregates/      # latest-success case view, overview/trend summaries
└── tests/               # SQL fixtures and assertion queries
src/
├── domain/analytics/    # query contracts, filter parsing, DTO mapping
└── api/                 # overview/trend/evaluated-split endpoints
```

### Pattern 1: Dual-Fact Star Schema
**What:** Keep outpatient encounter records and evaluation events in separate fact tables, joined through `encounter_id` or `case_id`, and attach shared dimensions for department, doctor, disease, and date.
**When to use:** Always. This is already locked by D-01 and avoids mixing “one visit” and “many evaluations” into the same grain.
**Example:**
```sql
-- Source: https://learn.microsoft.com/en-us/power-bi/guidance/star-schema
create table fact_outpatient_encounter (
  encounter_id text primary key,
  patient_id text not null,
  encounter_ts timestamptz not null,
  dept_id text not null,
  doctor_id text not null,
  disease_id text,
  diagnosis_present boolean not null,
  diagnosis_basis_incomplete boolean not null default false
);

create table fact_evaluation_event (
  evaluation_id text primary key,
  encounter_id text not null references fact_outpatient_encounter(encounter_id),
  triggered_at timestamptz not null,
  status text not null check (status in ('not_triggered', 'success', 'failed', 'timeout')),
  missing_diagnosis boolean,
  diagnosis_basis_incomplete boolean,
  payload jsonb
);
```

### Pattern 2: Case-Level Semantic View
**What:** Publish a stable view that resolves multiple evaluation rows into one case-level row using the last successful evaluation; expose both trigger count and success count from the same semantic layer.
**When to use:** For all Phase 1 metrics and every later dashboard query.
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/14/rules-materializedviews.html
create view mart_case_evaluation as
with ranked_success as (
  select
    e.*,
    row_number() over (
      partition by e.encounter_id
      order by e.triggered_at desc, e.evaluation_id desc
    ) as rn
  from fact_evaluation_event e
  where e.status = 'success'
)
select
  o.encounter_id,
  exists (
    select 1
    from fact_evaluation_event ev
    where ev.encounter_id = o.encounter_id
      and ev.status in ('success', 'failed', 'timeout')
  ) as was_triggered,
  rs.evaluation_id as latest_success_evaluation_id,
  (rs.evaluation_id is not null) as was_successfully_evaluated,
  rs.diagnosis_basis_incomplete,
  rs.missing_diagnosis
from fact_outpatient_encounter o
left join ranked_success rs
  on rs.encounter_id = o.encounter_id
 and rs.rn = 1;
```

### Pattern 3: `as_of_date`-Driven Time Window Builder
**What:** Compute every default range from an explicit `as_of_date` in hospital local time, then derive start/end dates and bucket grain centrally.
**When to use:** All overview and trend queries, including replay/backfill.
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/14/functions-datetime.html
with params as (
  select
    (:as_of_date::date) as as_of_date,
    date_trunc('week', :as_of_date::timestamp)::date as week_start
)
select
  week_start - interval '12 weeks' as range_start_ts,
  (as_of_date + 1)::timestamp as range_end_exclusive_ts,
  'week'::text as bucket_grain
from params;
```

### Pattern 4: Bucket Calendar Then Left Join Facts
**What:** Build the full expected bucket series first, then left join aggregated facts into it.
**When to use:** Trend endpoints that must show partial historical data but must not invent future buckets.
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/14/functions-srf.html
with buckets as (
  select generate_series(
    :range_start::timestamp,
    :range_end::timestamp,
    interval '1 week'
  ) as bucket_start
)
select
  b.bucket_start,
  coalesce(sum(case when c.encounter_id is not null then 1 else 0 end), 0) as outpatient_count
from buckets b
left join fact_outpatient_encounter c
  on c.encounter_ts >= b.bucket_start
 and c.encounter_ts < b.bucket_start + interval '1 week'
group by 1
order by 1;
```

### Anti-Patterns to Avoid
- **One table with mixed grains:** Do not place encounter-level columns and evaluation-event columns in one denormalized table; repeated evaluations will corrupt counts.
- **Implicit `CURRENT_DATE` in business queries:** PostgreSQL current-time functions are transaction-scoped; use explicit `as_of_date` instead of hidden clock dependence.
- **Frontend-calculated ratios:** Ratios must come from the same server-side denominator rule or Phase 2 cards and charts will diverge.
- **Treating failed/timeout as “not evaluated”:** D-02 explicitly separates them; folding them into “未评估” hides stability problems.
- **Partial indexes as pseudo-partitioning:** PostgreSQL docs explicitly warn not to use many partial indexes as a substitute for partitioning.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Weekly/monthly bucket math | Custom date math in service code | PostgreSQL `date_trunc`, `date_bin`, `AT TIME ZONE` | Officially supported, timezone-aware, and easier to keep consistent |
| Repeated summary snapshots | Ad hoc cron scripts that rewrite tables blindly | Materialized views or deterministic summary tables refreshed on schedule | Built-in refresh semantics and index support reduce drift |
| Evaluated vs unevaluated classification | Controller-level `if` trees | A dedicated case-level SQL view | Reusable across overview, trend, and later drilldown queries |
| Sparse bucket padding | Manual array filling in frontend | `generate_series` calendar joins | Keeps query semantics central and avoids UI-specific gaps logic |
| Latest successful evaluation selection | App-side sorting after fetching all events | SQL window function or equivalent ranked subquery | Uses database ordering and cuts payload size drastically |

**Key insight:** In this phase, the risky part is not CRUD; it is semantic consistency. Database-native time and aggregation features are safer than duplicating business rules in multiple layers.

## Common Pitfalls

### Pitfall 1: Grain Drift Between Encounter and Evaluation
**What goes wrong:** 门诊量、触发数、成功评估数在不同查询里分别按就诊行数和评估行数统计，结果互相对不上。
**Why it happens:** 设计时没有先锁定事实表粒度，或直接在一个大表上做 `count(*)`。
**How to avoid:** 先定义 `fact_outpatient_encounter` 与 `fact_evaluation_event`，再通过 `mart_case_evaluation` 提供病例级口径。
**Warning signs:** “门诊量” 会随着重跑评估次数增加而变化。

### Pitfall 2: “昨日” 与时区漂移
**What goes wrong:** 凌晨跑批或跨时区部署后，首页默认范围提前或滞后一天。
**Why it happens:** 直接依赖数据库会话 `CURRENT_DATE` 或服务器默认时区。
**How to avoid:** 所有统计接口显式接收或注入医院本地时区下的 `as_of_date`，并在 SQL 中统一转换。
**Warning signs:** 同一天内重复查询出现不同默认起止日期。

### Pitfall 3: 分母规则在概览与趋势不一致
**What goes wrong:** 概览卡和趋势线的“诊断依据不完整比例”相差明显。
**Why it happens:** 一个地方按成功评估病例数作分母，另一个地方按全部门诊量作分母。
**How to avoid:** Phase 1 同时保留两套分母字段，但首页默认值只从“成功评估病例数分母”读取。
**Warning signs:** 总体比例不落在分桶比例的合理区间内。

### Pitfall 4: 多次评估去重规则不明确
**What goes wrong:** 同一病例多次评估后，指标波动无法解释。
**Why it happens:** 没有明确定义“最后一次成功评估”还是“最新一次评估”作为病例归档口径。
**How to avoid:** 固定为 D-03 的“最后一次成功评估”，失败/超时保留在事件事实表里单独统计。
**Warning signs:** 重新触发失败会让原本已成功评估的病例变成“未评估”。

### Pitfall 5: 用部分索引替代分区或通用索引
**What goes wrong:** 查询计划复杂，写入变慢，索引越来越多但收益不稳定。
**Why it happens:** 把多个 partial index 当成分区或普适优化手段。
**How to avoid:** 只为热点过滤条件建立少量 partial index；大表增长后再单独评估分区。
**Warning signs:** 为每个状态或每个科室都建一个 partial index。

## Code Examples

Verified patterns from official sources:

### Default “Near Three Months” Window
```sql
-- Source: https://www.postgresql.org/docs/14/functions-datetime.html
with p as (
  select :as_of_date::date as as_of_date
)
select
  date_trunc('week', p.as_of_date::timestamp)::date - interval '12 weeks' as start_ts,
  (p.as_of_date + 1)::timestamp as end_ts_exclusive,
  p.as_of_date as cutoff_date
from p;
```

### Weekly Trend Buckets With Stable Padding
```sql
-- Source: https://www.postgresql.org/docs/14/functions-srf.html
with bucket_series as (
  select generate_series(:start_ts, :end_ts - interval '1 week', interval '1 week') as bucket_start
),
agg as (
  select
    date_trunc('week', encounter_ts) as bucket_start,
    count(*) as outpatient_count
  from fact_outpatient_encounter
  where encounter_ts >= :start_ts
    and encounter_ts < :end_ts
  group by 1
)
select
  b.bucket_start,
  coalesce(a.outpatient_count, 0) as outpatient_count
from bucket_series b
left join agg a using (bucket_start)
order by b.bucket_start;
```

### Summary Cache Over Yesterday-Cutoff Data
```sql
-- Source: https://www.postgresql.org/docs/14/rules-materializedviews.html
create materialized view mv_daily_quality_summary as
select
  encounter_date,
  dept_id,
  count(*) as outpatient_count,
  count(*) filter (where was_triggered) as triggered_case_count,
  count(*) filter (where was_successfully_evaluated) as successful_eval_count
from mart_case_evaluation
group by encounter_date, dept_id;

create unique index mv_daily_quality_summary_pk
  on mv_daily_quality_summary (encounter_date, dept_id);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| One denormalized analytics table | Conformed star schema with consistent grain | Mature DW practice; still current | Lower semantic drift and easier reuse across dashboards |
| App-side date bucketing | Database-native time bucketing and calendar joins | Current PostgreSQL releases support `date_bin` and robust time ops | Less duplicated logic across services |
| Always-live raw queries | Summary caches or materialized views for repeated rollups | Common in modern analytics backends | Better dashboard performance when freshness cutoff is “昨日” |

**Deprecated/outdated:**
- Hidden server-clock logic for dashboard windows: outdated for replay/backfill scenarios; `as_of_date` must be explicit.
- “Big table first” modeling for mixed event grains: outdated for this requirement set because DATA-03 depends on clear evaluated vs unevaluated semantics.

## Open Questions

1. **What are the actual source table names, keys, and field semantics in the outpatient EMR and evaluation systems?**
   - What we know: PRD and context define required domains and target metrics.
   - What's unclear: Physical source schemas, nullability, update cadence, and whether `encounter_id` and `case_id` are already stable.
   - Recommendation: Make Plan `01-01` start with a source schema inventory and a field mapping matrix before writing DDL.

2. **What is the deployed PostgreSQL version and timezone configuration?**
   - What we know: PRD lists a PostgreSQL endpoint; local machine lacks `psql`, so direct validation was not performed.
   - What's unclear: Whether production-compatible features are limited below PostgreSQL 14 and what timezone the DB/session defaults to.
   - Recommendation: Add an early verification step to capture `select version(); show timezone;` from the target DB.

3. **How should “班次” be encoded for过去 7 天 / 上周?**
   - What we know: PRD requires 上午、下午 two slots.
   - What's unclear: Exact cutoff hour, and whether source encounter timestamps are reliable enough for slot assignment.
   - Recommendation: Lock a deterministic rule in Plan `01-02` such as `[00:00,12:00)` and `[12:00,24:00)` unless business gives a hospital-specific session definition.

4. **What is the placeholder storage shape for the overall diagnosis quality index?**
   - What we know: D-08 says store a configurable placeholder, do not expose a formal value yet.
   - What's unclear: Whether placeholder means nullable numeric column, config table entry, or derived formula registry.
   - Recommendation: Use a config table plus nullable derived field in the semantic layer, not a hardcoded formula.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Future service/API implementation | ✓ | v24.14.0 | Python scripts for temporary validation |
| npm | Future JS package management | ✓ | 11.9.0 | — |
| Python 3 | Data checks and ad hoc validation | ✓ | 3.12.3 | Node scripts |
| PostgreSQL client (`psql`) | DB version/timezone verification and SQL test execution | ✗ | — | Use app driver temporarily, but planner should prefer installing client access |
| Target PostgreSQL server access | Schema mapping and query validation | ? | — | None |

**Missing dependencies with no fallback:**
- Verified access to the target PostgreSQL instance is still unconfirmed. Planner must include an explicit connectivity and schema-discovery step.

**Missing dependencies with fallback:**
- `psql` is not installed locally. SQL can still be executed through an app driver, but that is a weaker validation path than direct CLI access.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none — Wave 0 |
| Config file | none — see Wave 0 |
| Quick run command | unavailable until DB test harness is added |
| Full suite command | unavailable until DB test harness is added |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Raw outpatient + diagnosis + evaluation data map into unified facts/dimensions | SQL integration | `psql "$DATABASE_URL" -f sql/tests/data_01_mapping.sql` | ❌ Wave 0 |
| DATA-02 | Aggregations return correct counts and ratios by day/week/month | SQL integration | `psql "$DATABASE_URL" -f sql/tests/data_02_aggregates.sql` | ❌ Wave 0 |
| DATA-03 | Cases split correctly into triggered/success/failed-timeout/not-triggered and evaluated/unevaluated | SQL integration | `psql "$DATABASE_URL" -f sql/tests/data_03_status_split.sql` | ❌ Wave 0 |
| DASH-01 | Default range and cutoff date derive correctly from explicit `as_of_date` | SQL unit/integration | `psql "$DATABASE_URL" -f sql/tests/dash_01_default_window.sql` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Run the smallest relevant SQL assertion file against fixture data.
- **Per wave merge:** Run all Phase 1 SQL assertions plus one end-to-end overview query snapshot.
- **Phase gate:** Full Phase 1 SQL suite must pass against a known fixture dataset before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `sql/tests/fixtures/` — stable encounter/evaluation sample rows covering success, failed, timeout, and not-triggered cases
- [ ] `sql/tests/data_01_mapping.sql` — field mapping assertions for facts and dimensions
- [ ] `sql/tests/data_02_aggregates.sql` — metric and denominator assertions
- [ ] `sql/tests/data_03_status_split.sql` — evaluated vs unevaluated assertions
- [ ] `sql/tests/dash_01_default_window.sql` — default range assertions around week/month/year boundaries
- [ ] DB test runner decision — `psql` scripts or app-level integration tests

## Sources

### Primary (HIGH confidence)
- Local project doc: [PRD](/home/healink/ykhl/test-ai/门诊诊鉴首页-(全栈).md) - checked time ranges, default cutoff, metric/grain rules, and PostgreSQL environment note
- Local project doc: [Phase context](/home/healink/ykhl/test-ai/.planning/phases/01-data-foundation/01-CONTEXT.md) - checked locked implementation decisions for facts, metrics, and query scope
- Local project doc: [Requirements](/home/healink/ykhl/test-ai/.planning/REQUIREMENTS.md) - checked Phase 1 requirement IDs and acceptance boundaries
- Local project doc: [CLAUDE](/home/healink/ykhl/test-ai/CLAUDE.md) - checked project constraints and workflow requirements
- PostgreSQL official docs: https://www.postgresql.org/docs/14/functions-datetime.html - checked `date_trunc`, `date_bin`, `AT TIME ZONE`, and current-date semantics
- PostgreSQL official docs: https://www.postgresql.org/docs/14/functions-srf.html - checked `generate_series` for bucket padding
- PostgreSQL official docs: https://www.postgresql.org/docs/14/rules-materializedviews.html - checked materialized view behavior and refresh pattern
- PostgreSQL official docs: https://www.postgresql.org/docs/14/indexes-partial.html - checked intended and unintended uses of partial indexes

### Secondary (MEDIUM confidence)
- Microsoft Learn: https://learn.microsoft.com/en-us/power-bi/guidance/star-schema - used as current official guidance for star-schema grain separation and conformed dimensions

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - PostgreSQL capabilities are verified, but the deployed DB version and application scaffold are not yet validated
- Architecture: HIGH - dual-fact star schema and semantic-view layering are strongly supported by project constraints and official modeling guidance
- Pitfalls: HIGH - directly derived from locked decisions, PRD grain rules, and PostgreSQL official behavior

**Research date:** 2026-03-25
**Valid until:** 2026-04-24
