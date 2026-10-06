# Validation — Engi 2.0

Automated: `pnpm test` passes 1575 generated task checks and 18 persistence/safety tests. `pnpm build` passes TypeScript, Vite and Workbox generation.

Test coverage: non-destructive Dexie v1→v2 migration with old memory IDs/events/media/packs; custom type/property/relation generation; ambiguity and insufficient distractors; rename/label vs fact-value invalidation; archive history; v1/v2 packs; local overrides against upstream updates; user knowledge/image backup plus v1 restore; target cooldown and challenge spacing; double-submit idempotency; retry scheduling and FSRS suppression; continuous feed beyond 20 answers.

Real browser and iPhone acceptance is pending; no browser was available in the execution environment. Worker extraction, service-worker lifecycle, pointer gestures, offline operation and rendering have not been verified on actual Safari. See UPDATE_V2.md for the concrete checklist. Build is suitable for user acceptance testing, not a claim of completed device acceptance.
