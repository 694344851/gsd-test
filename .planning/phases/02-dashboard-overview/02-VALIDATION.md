---
phase: 2
slug: dashboard-overview
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none yet — Wave 0 or first UI plan establishes frontend test/runtime toolchain |
| **Config file** | none yet |
| **Quick run command** | `unavailable until frontend shell exists` |
| **Full suite command** | `unavailable until frontend shell exists` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run the smallest relevant static/component verification available for that task
- **After every plan wave:** Run all available Phase 2 UI assertions plus the smallest chart/formatter smoke path
- **Before `$gsd-verify-work`:** Full Phase 2 suite must be green
- **Max feedback latency:** 25 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | DASH-02 | bootstrap/static | `frontend shell static verification` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | DASH-02 | component/integration | `frontend test for toolbar range switching` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | DASH-03 | component | `frontend test for card formatting` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 2 | DASH-04 | component/snapshot | `frontend test for five-card render` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 3 | TREN-01,TREN-02 | component/integration | `frontend test for chart grain switching and series wiring` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 3 | TREN-03 | interaction | `frontend test for tooltip formatter` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/` app shell / package manager decision
- [ ] test runner decision for dashboard UI
- [ ] shared formatter helpers for numbers, deltas, and `N/A`
- [ ] chart option builder with verifiable series / axis contract

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 首屏信息扫描顺序符合 UI-SPEC | DASH-04 | 视觉焦点与信息层级仍需人工确认 | 打开首页后确认“五张概览卡摘要带”先于趋势图成为首屏视觉焦点 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
