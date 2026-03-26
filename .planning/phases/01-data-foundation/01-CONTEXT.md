# Phase 1: Data Foundation - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

建立支撑实时诊鉴和首页统计的统一数据模型、默认时间口径、核心指标计算逻辑和基础查询接口。范围聚焦门诊数据接入、评估结果沉淀、聚合规则与可复用查询 contract，不扩展到首页展示层、分布洞察、医生端交互或权限治理细节。

</domain>

<decisions>
## Implementation Decisions

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

### the agent's Discretion
- 指标与维度在数据库中的具体命名规范、表拆分方式和索引策略。
- `as_of_date` 的具体参数格式、默认值注入位置和错误处理方式。
- 通用聚合服务与场景接口的模块边界、DTO 命名和实现组织方式。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 产品与范围
- `.planning/PROJECT.md` — 项目定位、角色、约束、默认统计截止口径与阶段性关键决策。
- `.planning/REQUIREMENTS.md` — Phase 1 对应的 `DATA-01` `DATA-02` `DATA-03` `DASH-01` 需求映射与验收边界。
- `.planning/ROADMAP.md` — Phase 1 目标、success criteria 与计划拆分。

### PRD 与统计口径
- `门诊诊鉴首页-(全栈).md` §3.1.1 — 首页时间维度、默认“近三个月”、截止昨日、趋势图粒度与概览指标展示规则。
- `门诊诊鉴首页-(全栈).md` §4 — 当前 PostgreSQL 基础环境信息。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 当前仓库无业务代码、无既有组件和服务层，可按绿地项目设计数据模型与查询接口。

### Established Patterns
- 暂无现成代码约束；当前唯一稳定约束来自 PRD、ROADMAP、PROJECT 和 REQUIREMENTS 文档。

### Integration Points
- 需要围绕现有门诊病历系统的数据接入建设数据底座，但不改造原系统核心录入流程。
- Phase 1 产出的统一模型与查询接口将直接支撑 Phase 2 首页概览/趋势、Phase 3 分布洞察和 Phase 4 评估结果沉淀复用。

</code_context>

<specifics>
## Specific Ideas

- 统计首页默认以“昨日”为数据截止口径，但基础接口必须支持 `as_of_date` 重算。
- 时间维度必须严格贴合 PRD，不用“过去 90 天”替代“近三个月按周”。
- 评估相关统计需要同时保留“触发数”“成功评估数”“未触发/失败/超时”等状态，以便兼顾覆盖率和稳定性分析。

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-data-foundation*
*Context gathered: 2026-03-25*
