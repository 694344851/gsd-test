# Requirements: 门诊诊鉴智能体

**Defined:** 2026-03-24
**Core Value:** 在不替代临床决策的前提下，稳定地发现门诊诊断依据不完整和潜在缺漏诊断问题，并把结果转化为可操作的改进建议。

## v1 Requirements

### Data Integration

- [x] **DATA-01**: 系统可以接入门诊病历、诊断结果和评估结果数据，并形成统一分析数据模型
- [ ] **DATA-02**: 系统可以按日、周、月等统计口径聚合门诊量、评估病例数、诊断依据不完整比例和缺失诊断比例
- [ ] **DATA-03**: 系统可以区分已评估与未评估病例，并支撑后续图表和下钻查询

### Dashboard Overview

- [ ] **DASH-01**: 用户可以在首页查看默认时间范围及其起止日期，默认口径符合 PRD 约定
- [ ] **DASH-02**: 用户可以切换近三个月、近半年、近一年、过去 30 天、过去 7 天、上周、上个月、上个季度、上一年和自定义时间
- [ ] **DASH-03**: 首页概览卡可以展示本期值、与上期差值、增减符号和 N/A 规则
- [ ] **DASH-04**: 首页概览卡至少展示门诊量、评估病例数、诊断依据不完整比例、缺失诊断比例和整体诊断质量指数

### Trend Analysis

- [ ] **TREN-01**: 用户可以查看门诊诊断质量趋势图，按选定时间维度切换横坐标粒度
- [ ] **TREN-02**: 趋势图可以同时展示门诊量、评估病例数、诊断依据不完整比例和缺失诊断比例
- [ ] **TREN-03**: 用户悬停趋势图任意点位时可以查看时间和对应指标值

### Distribution Analysis

- [ ] **DIST-01**: 用户可以查看按科室分布的气泡图，X 轴为门诊量，Y 轴为诊断依据不完整比例
- [ ] **DIST-02**: 气泡图可以用气泡大小表示评估病例数，用颜色表示诊断缺漏比例
- [ ] **DIST-03**: 用户可以按科室类型筛选分布图，并在悬停时查看科室详细数据

### Disease Insights

- [ ] **DISE-01**: 用户可以查看高发问题病种词云，默认展示问题数量靠前的病种
- [ ] **DISE-02**: 词云颜色和布局可以体现病种问题严重程度，并遵循 PRD 中的排序逻辑

### Realtime Evaluation

- [x] **EVAL-01**: 门诊医生可以在病历界面一键触发诊鉴评估
- [ ] **EVAL-02**: 系统可以在约 10 秒内返回诊断依据完整性和缺漏诊断评估结果
- [x] **EVAL-03**: 评估结果需要包含具体评估依据和可操作建议，便于医生补充病历或调整诊断
- [ ] **EVAL-04**: 系统需要记录单次诊鉴结果，供统计首页和病例下钻复用

### Drilldown and Export

- [ ] **OPER-01**: 管理者可以从首页下钻到科室、医生或病种维度的问题明细
- [ ] **OPER-02**: 管理者可以查看并下载问题病例，支持进一步人工复核
- [ ] **OPER-03**: 系统需要对不同角色开放相应查询能力，避免医生和管理端权限混淆

## v2 Requirements

### Quality Governance

- **GOV-01**: 系统可以对异常指标波动生成预警和订阅通知
- **GOV-02**: 系统可以提供跨院区或跨科室基准对比分析
- **GOV-03**: 系统可以沉淀诊鉴规则版本与模型版本对比能力

### Product Extensions

- **EXT-01**: 系统可以支持移动端查看关键指标
- **EXT-02**: 系统可以覆盖住院或其他诊疗场景

## Out of Scope

| Feature | Reason |
|---------|--------|
| 自动替医生生成最终诊断 | 临床风险高，违背辅助决策定位 |
| 改造现有病历系统核心录入流程 | 集成成本高，不是当前项目目标 |
| 原生移动 App | 桌面端和嵌入式页面优先 |
| 非门诊场景质控 | 当前 PRD 未覆盖 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DASH-01 | Phase 1 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| TREN-01 | Phase 2 | Pending |
| TREN-02 | Phase 2 | Pending |
| TREN-03 | Phase 2 | Pending |
| DIST-01 | Phase 3 | Pending |
| DIST-02 | Phase 3 | Pending |
| DIST-03 | Phase 3 | Pending |
| DISE-01 | Phase 3 | Pending |
| DISE-02 | Phase 3 | Pending |
| EVAL-01 | Phase 4 | Complete |
| EVAL-02 | Phase 4 | Pending |
| EVAL-03 | Phase 4 | Complete |
| EVAL-04 | Phase 4 | Pending |
| OPER-01 | Phase 5 | Pending |
| OPER-02 | Phase 5 | Pending |
| OPER-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after initial definition*
