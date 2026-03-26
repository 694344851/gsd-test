# Phase 1: Data Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 1-Data Foundation
**Areas discussed:** 数据接入边界, 指标口径, 默认时间范围与截止规则, 基础查询接口

---

## 数据接入边界

| Option | Description | Selected |
|--------|-------------|----------|
| A | 以“就诊/病例”为主，一条门诊记录是一条主事实，诊断和评估挂在其下 | |
| B | 以“诊鉴评估事件”为主，只有触发评估后才形成主事实 | |
| C | 双事实模型：就诊事实 + 评估事实分开，靠 encounter_id / case_id 关联 | ✓ |

**User's choice:** 双事实模型
**Notes:** 未评估病例采用三态区分；单次门诊保留多次评估，统计默认取最后一次成功结果；接入范围包含基础维表以支撑后续分析。

---

## 指标口径

| Option | Description | Selected |
|--------|-------------|----------|
| A | 用单一业务口径快速落地 | |
| B | 用触发/全量口径简化模型 | |
| C | 同时保留主口径与扩展口径，首页默认展示一套稳定口径 | ✓ |

**User's choice:** 保留双口径/扩展口径
**Notes:** 门诊量按就诊记录数为主，保留患者去重口径；评估病例数保留触发数与成功评估数；两个质量比例保留两套分母；整体诊断质量指数先做可配置占位。

---

## 默认时间范围与截止规则

| Option | Description | Selected |
|--------|-------------|----------|
| A | 严格按 PRD 规则落地默认范围和粒度 | ✓ |
| B | 用滚动天数简化默认规则 | |
| C | 先缩减范围，后续再补齐 | |

**User's choice:** 严格按 PRD 落地
**Notes:** 默认“近三个月”按昨日所在周回溯 12 周并含本周；默认截止昨日但支持 `as_of_date`；数据不足时部分展示；粒度规则一次锁定到班次/天/周/月。

---

## 基础查询接口

| Option | Description | Selected |
|--------|-------------|----------|
| A | 只做单一通用接口或最小概览接口 | |
| B | 直接按页面模块拆散接口 | |
| C | 底层通用聚合服务 + 对外少量场景化查询接口 | ✓ |

**User's choice:** 分层接口策略
**Notes:** Phase 1 最小对外能力包含概览汇总、趋势时间序列、已评估/未评估拆分；筛选先开放时间、科室、科室类型、医生、病种；响应采用稳定领域结果加场景包装。

---
