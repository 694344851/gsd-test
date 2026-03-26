# Phase 4: Realtime Evaluation Workflow - Research

**Researched:** 2026-03-25
**Domain:** Doctor-side realtime evaluation workflow on top of the existing React dashboard, Python HTTP bridge, and PostgreSQL semantic layer
**Confidence:** MEDIUM

<user_constraints>
## User Constraints

> No `04-CONTEXT.md` exists yet. The constraints below are the concrete planning inputs extracted from the user request, [`ROADMAP.md`](/home/healink/ykhl/test-ai/.planning/ROADMAP.md), [`REQUIREMENTS.md`](/home/healink/ykhl/test-ai/.planning/REQUIREMENTS.md), [`PROJECT.md`](/home/healink/ykhl/test-ai/.planning/PROJECT.md), and [`门诊诊鉴首页-(全栈).md`](/home/healink/ykhl/test-ai/门诊诊鉴首页-(全栈).md).

### Locked Decisions
- Phase 4 scope is limited to `EVAL-01`, `EVAL-02`, `EVAL-03`, and `EVAL-04`.
- The implementation must fit the current repo reality: existing React frontend under `frontend/src`, Python HTTP bridge/server under `src/api`, and PostgreSQL-first analytics layer under `sql/`.
- Doctor-side realtime evaluation must be embedded into the existing EMR flow and must not require changing the EMR core input flow.
- The doctor triggers evaluation explicitly from the EMR病历界面 by clicking `诊鉴`.
- The target UX remains an approximately 10-second turnaround from trigger to result.
- Returned results must include diagnosis basis completeness, potential missing diagnoses, evaluation rationale, and actionable suggestions.
- Every evaluation attempt must be persisted for later analytics reuse and future drilldown.
- The product remains assistive only and must not present itself as autonomous diagnosis.
- The likely planning split should remain three plans:
  1. doctor-side trigger entry + result UI shell
  2. evaluation orchestration / timeout / result return
  3. persistence and analytics reuse chain

### Claude's Discretion
- Exact component/file split inside the existing frontend app, as long as it remains embeddable and does not force a router rewrite.
- Exact response contract for realtime evaluation APIs, as long as it is typed, explicit, and preserves assistive positioning.
- Exact persistence schema additions, as long as they preserve the existing Phase 1 aggregate semantics and support later analytics/drilldown reuse.
- Exact validation split between frontend tests, Python tests, and SQL assertions.

### Deferred Ideas (OUT OF SCOPE)
- Rebuilding the EMR shell or changing the medical-record input workflow.
- Full permissions and release hardening, which remain Phase 5 scope.
- Formal overall quality-index formula, which is still unresolved in project state.
- Model/version comparison, alerting, subscriptions, and governance functions from v2.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EVAL-01 | 门诊医生可以在病历界面一键触发诊鉴评估 | Recommend an embeddable doctor-side panel with explicit trigger button and encounter-context contract |
| EVAL-02 | 系统可以在约 10 秒内返回诊断依据完整性和缺漏诊断评估结果 | Recommend synchronous POST orchestration with a hard timeout budget and typed timeout/failure states |
| EVAL-03 | 评估结果需要包含具体评估依据和可操作建议，便于医生补充病历或调整诊断 | Recommend a structured result contract with sections for basis completeness, missing diagnoses, rationale, and suggestions |
| EVAL-04 | 系统需要记录单次诊鉴结果，供统计首页和病例下钻复用 | Recommend persisting each attempt plus a structured detail payload, while preserving Phase 1 aggregate semantics |
</phase_requirements>

## Summary

Phase 4 should extend the existing stack, not introduce a second application or a separate realtime service. The current repo already has the right layering for this phase: React components fetch typed JSON from thin Python HTTP handlers, and analytics semantics live in PostgreSQL plus `src/domain/analytics/query_service.py`. The missing piece is a doctor-facing slice that can trigger an evaluation, render the result, and persist the attempt without dragging EMR integration concerns into every layer.

The safest repo-native architecture is an embeddable React doctor panel backed by a new Python POST endpoint. The endpoint should accept a normalized encounter snapshot from the EMR host, create a persisted evaluation attempt immediately, run evaluation orchestration under a strict timeout budget, persist the final result or timeout/failure status, and return a structured assistive response. This keeps the UI thin, keeps clinical language controlled in one backend contract, and avoids pushing workflow semantics into the frontend.

