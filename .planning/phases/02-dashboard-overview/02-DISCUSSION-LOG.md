# Phase 2: Dashboard Overview - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 2-Dashboard Overview
**Areas discussed:** 时间筛选体验, 概览卡片内容与密度, 环比/N/A 展示规则, 趋势图表现与交互

---

## Agent-Directed Defaults

用户明确授权“你按照最合适的来”，因此本次讨论由执行者按 PRD 与 Phase 1 已锁定语义选择推荐默认方案，并写入 CONTEXT.md。

### 时间筛选体验
- 采用快捷时间范围选择 + 自定义时间入口
- 顶部持续展示起止日期与截止昨日规则
- 默认选中近三个月，沿用 13 个周单元

### 概览卡片内容与密度
- 固定 5 张卡：门诊量、评估病例数、诊断依据不完整比例、缺失诊断比例、整体诊断质量指数
- 卡片结构统一为主值 + 较上期变化
- 质量指数公式未确认前保留卡位但不展示伪造数值

### 环比/N/A 展示规则
- 严格沿用 PRD 中的颜色、箭头、加减号与 `N/A` 规则
- 无变化统一显示 `较上期 --`

### 趋势图表现与交互
- 采用双轴组合图
- 门诊量与评估病例数用灰色总量 + 蓝色评估量重叠柱
- 同时展示两条比例折线
- Tooltip 同时展示时间与 4 个核心指标

---
