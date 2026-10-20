# Practice feed rotation implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline on main; the user explicitly requested this branch.

**Goal:** Prevent consecutive repetitions when another playable knowledge exists, and allow waiting acquisition goals in practice without indefinitely postponing every independent confirmation.

**Architecture:** Keep canonical property identity, existing acquisition/FSRS eligibility and exposure accounting. Select one pending property with the nearest independent deadline as the practice reserve. Compare actual task disclosures against that reserve. Recent knowledge is a presentation exclusion while a valid alternative can be built, with a fallback for truly single-question content.

**Tech Stack:** TypeScript, Dexie/fake-indexeddb, node:test, existing browser smoke scripts.

**Spec:** User-approved design in this conversation: ready checks, new introductions, then varied practice; reserve the closest check; practice earns no synthetic memory credit.

## Constraints
- Work directly in main; no new branch or worktree.
- No persistence, import schema, FSRS or acquisition-credit changes.
- Reserve by canonical property rather than direction or presentation alias.
- Never use unseen, suspended or outside-selection knowledge as graded filler.
- No timers or waiting screens in the UI.

## Tasks
- [x] Convert repeated-question diagnostics into failing regressions; include correct answers and same-screen corrections.
- [x] Add bounded selection policy for recent properties and nearest pending reserve; integrate with lifecycle checks, repairs and practice.
- [x] Verify the reserve becomes a real independent check, practice leaves memory unchanged, and sparse content stays playable.
- [x] Run feed/acquisition/interval regressions, full test suite, build and mobile smoke. Fix actual failures before completion.
- [x] Review diff and commit in main, excluding generated reports.