The main planning risk is that the repo has no existing LLM/provider integration, no async worker, and no EMR contract yet. Plans should therefore isolate those unknowns behind explicit adapters and assumptions instead of pretending they are solved. The planner should treat “EMR passes encounter context payload” and “evaluation provider is swappable behind a Python adapter” as locked implementation assumptions unless the user provides stronger constraints before planning.

**Primary recommendation:** Build Phase 4 as an embeddable doctor panel plus a synchronous Python evaluation endpoint that persists every attempt and writes aggregate-friendly status flags, while deferring full EMR integration and provider implementation details behind explicit request/adapter contracts.

## Project Constraints (from CLAUDE.md)

- Start file-changing work through the GSD workflow; this research artifact is already inside that workflow.
- Do not recommend changes that break the existing outpatient EMR core workflow.
- Keep statistics and denominator rules consistent; frontend code must not redefine analytics semantics.
- PostgreSQL compatibility remains required for the data/analytics path.
- Clinical safety positioning remains assistive, not autonomous diagnosis.
- v1 prioritizes the realtime core path plus management dashboard, not advanced governance features.

## Standard Stack

### Core
| Library / Layer | Version | Purpose | Why Standard Here |
|-----------------|---------|---------|-------------------|
| React | 18.3.1 (repo-pinned) | Doctor-side trigger and result UI | Already established in `frontend/`; no reason to split Phase 4 into another UI stack |
| Vite | 5.4.10 (repo-pinned) | Existing frontend runtime and `/api` proxy | Already configured in [`frontend/vite.config.ts`](/home/healink/ykhl/test-ai/frontend/vite.config.ts) |
| Vitest + Testing Library | 2.1.3 / 16.3.0 (repo-pinned) | Component-level validation | Existing dashboard tests already use this stack |
| Python stdlib HTTP server | repo-local | Thin HTTP API surface | Existing `ThreadingHTTPServer` already fronts the analytics endpoints |
| PostgreSQL semantic layer | repo-local | Persistence, aggregation, and later analytics reuse | Existing Phase 1 semantics already depend on SQL-first modeling |

### Supporting
| Library / Layer | Version | Purpose | When to Use |
|-----------------|---------|---------|-------------|
| Node `pg` bridge | 8.20.0 (repo-pinned) | Existing DB access bridge from Python query service | Reuse for Phase 4 persistence/query helpers if direct Python DB driver is still absent |
| Shared dashboard CSS tokens | existing | Reuse panel, error, and empty-state styling primitives | Extend current style language instead of adding a design system |
| JSON payload contracts | new, repo-local | Stable request/response boundary between EMR host, frontend, and backend | Mandatory because no EMR integration contract exists yet |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extend current React app with an embeddable doctor panel | Build a second standalone frontend | More setup, duplicated tooling, and harder shared styling/testing |
| New POST endpoint on existing Python server | Separate FastAPI/service deployment | Cleaner long-term, but unnecessary platform split for current repo scope |
| Synchronous in-request orchestration with timeout budget | Queue/job-polling workflow | Better for long-running work, but adds infrastructure the repo does not have |
| Persist aggregate flags plus structured detail payload | Store only opaque JSON blobs | Easier initially, but weakens Phase 1 aggregate reuse and future drilldown filters |

**Installation:** No new runtime library is required to research or plan Phase 4. If implementation chooses Python unit tests, add a minimal Python test runner then; the repo currently has no `pytest` installed.

## Architecture Patterns

