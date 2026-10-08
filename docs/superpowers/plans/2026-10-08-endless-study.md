# Endless Study Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep the normal study feed playable after scheduled work ends, while preserving honest memory accounting.

**Architecture:** Keep the tested bounded scheduler as the scheduling core. A session orchestrator adds transactional single-goal admission and persisted practice rounds; practice uses existing contracts. UI starts endless sessions, while service callers can explicitly retain bounded sessions.

**Tech Stack:** React, strict TypeScript, Dexie, ts-fsrs, node:test, Playwright.

**Spec:** ../specs/2026-10-08-endless-study.md

## Global constraints

- Preserve user preferences, backup and FSRS intervals.
- Three unresolved initial failures hold admission; successful first checks do not occupy admission while awaiting FSRS. Practice uses six-task rounds and three focused knowledge keys.
- Scope and format remain enforced; zero means no automatic new admission.
- Practice never earns independent credit; only fresh repair can resolve its error.

## Review focus

- Protected answers may be disclosed indirectly through another format or grouped task.
- Failed materialization must not repeatedly inflate extra budget.
- Day rollover, reload and old sessions must not lose valid pending tasks.
- A narrow pool must remain playable without forged memory improvements.
- Practice failure and correction must create one error, without scheduling FSRS twice.

## Tasks

- [x] Add regression tests for fixed learning capacity, extra admission, endless practice and protected checks.
- [x] Implement persisted round state and the endless orchestrator in src/services/endless-study-service.ts; integrate via optional SessionRow.endless.
- [x] Track first practice failures in the existing mistake ledger, without FSRS credit.
- [x] Start and resume endless sessions from App; explain game mode without adding stop screens.
- [x] Add bounded long-play simulations and browser coverage; run tests/build and review the final change.

## Execution ledger

- Ruling: retain existing goal-based daily accounting and current user preferences; changing the unit or overwriting limits would silently reinterpret saved progress.
- Ruling: implement the existing question formats first; novel comparison games require content-specific validation and are not needed to make the feed continuous.
- Additional admission grants one goal when the daily work runs out. The original six-screen spacing was removed after tracing showed that it produced unnecessary correct-answer repetition.
- Nine real-service regressions cover continuous games, protected checks, one-at-a-time extra admission, failed-admission rollback, practice errors, seven virtual days / 168 screens, midnight resume and answer, bounded-session compatibility and practice across skills.
- Fresh final review found two admission-cap bugs. Both reproduced RED and fixed GREEN: rollover discarded pending tasks; endless capacity leaked into bounded sessions. Selection and answer now synchronize the capacity with their owning session.
- Existing goal browser suite: 9/9 passed. Matching and recall browser suites passed. TypeScript and production/PWA build passed.
- Normal UI continues automatically; unsupported/empty content still uses the existing actionable screen. No migration or reset was performed.
- Final verification: pnpm test 294/294 (including existing 154 virtual-day service traces and the new seven-day endless run); pnpm build succeeded; goal browser 9/9, matching browser and recall browser succeeded; git diff --check clean.
- Work remains in the current checkout for the user to try. No commit, push or merge was requested or performed.
- Follow-up admission fix: separate unresolved initial failures from the full FSRS Learning workload; retain pending tasks when converting saved bounded sessions. Regression cases were reproduced failing before implementation.
- Follow-up verification: 302/302 tests passed, production/PWA build passed, goal browser suite 9/9 and recall browser suite passed. In seeded 80-screen all-correct traces, daily limits 5/10 produced 21/23 independent checks and 21/23 distinct question objects instead of the previous 3 checks and 4/5 objects.
