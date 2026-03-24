# 门诊诊鉴智能体

## What This Is

这是一个面向医院门诊质控场景的智能诊鉴产品，服务门诊医生、医务管理者和质控管理者。产品由两部分组成：一部分嵌入现有门诊病历系统，为医生提供实时诊断质量评估；另一部分提供统计分析首页，帮助管理者查看历史趋势、问题分布和病例下钻结果。

## Core Value

在不替代临床决策的前提下，稳定地发现门诊诊断依据不完整和潜在缺漏诊断问题，并把结果转化为可操作的改进建议。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 医院可以接入门诊病历与评估结果数据，形成可追溯的诊鉴分析数据底座
- [ ] 门诊医生可以在病历界面一键触发诊鉴，并在可接受的时间内收到结构化评估结果
- [ ] 医务和质控管理者可以通过首页查看门诊质量概览、趋势、科室分布和高发问题病种
- [ ] 管理者可以按时间、科室等维度筛选、下钻并导出问题病例用于复核
- [ ] 系统需要支持指标定义、口径一致性、权限边界和上线后的持续优化

### Out of Scope

- 直接修改现有门诊病历系统核心录入流程 — 本项目以集成和增强为主
- 替代医生做最终临床诊断决策 — 产品只提供辅助评估和建议
- 覆盖住院、急诊等非门诊场景 — 当前 PRD 只定义门诊质控范围
- 在 v1 中建设移动端原生应用 — 优先交付嵌入式页面和 Web 管理界面

## Context

- PRD 来源为 [`门诊诊鉴首页-(全栈).md`](/home/healink/ykhl/test-ai/门诊诊鉴首页-(全栈).md)，包含首页视觉稿、统计指标和核心场景描述
- 产品核心角色包括门诊医生、医务管理者、质控管理者
- 关键业务场景有两个：
  1. 门诊医生在病历界面点击“诊鉴”，系统在约 10 秒内返回诊断依据完整性、缺漏诊断评估、评估依据和行动建议
  2. 管理者查看历史累计数据与昨日快照，通过趋势、气泡图、词云和病例下钻定位问题
- 首页重点模块来自 PRD：时间维度选择、概览指标、门诊诊断质量趋势图、科室诊断质量分布、高发问题病种词云
- 当前仓库尚无业务代码，主要包含 PRD 文档和配图，因此本次初始化按绿地项目处理

## Constraints

- **Integration**: 需要集成现有门诊病历系统 — 不能破坏原系统核心诊疗流程
- **Performance**: 实时诊鉴结果需在临床可接受范围内返回，PRD 目标约 10 秒 — 否则医生不愿使用
- **Data Accuracy**: 统计指标和环比口径必须一致 — 管理者会用它做质控决策
- **Database**: 当前已给出 PostgreSQL 环境信息 — 后端设计需要兼容该数据源或迁移方案
- **Clinical Safety**: 产品只能做辅助评估与提示 — 不能表达为自动诊断结论
- **Scope**: v1 优先完成门诊诊鉴首页和实时诊鉴主链路 — 复杂治理能力延后

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 先按绿地项目初始化，而不是 brownfield map | 当前仓库没有可分析的业务代码，只有 PRD 和素材 | ✓ Good |
| v1 同时覆盖实时诊鉴和统计分析首页 | 两者共同构成产品最小闭环，缺一则用户价值不成立 | — Pending |
| 统计分析默认以“昨日”作为数据截止口径 | PRD 对首页统计口径有明确要求，便于统一数据解释 | — Pending |
| 管理端先做 Web 仪表盘，不做移动端 | PRD 聚焦桌面分析场景，先保证质控分析效率 | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-24 after initialization*