### Recommended Project Structure
```text
frontend/src/
├── app/
│   ├── dashboard-overview-page.tsx
│   └── doctor-evaluation-page.tsx          # New embeddable doctor-facing shell
├── components/
│   ├── doctor-evaluation-panel.tsx         # Trigger + loading + result state owner
│   ├── evaluation-result-card.tsx          # Structured result sections
│   ├── evaluation-summary-banner.tsx       # Assistive positioning + status
│   └── evaluation-suggestion-list.tsx
├── lib/
│   ├── realtime-evaluation-api.ts
│   ├── realtime-evaluation-contracts.ts
│   └── emr-encounter-contracts.ts
└── styles/
    └── dashboard.css                       # Extend existing tokens; avoid separate CSS stack

src/api/
├── http_dashboard_server.py                # Add POST route dispatch
├── http_realtime_evaluation.py             # JSON body parsing + HTTP mapping
└── evaluation/
    ├── __init__.py
    ├── contracts.py                        # Request / response dataclasses
    ├── orchestration.py                    # Timeout and provider call workflow
    ├── provider.py                         # Swappable evaluator adapter interface
    └── repository.py                       # Persist attempt + result rows

src/domain/analytics/
├── contracts.py                            # Add any rows needed for persistence reuse
└── query_service.py                        # Add persistence or reuse helpers only if shared

sql/
├── migrations/
│   └── 005_phase4_realtime_evaluation.sql  # New source/detail tables or columns
└── tests/
    ├── eval_01_persistence_chain.sql
    └── eval_02_timeout_and_reuse.sql
```

### Pattern 1: EMR Host Supplies Context, Repo Owns Evaluation Workflow
**What:** Treat the EMR as the host that provides encounter/case context, while this repo owns only the trigger UX, evaluation call, persistence, and result rendering.
**When to use:** Always. The repo has no EMR-side read adapter, no auth/session model, and no evidence that direct EMR DB reads are acceptable.
**Example:**
```ts
// Source pattern: frontend fetch wrappers in frontend/src/lib/overview-api.ts
export interface RealtimeEvaluationRequest {
  encounter_id: string;
  case_id: string;
  triggered_by_doctor_id: string;
  encounter_snapshot: {
    chief_complaint?: string;
    history_of_present_illness?: string;
    physical_exam?: string;
    auxiliary_exam?: string;
    diagnoses: Array<{ code?: string; name: string }>;
  };
}
```

### Pattern 2: Persist Attempt First, Then Execute Evaluation
**What:** Create a durable attempt record before the provider call starts, then update it to `success`, `failed`, or `timeout`.
**When to use:** For every evaluation trigger. This is the only reliable way to satisfy `EVAL-04` when the provider call fails or times out.
**Example:**
```python
# Source pattern: thin orchestration over typed layers, matching current src/api split
def run_realtime_evaluation(request: RealtimeEvaluationRequest) -> RealtimeEvaluationResponse:
    evaluation_id = repository.create_attempt(request)
    try:
        result = orchestrate_with_timeout(request, timeout_seconds=10)
    except EvaluationTimeout:
        repository.mark_timeout(evaluation_id)
        return build_timeout_response(evaluation_id)
    except Exception as exc:
        repository.mark_failed(evaluation_id, error_message=str(exc))
        return build_failed_response(evaluation_id)

    repository.mark_success(evaluation_id, result)
    return build_success_response(evaluation_id, result)
```

### Pattern 3: Structured Result Contract, Not Freeform Markdown
**What:** Return a typed JSON payload with explicit sections for completeness, missing diagnoses, rationale, suggestions, and status metadata.
**When to use:** Always. The frontend needs deterministic rendering, and analytics/drilldown will need stable fields later.
**Example:**
```json
{
  "evaluation_id": "eval-20260325-001",
  "status": "success",
  "elapsed_ms": 8420,
  "assistive_notice": "本结果仅用于辅助诊断质量评估，不替代医生临床判断。",
  "basis_completeness": {
    "is_incomplete": true,
    "summary": "现病史与辅助检查依据不足。",
    "missing_items": ["现病史关键症状演变", "相关辅助检查结果"]
  },
  "potential_missing_diagnoses": [
    {
      "name": "妊娠期高血压疾病",
      "confidence_label": "提示关注",
      "reason": "血压记录与主诉提示需要补充排查。"
    }
  ],
  "rationale": [
    "病历中已记录主诉和初步诊断。",
    "缺少支撑当前诊断的关键检查依据。"
  ],
  "suggestions": [
    "补充现病史中的症状持续时间与诱因。",
    "补录已完成但未入病历的辅助检查结果。"
  ]
}
```

### Pattern 4: Reuse Existing Analytics Semantics; Do Not Rewrite Them in Phase 4
**What:** Phase 4 should keep writing `diagnosis_basis_incomplete`, `missing_diagnosis`, `status`, and optional quality-index placeholder semantics in a way Phase 1 aggregates can still consume.
**When to use:** For every persistence design choice.
**Example:** If a detail table is added, keep summary flags in `src_evaluation_events` or `analytics.fact_evaluation_event` and store narrative/detail payload separately.

