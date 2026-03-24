<!-- GSD:project-start source:PROJECT.md -->
## Project

**门诊诊鉴智能体**

这是一个面向医院门诊质控场景的智能诊鉴产品，服务门诊医生、医务管理者和质控管理者。产品由两部分组成：一部分嵌入现有门诊病历系统，为医生提供实时诊断质量评估；另一部分提供统计分析首页，帮助管理者查看历史趋势、问题分布和病例下钻结果。

**Core Value:** 在不替代临床决策的前提下，稳定地发现门诊诊断依据不完整和潜在缺漏诊断问题，并把结果转化为可操作的改进建议。

### Constraints

- **Integration**: 需要集成现有门诊病历系统 — 不能破坏原系统核心诊疗流程
- **Performance**: 实时诊鉴结果需在临床可接受范围内返回，PRD 目标约 10 秒 — 否则医生不愿使用
- **Data Accuracy**: 统计指标和环比口径必须一致 — 管理者会用它做质控决策
- **Database**: 当前已给出 PostgreSQL 环境信息 — 后端设计需要兼容该数据源或迁移方案
- **Clinical Safety**: 产品只能做辅助评估与提示 — 不能表达为自动诊断结论
- **Scope**: v1 优先完成门诊诊鉴首页和实时诊鉴主链路 — 复杂治理能力延后
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
