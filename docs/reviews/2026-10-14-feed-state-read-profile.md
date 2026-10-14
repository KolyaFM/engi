# Feed state read profile — 2026-10-14

## Reproduction

Production preview, Chromium mobile 393×852, CPU throttling ×4. The same UI smoke
imports synthetic decks, answers real generated questions, introduces mistakes,
reloads/resumes and deletes shared packs. No tasks or progress are injected.

Use `pnpm build`, set `ENGI_SMOKE_ENTITIES=80`, `ENGI_SMOKE_CPU=4` and
`ENGI_SMOKE_OUTPUT=artifacts/mobile-profile/80`, then `pnpm test:smoke:mobile`.
The default eight-object case remains the CI check. Run profiling sequentially.

## Finding and change

The 80-object deck produces 880 possible directional/skill goals. At the first
question, there are zero persisted goal memories and 22 exposure records. Six
equivalence checks on the actual browser database showed per-goal reads taking
45–69 ms, versus 1–7 ms for indexed range reads of the existing records.

`readGoalStateRows` counts existing state by its IndexedDB key prefix. An empty
range returns correctly aligned missing entries. Sparse catalogs use one range
read and map its records back to the exact requested keys. Small slices of a larger
history retain key lookups, avoiding loading unrelated stored state. Order, missing
entries and duplicate IDs are preserved; nothing caches mutable memory.

The primary lifecycle feed, introduction handling, snapshot and day-plan reads use
this reader. Schema, migrations, FSRS rules, scheduling priorities and legacy feed
adapters are unchanged.

## Before / after

One complete controlled run per version, same 80 objects and CPU ×4:

| Median | Before | After |
| --- | ---: | ---: |
| Answer commit | 140 ms | 103 ms |
| Advance service | 295 ms | 263 ms |
| Choice answer → next visible screen | 923 ms | 745 ms |
| Introduction → next visible screen | 767 ms | 643 ms |
| Reload → deck menu (5 samples) | 524 ms | 429 ms |

Recorded reports: `artifacts/mobile-profile/80-before/report.json` and
`artifacts/mobile-profile/80-after/report.json`. The second before-change run
`80-lookups` contains the exact indexed-read comparison. Both versions observed
the same format counts, and the full UI assertions passed. End-to-end measurements
include browser actionability, feedback animations and image readiness; chronology
timing also includes player actions and one reload. These are diagnostics from this
host, not an iPhone speed guarantee or an enforced CI performance threshold.

## Validation and remaining work

Reader regressions cover sparse/dense catalogs, missing and duplicate IDs, excluding
unrelated history, fresh updates, transactional rollback, a second DB connection,
and measuring the asynchronous fallback until it completes.

Structural catalog computation, repeated proposal generation and selection still
consume time. The optimization reduces database misses; it does not resolve every
source of UI delay. Further changes should use the stage reports and retain scope,
revision, suspension and disclosure invalidation tests.

## Follow-up: transient reverse configuration

`directionConfiguration` synthesizes missing reverse rows with `triagedMemory`.
Each read gives them fresh `triagedAt`, bootstrap metadata and a due date. The old
proposal cache serialized the entire memory row and treated those timestamps as
a structural change, even though `goalCandidates` discards bootstrap and builds
questions rather than schedules.

The cache now excludes `triagedAt` and bootstrap metadata from its configuration
key. It excludes due only when `firstSuccessAt` is absent: `retention` then returns
zero without consulting the card. All other card fields, confusions, recent media,
self-report data, status, content, scope and format remain in the key. Successful
memory retains the complete card. Live selection and final task materialization
still receive the original, unmodified state.

A regression first failed on the old full-row key, then verified reuse without
candidate generation after temporary timestamp changes, while confusion, image
history and successful-memory edits invalidate correctly. Existing coverage also
checks suspension, content edits, scope and materialization variety.

The follow-up full suite passed 467 tests. The 80-object UI scenario also passed,
with the same format counts and 13 candidate-generation calls before and after.
That fixture already persists both directions; it does not exercise synthesized
reverse-row cache misses. Consequently this follow-up makes no general speed claim
from that profile (the run also overlapped the unit simulation suite). The targeted
regression additionally calls the real `directionConfiguration` twice from a
forward-only configuration, observes different generated timestamps, and verifies
the same proposal pool is reused. Report: `artifacts/mobile-profile/80-proposal-cache/report.json`.