### Pattern 5: Keep Doctor UI as an Isolated Mount, Not a Router Rewrite
**What:** Add a doctor-side page/panel that can be mounted independently from the existing dashboard entrypoint.
**When to use:** Because current [`frontend/src/main.tsx`](/home/healink/ykhl/test-ai/frontend/src/main.tsx) mounts a single dashboard page and there is no router.
**Example:** Switch on pathname or a bootstrap prop rather than introducing route-wide state or a second frontend toolchain.

### Anti-Patterns to Avoid
- **Provider logic in HTTP handlers:** `http_realtime_evaluation.py` should parse JSON and map HTTP responses only.
- **Frontend-generated clinical language:** Keep assistive notices and result section semantics backend-defined.
- **Blocking analytics refresh inside the doctor request path:** Do not run heavyweight dashboard refresh logic inside the 10-second clinical response path.
- **Treating timeout as “not triggered”:** Persist timeout distinctly so Phase 1/5 analytics remain honest.
- **Using freeform strings as the only persisted result:** Future drilldown needs stable fields, not only unstructured text blobs.

## Recommended Architecture

### Request Flow
1. EMR host opens or mounts the doctor evaluation panel and provides an encounter snapshot.
2. Doctor clicks `诊鉴`.
3. Frontend `POST /api/realtime-evaluation` with encounter identifiers plus normalized note/diagnosis content.
4. Backend creates a durable evaluation attempt row with `status = 'pending'` or equivalent source-stage marker.
5. Backend calls an evaluation provider adapter under a hard timeout budget.
6. Backend updates persistence to `success`, `failed`, or `timeout`, including structured detail payload on success.
7. Backend returns a structured assistive response for immediate rendering.
8. Later analytics reuse reads the persisted summary flags through the existing semantic layer; structured detail remains available for future drilldown.

### Persistence Recommendation

Use a two-layer persistence design:

1. Keep an aggregate-friendly event record that preserves current Phase 1 semantics:
   - `evaluation_id`
   - `encounter_id`
   - `case_id`
   - `triggered_at`
   - `status`
   - `diagnosis_basis_incomplete`
   - `missing_diagnosis`
   - `quality_index_score` (still placeholder-aware)

2. Add a structured detail record keyed by `evaluation_id` for doctor-facing payloads:
   - request snapshot JSONB
   - rationale JSONB/text array
   - suggestions JSONB/text array
   - potential missing diagnoses JSONB
   - provider metadata
   - elapsed milliseconds
   - failure / timeout diagnostic fields

This preserves current dashboard compatibility while enabling future detail reuse.

### Important Current-Repo Assumption

The existing Phase 1 analytics path is batch-oriented around source tables, staging views, and refreshed materialized views. For Phase 4 planning, assume persistence must be durable immediately, but management-dashboard reuse can be eventual unless the user explicitly requires same-request dashboard freshness. If immediate analytics freshness becomes a hard requirement, Plan 3 will need to expand into redesigning the current `mart_case_evaluation` refresh pattern.

## Locked Assumptions Needed For Planning

1. **EMR payload assumption:** The EMR host can pass encounter/case identifiers and the current structured/unstructured note snapshot to this repo at trigger time.
2. **Provider abstraction assumption:** The actual evaluation engine is behind a Python adapter and is not hard-coded into frontend or HTTP layers.
3. **Timeout semantics assumption:** `timeout` is a first-class persisted outcome, not a silent frontend error.
4. **Assistive language assumption:** UI copy and API contract must explicitly state that output is advisory and does not replace clinical judgment.
5. **Eventual analytics assumption:** Persisting the event is in Phase 4 scope; synchronous re-materialization of every dashboard aggregate is not.
6. **No router rewrite assumption:** Doctor-side UI should be mounted with minimal frontend bootstrapping changes.

## Plan Decomposition

### Plan 04-01: Doctor Trigger Entry + Result UI Shell
**Goal:** Deliver the doctor-facing embeddable panel, trigger action, loading state, timeout/error state, and structured result shell.

**Dependencies:** None beyond existing frontend stack. This plan can proceed before provider integration is real by using mocked API responses.

