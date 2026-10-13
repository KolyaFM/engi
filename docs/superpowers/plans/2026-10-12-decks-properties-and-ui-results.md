# Implementation record

Plan: `2026-10-12-decks-properties-and-ui.md`.

Implemented the shared deck-property catalog, personal settings, selected learning scope, episode-specific introductions, indexed property counters, property-selection sheet and deck-screen design.

## Decisions

- Kept existing work in the current checkout on `codex/deck-properties-and-design`; a clean worktree would omit the preceding swipe and chronology improvements. No commits, merge or publication requested.
- Reused canonical target eligibility rather than inventing property rules. The catalog stores target IDs; acquisition keys remain derived by the existing progress model, avoiding a second knowledge identity scheme.
- Kept nonlearnable reference facts visible on initial introductions and recorded their actual disclosure; hidden learnable properties are neither shown nor registered as exposed.
- Settings changes retire pending presentations without grading them. Introduction receipts identify individual episodes, with a target-set fallback for older callers.
- Preserved exclusions for temporarily unavailable properties. New permissible properties default to enabled after personal customization.
- Used the existing G2 infrastructure and explicit surface control for the sheet action. Round icons and switch thumbs retain circular geometry.

## Validation

- New regression tests cover defaults, arbitrary property IDs, image identity versus image facts, overlapping decks, disabled content, restored backups, independent introductions, known properties, daily budget and matching feed counters.
- `pnpm test`: 422 tests passed; learning precheck also generated and checked 810 questions.
- `pnpm build`: passed. Existing bundle-size advisory remains.
- `tests/deck-property-browser.mjs`: passed draft cancellation, focus restoration/trapping, failed save with retained draft, persistence, empty scope, scoped introduction, navigation and responsive panels.
- A 45-property list fits the 320×568 viewport with an independently scrolling body and fixed action.
- Twenty draft toggles caused zero snapshot reloads. Measurements are stored locally in `artifacts/deck-property-performance.json`.
- `tests/decks-home-browser.mjs`: passed stable selection, navigation, narrow layout, G2 fallback and scoped start/resume.
- Chronology layout and matching browser checks passed, including 320px layouts, keyboard input, restart and automatic advancement.
- Final independent review identified exclusion persistence, modal focus during saving and quadratic counter lookups; all were addressed.

Snapshots and test outputs are local artifacts under `artifacts/`, not imported user data.
