# Unified Study Scheduling Implementation Plan

**Goal:** Continue error repair seamlessly while preserving FSRS schedules and daily admission.
**Architecture:** Persist mistake episodes independently; contracts distinguish learning, repair and practice. One selection policy chooses admitted learning and repair candidates and drains repairs before stopping.
**Tech Stack:** TypeScript, React, Dexie, node:test, Playwright.
**Spec:** ../specs/2026-10-08-unified-study-scheduling.md

- [x] Add failing integration cases for immediate repair, first-answer correction, hints, persistence and unchanged memory/budget.
- [x] Add contract intent and separate repair eligibility; preserve legacy contract compatibility.
- [x] Add versioned mistake episode service, one-time migration, atomic outcomes and scope projections.
- [x] Share interleaving/draining selection between regular and diagnostic generation, with fresh task IDs.
- [x] Connect scoped ready counts and repair feedback; remove error waiting behavior; refresh older stopped sessions.
- [x] Run full tests/build and browser scenarios for draining multiple errors and resuming saved progress.

Constraints: preserve FSRS intervals, immutable contracts, backup compatibility and request idempotency. Hints and correction within the same task cannot close an episode. Unavailable content must not create an endless retry loop.