**Recommended files:**
- [`frontend/src/app/doctor-evaluation-page.tsx`](/home/healink/ykhl/test-ai/frontend/src/app/doctor-evaluation-page.tsx)
- [`frontend/src/components/doctor-evaluation-panel.tsx`](/home/healink/ykhl/test-ai/frontend/src/components/doctor-evaluation-panel.tsx)
- [`frontend/src/components/evaluation-result-card.tsx`](/home/healink/ykhl/test-ai/frontend/src/components/evaluation-result-card.tsx)
- [`frontend/src/lib/realtime-evaluation-api.ts`](/home/healink/ykhl/test-ai/frontend/src/lib/realtime-evaluation-api.ts)
- [`frontend/src/lib/realtime-evaluation-contracts.ts`](/home/healink/ykhl/test-ai/frontend/src/lib/realtime-evaluation-contracts.ts)
- [`frontend/src/main.tsx`](/home/healink/ykhl/test-ai/frontend/src/main.tsx)
- [`frontend/src/styles/dashboard.css`](/home/healink/ykhl/test-ai/frontend/src/styles/dashboard.css)

**Planning guidance:**
- Keep this plan UI-complete even if the backend is still mocked.
- Do not tie the UI to dashboard-only terms; it should read like a doctor tool, not management analytics.
- Explicitly render four states: idle, loading, success, terminal error/timeout.
- Keep assistive disclaimer always visible in the result area.

**Validation strategy:**
- Add Vitest component tests for trigger behavior, loading lock, success rendering, timeout rendering, and advisory copy.
- Quick run: `cd frontend && npm test -- --run src/components/__tests__/doctor-evaluation-panel.test.tsx`

### Plan 04-02: Evaluation Orchestration / Timeout / Result Return
**Goal:** Add the POST API, request validation, timeout-controlled provider orchestration, and structured response mapping.

**Dependencies:** Can begin in parallel with 04-01 on contract-first boundaries, but should merge before 04-01 can stop using mocks.

**Recommended files:**
- [`src/api/http_dashboard_server.py`](/home/healink/ykhl/test-ai/src/api/http_dashboard_server.py)
- [`src/api/http_realtime_evaluation.py`](/home/healink/ykhl/test-ai/src/api/http_realtime_evaluation.py)
- [`src/api/evaluation/contracts.py`](/home/healink/ykhl/test-ai/src/api/evaluation/contracts.py)
- [`src/api/evaluation/orchestration.py`](/home/healink/ykhl/test-ai/src/api/evaluation/orchestration.py)
- [`src/api/evaluation/provider.py`](/home/healink/ykhl/test-ai/src/api/evaluation/provider.py)

**Planning guidance:**
- Keep request validation explicit; reject malformed encounter payloads early.
- Use a hard deadline below the UX budget so the frontend can still render a controlled timeout state.
- Return the same structured shape for `success`, `failed`, and `timeout`, varying only `status` and detail fields.
- Keep the provider behind an interface with at least a fake/test implementation.

**Validation strategy:**
- Add Python tests for request parsing, timeout handling, provider exception mapping, and response shape.
- If Python test infrastructure is not added yet, at minimum add a focused smoke script or direct handler tests callable with `python3`.
- Quick run target after test runner exists: `python3 -m pytest tests/api/test_realtime_evaluation.py -q`

### Plan 04-03: Persistence And Analytics Reuse Chain
**Goal:** Persist every attempt and result detail, preserve Phase 1 aggregate semantics, and create the minimal reuse bridge for later stats/drilldown.

**Dependencies:** Depends on 04-02 response/status contract being stable. Should not block 04-01 UI work.

**Recommended files:**
- [`sql/migrations/005_phase4_realtime_evaluation.sql`](/home/healink/ykhl/test-ai/sql/migrations/005_phase4_realtime_evaluation.sql)
- [`sql/tests/eval_01_persistence_chain.sql`](/home/healink/ykhl/test-ai/sql/tests/eval_01_persistence_chain.sql)
- [`sql/tests/eval_02_timeout_and_reuse.sql`](/home/healink/ykhl/test-ai/sql/tests/eval_02_timeout_and_reuse.sql)
- [`sql/tests/run-phase-01.sh`](/home/healink/ykhl/test-ai/sql/tests/run-phase-01.sh)
- [`src/api/evaluation/repository.py`](/home/healink/ykhl/test-ai/src/api/evaluation/repository.py)
- [`src/domain/analytics/query_service.py`](/home/healink/ykhl/test-ai/src/domain/analytics/query_service.py)

