# Study Feed 2.1 Implementation Plan

> **For agentic workers:** Execute inline using superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Implement the newer supplied learning UX specification in the existing Engi application.
**Architecture:** Preserve Dexie v2, stable IDs, pack/backup models and FSRS. Persist incomplete choice attempts in activeSessions, commit one review on completion, and separate presentation into reusable cards.
**Tech Stack:** React, TypeScript, Vite, Dexie, ts-fsrs; Node tests and real-browser Playwright checks.
**Spec:** `docs/superpowers/specs/2026-10-06-study-feed-v2.1.md`

## Global Constraints
- New supplied specification overrides older Research where contradictory.
- No keyboard answers, XP, runtime LLM, accounts or architecture rewrite.
- Recall reveal after 5000 ms; grading only after reveal.
- Choice corrections: no event until correct; first attempt determines review result.
- Failed new pretest never creates an FSRS lapse; later retrieval establishes memory.
- One discrete option contributes at most once per card; one review per task ID.
- All old content, events, memories, v1/v2 packs and backups remain readable.

## Review Focus
- Closing/reopening with unfinished attempts must preserve red options and Recall/timeline state.
- Repeated taps and write failures must never create multiple events or lose the correct result.
- Background tabs and missing images must not consume the recall thinking interval.
- Queued tasks may have stale "new" reasons; encoding must use actual memory existence.
- Pack conflict acceptance must validate the final graph and invalidate only changed fact values.

## Tasks

### 1. Review semantics and persisted interactions
Files: `types.ts`, `engi-db.ts`, `trainer-service.ts`, new `services/review-commit.ts`, `tests/feed.test.ts`.
Interface: answer(input) returns pending state or committed feedback; session.interaction stores attempts/reveal timing/slider/order. Review metadata includes attemptSequence, wrongChoices, attemptCount, firstTryCorrect. Preserve append-only event idempotency.
- [x] Add and run failing acceptance tests for no event on wrong tap, wrong→wrong→correct, pretest, concurrent final taps, resumed attempts and transaction rollback.
- [x] Implement incremental sessions and single review commit; collect all wrong entity options once, no forced-correct Good, delayed repair and self-grade calibration.
- [x] Run service tests and existing storage/migration/backup regression tests.

### 2. Composer and timeline context
Files: `session/composer.ts`, new `questions/timeline.ts`, recipe factory, engine; remove legacy generator/service paths.
Interface: Task.timeline {min,max,initial}; Task.pretest; Memory.selfReport calibration. repairTask carries target + unique wrong options and changes format or uses two-option discrimination.
- [x] Add and run failing tests for shared neutral timeline scale, mixed recall spacing, objective probes, small corpus continuation and stable target IDs.
- [x] Implement context ranges, 10–20% spaced recall heuristic, near-twin cards, safe small-pool cooldown fallback and bounded repair/buffers.
- [x] Move old batch generation out of production, update previous tests to current feed semantics and rerun.

### 3. Mobile cards and feedback
Files: `components/study/StudyFeed.tsx`, new `ChoiceCard.tsx`, `RecallRevealCard.tsx`, `TimelineCard.tsx`, `SortChallengeCard.tsx`, `useStudyPreferences.ts`, CSS.
Interface: card controls call service; Recall reports active elapsed time, pauses hidden/modal/missing image; arrows and compact controls support accessibility.
- [x] Write and run failing browser checks for hidden correct choice, slider release, 5000ms reveal, pre-reveal swipe, threshold gestures, save/reopen and reduced motion.
- [x] Implement in-place choices, 5s auto-reveal, card-following gestures with edge exclusion, explicit timeline confirm and compact markers, transitions, challenge entrance and encoding moments.
- [x] Add optional quiet sound (off), progressive haptics, preload next 4 media; validate phone-width layouts and no keyboard tasks.

### 4. Honest motivation and pack conflicts
Files: new `knowledge/motivation.ts`, progress/dashboard/home, new `ConflictResolver.tsx`, knowledge-service, settings.
Interface: returnHook(snapshot) selects one factual action; resolvePackConflict(table,id,choice) validates and persists user/upstream choice.
- [x] Add and run failing tests for due/new/collection hooks, daily retrieval count, stability milestone deltas and conflict resolution both ways including invalid incoming graph.
- [x] Implement real counters and non-blocking goal/milestone notices, 7/30/90 stability metrics and explicit conflict UI outside feed.
- [x] Verify backup of calibration data and local overrides still restores.

### 5. Regression, review, delivery
- [x] Run pnpm test, pnpm build and browser acceptance checks; fix regressions with reproductions.
- [x] Review all changes against new spec, including saved-session compatibility and graph validation.
- [x] Update README/UPDATE_V2/VALIDATION; package clean source plus rebuilt dist in outputs and concise Russian change report with real-iPhone checklist.

No Git repository exists in this extracted archive; deliver a reviewed ZIP rather than making commits or publishing.

