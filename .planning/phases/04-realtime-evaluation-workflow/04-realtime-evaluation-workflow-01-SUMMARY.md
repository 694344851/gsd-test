---
phase: 04-realtime-evaluation-workflow
plan: 01
subsystem: ui
tags: [react, vite, vitest, emr-embed, realtime-evaluation]
requires:
  - phase: 01-data-foundation
    provides: "Phase 1 locked evaluation status semantics and analytics-safe field names reused by the frontend contracts"
provides:
  - "Doctor-side EMR embedding contract and mount seam"
  - "Host-driven realtime evaluation shell with a single 诊鉴 trigger"
  - "Structured assistive result components with loading, success, timeout, and error states"
affects: [04-02, 04-03, doctor-emr-integration]
tech-stack:
  added: []
  patterns: ["Host-mounted React page without router ownership", "Injected onRunEvaluation request boundary for frontend-only workflow"]
key-files:
  created:
    - frontend/src/lib/emr-encounter-contracts.ts
    - frontend/src/lib/realtime-evaluation-contracts.ts
    - frontend/src/lib/doctor-evaluation-embed.tsx
    - frontend/src/components/doctor-evaluation-panel.tsx
    - frontend/src/components/evaluation-result-card.tsx
    - frontend/src/components/evaluation-summary-banner.tsx
    - frontend/src/components/evaluation-suggestion-list.tsx
    - frontend/src/components/__tests__/doctor-evaluation-panel.test.tsx
  modified:
    - frontend/src/app/doctor-evaluation-page.tsx
    - frontend/src/app/__tests__/doctor-evaluation-page.test.tsx
    - .gitignore
key-decisions:
  - "Doctor-side realtime UI stays host-mounted through mountDoctorEvaluationEmbed instead of taking router ownership."
  - "The panel owns visual state locally but delegates execution to an injected onRunEvaluation(request) boundary."
patterns-established:
  - "Assistive notice remains visible in every doctor-facing module state to preserve the clinical safety boundary."
  - "Realtime result rendering is contract-shaped: completeness, potential missing diagnoses, rationale, and suggestions each get fixed sections."
requirements-completed: [EVAL-01, EVAL-03]
duration: 7min
completed: 2026-03-25
---

# Phase 04 Plan 01: Realtime Evaluation Workflow Summary

**Embeddable doctor-side诊鉴 shell with typed EMR contracts, injected evaluation boundary, and fixed-state assistive result rendering**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-25T09:21:00Z
- **Completed:** 2026-03-25T09:28:10Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Added a typed EMR encounter payload contract, realtime request/response contracts, and a host mount seam for embedding inside the medical-record screen.
- Replaced the placeholder trigger area with a doctor evaluation panel that exposes loading, success, timeout, and error containers behind an injected callback boundary.
- Added Vitest coverage for shell mounting, normalized request generation, duplicate-submit lockout, and structured result/state rendering.

## Task Commits

Each task was committed atomically:

1. **Task 1: Establish doctor-side contracts and embeddable page shell** - `ca9f690` (feat)
2. **Task 2: Implement trigger/result components and user-visible module states** - `a134967` (feat)
3. **Generated artifact cleanup** - `e3ea841` (chore)

## Files Created/Modified
- `frontend/src/lib/emr-encounter-contracts.ts` - Defines the host-supplied patient, doctor, section, and diagnosis payload.
- `frontend/src/lib/realtime-evaluation-contracts.ts` - Locks the snake_case realtime request/response shape for later API wiring.
- `frontend/src/lib/doctor-evaluation-embed.tsx` - Exposes `mountDoctorEvaluationEmbed(container, props)` for EMR host integration.
- `frontend/src/app/doctor-evaluation-page.tsx` - Renders the doctor shell from supplied encounter context and delegates execution to the injected callback.
- `frontend/src/components/doctor-evaluation-panel.tsx` - Owns trigger interaction and renders all four user-visible module states.
- `frontend/src/components/evaluation-result-card.tsx` - Provides fixed result section containers.
- `frontend/src/components/evaluation-summary-banner.tsx` - Centralizes assistive status copy for loading/success/timeout/error.
- `frontend/src/components/evaluation-suggestion-list.tsx` - Renders deterministic rationale/suggestion/missing-item lists.
- `frontend/src/app/__tests__/doctor-evaluation-page.test.tsx` - Verifies host-supplied encounter context mounts with a visible 诊鉴 entry.
- `frontend/src/components/__tests__/doctor-evaluation-panel.test.tsx` - Verifies trigger interaction, request mapping, state transitions, and result rendering.
- `.gitignore` - Ignores generated frontend build output from verification.

## Decisions Made
- Kept the doctor page embeddable and host-driven rather than adding router ownership, because the EMR is the shell and this repo only owns the injected panel.
- Put execution behind `onRunEvaluation(request)` so 04-02 can wire the POST client without reworking UI state ownership or tests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Verification generated `frontend/dist/` as an untracked artifact, so `.gitignore` was updated and committed separately to keep the worktree clean for parallel execution.

## User Setup Required

None - no external service configuration required.

## Known Stubs

- `frontend/src/app/doctor-evaluation-page.tsx`: fallback `defaultRunEvaluation()` intentionally returns a failed placeholder response when the host has not injected `onRunEvaluation`. This preserves the UI contract for 04-01 while 04-02 wires the real POST client.

## Next Phase Readiness
- 04-02 can now implement the real POST client and timeout mapping against the locked request/response contracts without changing the doctor-facing component structure.
- 04-03 can persist `evaluation_id`, status, and structured detail sections using the same frontend contract shape.

## Self-Check

PASSED

---
*Phase: 04-realtime-evaluation-workflow*
*Completed: 2026-03-25*