**Planning guidance:**
- Preserve `success`, `failed`, and `timeout` semantics already used by Phase 1.
- Persist doctor-facing structured detail separately from aggregate flags.
- Decide explicitly whether Phase 4 writes land in source-stage tables, analytics fact tables, or both; document why.
- Keep plan scope to persistence correctness and reuse readiness, not full Phase 5 drilldown screens.

**Validation strategy:**
- Add SQL assertions proving each attempt is durable and timeout/failed events remain distinct from `not_triggered`.
- Add repository-level tests proving a successful response persists both summary flags and structured detail.
- Quick run: `DATABASE_URL=... sql/tests/run-phase-01.sh eval_01_persistence_chain` after extending the runner.

## Dependency Guidance

- `04-01` and `04-02` can start in parallel if the request/response contract is locked first.
- `04-03` should wait until `04-02` stabilizes `evaluation_id`, status semantics, and result payload shape.
- Merge order should be `04-02` before finalizing `04-01` API wiring, then `04-03`.
- If the user cannot yet define the EMR payload contract, plan `04-01` and `04-02` should include a repo-local fixture payload and keep the host contract isolated to one file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| EMR state management inside this repo | Fake full EMR shell or routing framework | A narrow encounter snapshot contract from host to panel | Keeps scope aligned with actual repo responsibility |
| Frontend-only timeout logic | UI timers that guess backend state | Backend-enforced timeout outcome + frontend display only | Prevents persistence and UI from drifting |
| Narrative-only persistence | Single markdown/text blob | Summary flags + structured detail JSON | Required for later analytics reuse and drilldown |
| Clinical interpretation in JSX | Freeform frontend copy generation | Backend-typed sections and assistive disclaimer | Safer and more consistent |
| Full async job system | Queue + polling + status store | Synchronous request path with strict deadline | Matches current repo infrastructure and 10-second UX target |

**Key insight:** The hard part of Phase 4 is not drawing the result card. It is defining a durable, clinically safe contract that survives timeout/failure and still feeds analytics later.

## Phase-Specific Risks

### Risk 1: No EMR Contract Yet
**What goes wrong:** Planning assumes fields that the EMR host cannot actually pass.
**Why it matters:** `EVAL-01` fails even if the internal UI works.
**Mitigation:** Lock a minimal required payload up front and isolate it in one contract file.

### Risk 2: 10-Second Budget Gets Consumed By Persistence Or Refresh Work
**What goes wrong:** The provider call plus DB writes plus any aggregate refresh exceed the UX budget.
**Why it matters:** Doctors stop trusting or using the feature.
**Mitigation:** Persist attempt quickly, avoid heavyweight refresh work in-band, and budget timeout lower than 10 seconds.

### Risk 3: Success/Failure/Timeout Semantics Drift From Phase 1 Analytics
**What goes wrong:** Doctor-side outcomes no longer map cleanly onto current `success`, `failed`, `timeout`, and `not_triggered` logic.
**Why it matters:** Dashboard counts and later drilldown become misleading.
**Mitigation:** Preserve existing status taxonomy and add tests at the SQL layer.

### Risk 4: Result Language Sounds Like Autonomous Diagnosis
**What goes wrong:** UI labels or response payload imply the system is making final diagnoses.
**Why it matters:** Clinical-safety boundary is breached.
**Mitigation:** Bake advisory language into the response contract and tests.

### Risk 5: Persistence Is Durable But Not Queryable
**What goes wrong:** All results are stored, but only as opaque blobs that cannot support Phase 5 drilldown.
**Why it matters:** `EVAL-04` is technically stored but operationally unusable.
**Mitigation:** Persist both aggregate-friendly flags and structured detail fields.

## File-Level Recommendations

