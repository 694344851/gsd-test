# Roadmap: 门诊诊鉴智能体

## Overview

先搭建可复用的数据与指标底座，再完成管理端首页分析能力，随后补齐科室与病种问题洞察，最后交付门诊医生端实时诊鉴和管理闭环能力。这样可以先把统计口径与数据链路稳定下来，再承接实时评估与下钻导出等更贴近上线的能力。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Data Foundation** - 建立门诊诊鉴的数据接入、指标聚合和时间口径基础
- [ ] **Phase 2: Dashboard Overview** - 完成首页时间筛选、概览卡片和趋势图
- [ ] **Phase 3: Quality Distribution Insights** - 完成科室分布和高发问题病种分析
- [ ] **Phase 4: Realtime Evaluation Workflow** - 完成医生端一键诊鉴和评估结果沉淀
- [ ] **Phase 5: Drilldown and Release Hardening** - 完成管理下钻、导出、权限和上线收口

## Phase Details

### Phase 1: Data Foundation
**Goal**: 建立支撑实时诊鉴和首页统计的统一数据模型、时间口径和指标计算逻辑
**Depends on**: Nothing (first phase)
**Requirements**: [DATA-01, DATA-02, DATA-03, DASH-01]
**UI hint**: no
**Success Criteria** (what must be TRUE):
  1. 系统可以稳定读取门诊病历和评估结果相关数据，并形成统一分析口径
  2. 首页默认时间范围和截止日期规则可被准确计算
  3. 门诊量、评估病例数、诊断依据不完整比例和缺失诊断比例可以按时间维度聚合
  4. 已评估与未评估病例可以被明确区分，供后续图表复用
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — 建立 SQL 测试基座、夹具数据与双事实数据模型
- [ ] 01-02-PLAN.md — 实现默认时间窗口、核心聚合语义与查询 contract
- [ ] 01-03-PLAN.md — 发布概览/趋势/状态拆分查询服务与场景接口

### Phase 2: Dashboard Overview
**Goal**: 交付首页时间筛选、概览指标卡和门诊诊断质量趋势图
**Depends on**: Phase 1
**Requirements**: [DASH-02, DASH-03, DASH-04, TREN-01, TREN-02, TREN-03]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. 管理者可以切换 PRD 定义的时间维度并看到正确的起止时间
  2. 首页概览卡正确展示本期值、环比变化和 N/A 规则
  3. 趋势图可以同时展示门诊量、评估病例数和两个质量比例指标
  4. 用户悬停图表时能看到准确的时间和指标详情
**Plans**: 3 plans

Plans:
- [ ] 02-01: 实现时间维度选择与时间轴粒度切换
- [ ] 02-02: 实现概览卡片展示规则和环比逻辑
- [ ] 02-03: 实现双轴趋势图与悬浮提示交互

### Phase 3: Quality Distribution Insights
**Goal**: 交付科室诊断质量分布和高发问题病种洞察模块
**Depends on**: Phase 2
**Requirements**: [DIST-01, DIST-02, DIST-03, DISE-01, DISE-02]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. 用户可以通过气泡图识别高门诊量、高问题比例的重点科室
  2. 用户可以按科室类型筛选并查看科室详细指标
  3. 用户可以从词云快速识别问题高发病种及其严重程度
**Plans**: 2 plans

Plans:
- [ ] 03-01: 实现科室分布气泡图与筛选交互
- [ ] 03-02: 实现病种词云计算、排序和视觉表达

### Phase 4: Realtime Evaluation Workflow
**Goal**: 交付医生端一键诊鉴、结果展示和评估记录沉淀能力
**Depends on**: Phase 1
**Requirements**: [EVAL-01, EVAL-02, EVAL-03, EVAL-04]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. 门诊医生可以在病历界面触发诊鉴，不破坏现有录入流程
  2. 系统可以在约 10 秒内返回结构化评估结果
  3. 结果中包含诊断依据完整性、潜在缺漏诊断、评估依据和行动建议
  4. 每次评估结果都可被存档并用于后续统计分析
**Plans**: 3 plans

Plans:
- [ ] 04-01: 设计医生端触发入口和结果展示结构
- [ ] 04-02: 实现诊鉴服务编排、超时控制和结果回传
- [ ] 04-03: 实现评估记录存储和统计复用链路

### Phase 5: Drilldown and Release Hardening
**Goal**: 交付问题病例下钻、导出、角色权限和上线前收口工作
**Depends on**: Phase 3, Phase 4
**Requirements**: [OPER-01, OPER-02, OPER-03]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. 管理者可以从首页下钻到科室、医生或病种问题明细
  2. 管理者可以下载问题病例用于人工复核
  3. 医生端和管理端权限边界清晰，避免越权访问
  4. 上线前关键业务链路和指标口径完成验收
**Plans**: 3 plans

Plans:
- [ ] 05-01: 实现下钻明细页和条件联动
- [ ] 05-02: 实现病例导出和下载能力
- [ ] 05-03: 完成角色权限、验收和发布准备

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Foundation | 1/3 | In Progress | 2026-03-25 |
| 2. Dashboard Overview | 0/3 | Not started | - |
| 3. Quality Distribution Insights | 0/2 | Not started | - |
| 4. Realtime Evaluation Workflow | 0/3 | Not started | - |
| 5. Drilldown and Release Hardening | 0/3 | Not started | - |
