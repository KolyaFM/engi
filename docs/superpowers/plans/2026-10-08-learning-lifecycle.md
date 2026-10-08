# Learning Lifecycle Implementation Plan

> Use superpowers:executing-plans to implement inline, with a fresh final review.

**Goal:** Object-based daily admission, finite property acquisition and a shared feed/header projection.

**Architecture:** Persist a versioned acquisition ledger in appMeta. Keep goal identities, attempts, exposure tracking and existing FSRS memory. A lifecycle scheduler owns all new-mode admission and selection; bounded legacy sessions remain compatible.

**Spec:** ../specs/2026-10-08-learning-lifecycle-design.md

## Constraints and review focus

- No personal data reset, migration of existing FSRS parameters or history rewriting.
- All first-answer changes are transactional and idempotent, including matching pairs.
- New daily budget counts objects; all accepted properties enter acquisition independently of remaining budget.
- Two fresh eligible successes complete new acquisition; one fresh confirmation for migrated successful Learning. Initial acquisition uses object interleaving without mandatory time gaps; established memory retains exposure protection and FSRS deadlines.
- Preserve separate recognition/recall goals and pending old tasks on resume.
- Test changed content, suspension, backup, midnight, insufficient content and repeated submissions.

## Tasks

- [x] Pure lifecycle: `acquisition.ts` types, key grouping, admission and first-answer transitions; failing then passing unit tests.
- [x] Persistence and migration: `learning-lifecycle-service.ts`, validated versioned appMeta state, initial intro acceptance and projection; regression tests for multi-property object and existing memory.
- [x] Evidence integration: acquisition eligibility separately from FSRS credit in attempts/core, matching and mistake accounting; real final answer initializes new FSRS once, existing memory stays protected.
- [x] Unified lifecycle selection: introductions, acquisition, scheduled reviews, repairs and safe practice; shared object-based projection in trainer and home.
- [x] Service simulations and browser validation: shrinking learning queue, daily limits, errors, finite content, restart/midnight, grouped tasks; full suite and production build.
- [x] Final review, fix verified findings and record results.

## Execution ledger

- User approved the written architecture and requested implementation/testing; proceed inline in the existing checkout to preserve the already-authorized uncommitted feature work. No commit or push requested.
- Existing bounded scheduler stays available for compatibility tests. Normal endless UI adopts the lifecycle; the two modes must not share admission policy.
- Acquisition tracks introduced knowledge, not every property of a known object. Migration accepts existing goal memory, disclosure or legacy target evidence; unshown properties wait for introduction.
- The selected initial skill follows the intro format. If property settings remove that skill, unfinished acquisition adopts an available skill of the same knowledge and resets its success sequence; existing FSRS stays intact.
- Unsafe answer-revealing filler was removed. With no safe work, the next question stays on screen until its actual ten-second disclosure gap expires; the UI unlocks automatically.
- The runtime lifecycle projection uses a separate appMeta key, preserving old bounded day plans. Only an absent daily preference defaults to ten; explicit settings, including zero, are retained.
- Independent review found revision admission, answer disclosure, final non-bijective matching evidence, migration admission and format changes; all findings received reproducing regressions and fixes. Follow-up review found no further blocking errors.
- Final verification: `pnpm test` passed 319/319 (including learning validation); `pnpm build` passed. The existing bundle-size warning remains.
- Browser validation: lifecycle acquisition, automatic unlock and 320px layout passed; the goal UI suite checks counters, daily settings, intro ownership, reload and mistake repair. Matching and recall browser regressions also passed during implementation.
- Simulations: the ten-object plan admitted exactly ten daily objects plus two extras and completed all 24 properties. Three virtual days / 180 screens completed all 12 properties of six objects, held at most three active objects and preserved FSRS during 138 practice screens. Full selection trace: `artifacts/learning-lifecycle-simulation.json`.

## Follow-up: object variety and property counters

- Root cause: selection penalized recent goal IDs only. A sibling property at first-check could outrank another object's confirmation and repeat the same object immediately.
- Ready acquisition/review proposals and safe practice now prioritize objects absent from the last screen, then from the last two screens, before goal progress and format preference. Fact ownership is used even for reverse questions. Error repair retains its separate policy.
- If all eligible work belongs to the last object, another introduction may fill the bounded three-object queue. If no alternative can be admitted or answered, remaining work continues rather than creating a stop screen.
- Header now contains only learning (blue), due repeat (green) and errors (red). Daily new objects remain in the home plan and preference, outside the header.
- Regressions reproduce sibling-first selection with different acquisition stages and an underfilled queue. Counter regression checks two properties of one object with recognition/recall memory: two repeats, one error for the same failed knowledge across skills.
- Follow-up verification: all 322 tests passed; production build passed; lifecycle browser checks (3) and goal UI scenarios (9) passed. Header appearance checked in the captured mobile screenshot.

## Follow-up: seamless initial learning

- User explicitly rejected countdowns and idle screens. The attempted countdown UI was removed; acquisition no longer imposes a ten-second deadline after introductions or answers.
- Selection still rotates objects, admits new objects into a bounded queue, drains errors, and continues through completed knowledge when the available content is exhausted. Old acquisition deadlines are normalized on adoption; saved tasks no longer disable UI through `readyAt`.
- The evidence distinction remains: hints and same-task corrections do not advance acquisition, duplicate submissions do not count twice, two fresh eligible successes complete a property, and only the final actual answer initializes FSRS. Existing FSRS schedules and established-memory exposure restrictions are retained.
- Added an end-to-end service simulation with a frozen clock: 12 properties of six objects complete through continuous answers; each new memory has one FSRS review and a future due date.
- Browser checks cover immediately playable choices without scrolling on six/sixty objects and a CPU slowed fourfold. Recall thinking starts immediately; its five-second answer timer remains part of that mechanic, not a feed waiting period.
- Final verification: 323/323 tests passed; production build passed; acquisition UI, three profiled touch scenarios, nine goal UI scenarios and recall regression passed. After screen attachment, first choices became usable within the first sample or 25 ms; the old ten-second block is absent.