| File | Recommendation |
|------|----------------|
| [`frontend/src/main.tsx`](/home/healink/ykhl/test-ai/frontend/src/main.tsx) | Keep a minimal bootstrap switch; do not convert the app into a full router unless Phase 5 needs it |
| [`frontend/src/lib/overview-api.ts`](/home/healink/ykhl/test-ai/frontend/src/lib/overview-api.ts) | Mirror its fetch-wrapper style when adding realtime POST helpers |
| [`frontend/src/components/overview-section.tsx`](/home/healink/ykhl/test-ai/frontend/src/components/overview-section.tsx) | Mirror its isolated loading/error state pattern for the doctor panel |
| [`src/api/http_dashboard_server.py`](/home/healink/ykhl/test-ai/src/api/http_dashboard_server.py) | Extend with `do_POST`; keep route dispatch thin and JSON-only |
| [`src/api/http_dashboard_overview.py`](/home/healink/ykhl/test-ai/src/api/http_dashboard_overview.py) | Use as the pattern for dedicated request parsing modules; do not inline parsing in the server |
| [`src/domain/analytics/query_service.py`](/home/healink/ykhl/test-ai/src/domain/analytics/query_service.py) | Reuse for shared DB helpers if needed, but keep provider orchestration out of the analytics module |
| [`sql/migrations/001_phase1_foundation.sql`](/home/healink/ykhl/test-ai/sql/migrations/001_phase1_foundation.sql) | Preserve existing event-status semantics; do not overload `not_triggered` to mean timeout/failure |
| [`sql/staging/001_phase1_source_contracts.sql`](/home/healink/ykhl/test-ai/sql/staging/001_phase1_source_contracts.sql) | If Phase 4 writes into source-stage tables, extend the staging view carefully so dedupe rules remain explicit |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.3 + Testing Library for frontend; SQL assertion scripts for data layer; Python test runner not yet installed |
| Config file | [`frontend/vitest.config.ts`](/home/healink/ykhl/test-ai/frontend/vitest.config.ts) |
| Quick run command | `cd frontend && npm test -- --run <test-file>` |
| Full suite command | `cd frontend && npm test` plus targeted SQL script runner |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EVAL-01 | Doctor can trigger evaluation from the EMR-embedded panel | component/integration | `cd frontend && npm test -- --run src/components/__tests__/doctor-evaluation-panel.test.tsx` | ❌ Wave 0 |
| EVAL-02 | API returns structured success/timeout within controlled workflow | Python unit/smoke | `python3 -m pytest tests/api/test_realtime_evaluation.py -q` | ❌ Wave 0 |
| EVAL-03 | Structured result includes rationale and actionable suggestions | component + API contract | `cd frontend && npm test -- --run src/components/__tests__/evaluation-result-card.test.tsx` | ❌ Wave 0 |
| EVAL-04 | Every attempt persists and remains reusable for analytics | SQL + repository | `DATABASE_URL=... sql/tests/run-phase-01.sh eval_01_persistence_chain` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** relevant frontend test file or focused Python/SQL test
- **Per wave merge:** `cd frontend && npm test`
- **Phase gate:** frontend tests plus focused persistence SQL assertions green together

### Wave 0 Gaps
- [ ] Add doctor-side component test files under `frontend/src/components/__tests__/`
- [ ] Decide whether to add `pytest` or keep Python verification as direct handler/unit scripts
- [ ] Extend SQL test runner to support Phase 4 assertion names
- [ ] Create fixture payload(s) that represent the EMR encounter snapshot contract

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | frontend build/tests and Node pg bridge | ✓ | v24.14.0 | — |
| npm | frontend test execution | ✓ | 11.9.0 | — |
| Python 3 | HTTP server and orchestration code | ✓ | 3.12.3 | — |
| PostgreSQL client (`psql`) | SQL assertions | ✓ | 16.13 | — |
| `pytest` | Python automated tests | ✗ | — | Use direct `python3` smoke scripts until installed |
| Running PostgreSQL service | local SQL execution | ✗ at default local socket | `pg_isready` reported no response on 2026-03-25 | Use explicit `DATABASE_URL` to reachable DB |

**Missing dependencies with no fallback:**
- None for planning. Execution will still need a reachable PostgreSQL database via `DATABASE_URL`.

**Missing dependencies with fallback:**
- `pytest` is absent; targeted Python smoke scripts are possible, but proper handler/unit coverage is weaker until a runner is added.

## Open Questions

1. **What exact fields can the EMR host provide at trigger time?**
   - What we know: Phase 4 must be embedded, and the repo does not own the EMR shell.
   - What's unclear: Whether the host can provide raw note text, structured sections, diagnosis list, and doctor identity.
   - Recommendation: Lock a minimal payload before plan generation and isolate optional fields explicitly.

