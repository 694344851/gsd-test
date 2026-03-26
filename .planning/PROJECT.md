# 门诊诊鉴智能体

## What This Is

这是一个已经交付 v1.0 的门诊质控智能产品，包含两条核心 surface：医生端以嵌入式方式接入现有 EMR 病历系统，提供实时诊断质量评估；管理端提供 Web 分析首页，用于查看概览、趋势、科室分布、高发问题病种，以及问题病例下钻与导出。

## Core Value

在不替代临床决策的前提下，稳定地发现门诊诊断依据不完整和潜在缺漏诊断问题，并把结果转化为可操作的改进建议。

## Current State

- v1.0 已于 2026-03-26 完成并归档
- 已交付 5 个 phase、14 个 plans，形成医生端实时诊鉴与管理端分析闭环
- 代码基线约 8,256 LOC，主要技术栈为 React + Vite、Python stdlib HTTP server、PostgreSQL SQL semantic layer
- Phase 5 人工 UAT 已完成，当前没有未关闭的 v1 验收项

## Requirements

### Validated

- ✓ 数据接入、统一时间窗口和分析语义底座 — v1.0
- ✓ 管理端首页时间筛选、概览卡和趋势分析 — v1.0
- ✓ 科室分布和高发问题病种洞察 — v1.0
- ✓ 医生端实时诊鉴、结构化结果和持久化复用 — v1.0
- ✓ 管理端问题病例下钻、CSV 导出和角色权限边界 — v1.0

### Active

None yet. Define the next milestone with `$gsd-new-milestone`.

### Out of Scope

- 直接修改现有门诊病历系统核心录入流程 — v1 继续采用嵌入与增强策略
- 替代医生做最终临床诊断决策 — 产品只提供辅助评估和建议
- 覆盖住院、急诊等非门诊场景 — 仍未进入当前里程碑范围
- 在 v1 中建设移动端原生应用 — 当前优先桌面 Web 和嵌入式页面

## Next Milestone Goals

- 明确下一里程碑需求与范围，生成新的 `REQUIREMENTS.md` 和 `ROADMAP.md`
- 确认整体诊断质量指数的最终公式、校准来源与展示解释
- 评估生产级身份体系、治理预警、跨院区对比等后续能力是否进入下一 milestone

## Context

- PRD 来源仍为 [`门诊诊鉴首页-(全栈).md`](/home/healink/ykhl/test-ai/门诊诊鉴首页-(全栈).md)
- 当前产品已经形成两个稳定使用面：
  1. 医生端在病历界面点击“诊鉴”，约 10 秒内返回结构化评估结果，并保留持久化记录
  2. 管理端查看历史累计与昨日快照，通过首页、趋势、气泡图、词云、下钻和导出定位问题
- 统计语义集中在 PostgreSQL + query service，前端不再自行定义核心指标公式

## Constraints

- **Integration**: 仍需与现有门诊病历系统协同，不能破坏临床录入流程
- **Performance**: 实时诊鉴仍需保持临床可接受延迟，当前目标为约 10 秒
- **Data Accuracy**: 首页、下钻、导出和持久化复用必须继续共用一致口径
- **Clinical Safety**: 产品持续保持辅助评估定位，不能表达为自动诊断结论

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 以 PostgreSQL 语义层作为指标单一来源 | 保证首页、趋势、下钻和导出口径一致 | ✓ Good |
| 医生端通过 EMR host seam 嵌入而不是独立路由 | 降低对宿主病历流程的侵入 | ✓ Good |
| 实时诊鉴采用同步 POST + 10 秒预算 + 统一状态容器 | 保持医生端交互和失败语义可预测 | ✓ Good |
| 管理端 drilldown 与 CSV export 复用同一 case query helper | 避免屏幕与下载文件出现语义漂移 | ✓ Good |
| 角色边界先使用宿主注入 viewer context + 服务端校验 | 用最小可行方式完成 v1 权限隔离 | ⚠ Revisit |

## Evolution

Previous initialization snapshot has been superseded by the shipped v1.0 state and archived milestone artifacts in `.planning/milestones/`.

---
*Last updated: 2026-03-26 after v1.0 milestone archive*