2. **What evaluation engine/provider will the orchestration call?**
   - What we know: PRD expects LLM-backed evaluation, but the repo currently has no provider SDK or service integration.
   - What's unclear: Sync API shape, latency profile, retry rules, and model/provider selection.
   - Recommendation: Plan against a provider interface plus fake implementation; keep real provider wiring inside one adapter plan task.

3. **How fresh must analytics reuse be after a doctor-side evaluation?**
   - What we know: Every evaluation must be persisted for later stats/drilldown reuse.
   - What's unclear: Whether “later” means eventually via refresh job or immediately visible in dashboard queries.
   - Recommendation: Assume eventual reuse for Phase 4 unless the user explicitly upgrades this to synchronous freshness.

## Sources

### Primary (HIGH confidence)
- [`CLAUDE.md`](/home/healink/ykhl/test-ai/CLAUDE.md) - project constraints and workflow directives
- [`PROJECT.md`](/home/healink/ykhl/test-ai/.planning/PROJECT.md) - active product goals, constraints, and stale-greenfield note
- [`ROADMAP.md`](/home/healink/ykhl/test-ai/.planning/ROADMAP.md) - Phase 4 scope, success criteria, and 3-plan split
- [`REQUIREMENTS.md`](/home/healink/ykhl/test-ai/.planning/REQUIREMENTS.md) - `EVAL-01` through `EVAL-04`
- [`STATE.md`](/home/healink/ykhl/test-ai/.planning/STATE.md) - accumulated decisions and current blockers
- [`门诊诊鉴首页-(全栈).md`](/home/healink/ykhl/test-ai/门诊诊鉴首页-(全栈).md) - PRD realtime workflow and safety boundary
- [`frontend/src/main.tsx`](/home/healink/ykhl/test-ai/frontend/src/main.tsx) - current single-entry frontend bootstrap
- [`frontend/src/app/dashboard-overview-page.tsx`](/home/healink/ykhl/test-ai/frontend/src/app/dashboard-overview-page.tsx) - current page-level filter ownership pattern
- [`frontend/src/components/overview-section.tsx`](/home/healink/ykhl/test-ai/frontend/src/components/overview-section.tsx) - section-level loading/error/empty state pattern
- [`frontend/src/lib/overview-api.ts`](/home/healink/ykhl/test-ai/frontend/src/lib/overview-api.ts) - current frontend API wrapper style
- [`src/api/http_dashboard_server.py`](/home/healink/ykhl/test-ai/src/api/http_dashboard_server.py) - current HTTP bridge shape
- [`src/api/http_dashboard_overview.py`](/home/healink/ykhl/test-ai/src/api/http_dashboard_overview.py) - request parsing pattern
- [`src/domain/analytics/query_service.py`](/home/healink/ykhl/test-ai/src/domain/analytics/query_service.py) - current Python/domain boundary
- [`sql/migrations/001_phase1_foundation.sql`](/home/healink/ykhl/test-ai/sql/migrations/001_phase1_foundation.sql) - event fact schema and status semantics
- [`sql/staging/001_phase1_source_contracts.sql`](/home/healink/ykhl/test-ai/sql/staging/001_phase1_source_contracts.sql) - source-stage dedupe and correlation rules
- [`sql/migrations/002_phase1_metrics.sql`](/home/healink/ykhl/test-ai/sql/migrations/002_phase1_metrics.sql) - current aggregate semantics and placeholder handling

### Secondary (MEDIUM confidence)
- [`03-RESEARCH.md`](/home/healink/ykhl/test-ai/.planning/phases/03-quality-distribution-insights/03-RESEARCH.md) - confirms current phase-to-phase architecture pattern
- [`02-RESEARCH.md`](/home/healink/ykhl/test-ai/.planning/phases/02-dashboard-overview/02-RESEARCH.md) - confirms frontend/runtime/testing patterns used in current repo

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - entirely based on the current repo's implemented stack
- Architecture: MEDIUM - repo-native pattern is clear, but EMR host contract and provider adapter remain assumptions
- Pitfalls: HIGH - directly derived from current repo gaps and existing Phase 1 status semantics

**Research date:** 2026-03-25
**Valid until:** 2026-04-24
