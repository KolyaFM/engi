# Guided interval chart implementation plan

> Use superpowers:executing-plans to implement the approved mixed-period mockup inline with regression tests.

**Goal:** A compact shared timeline automatically asks about one band at a time; answers name both object and property, and matched records remain as a legend.

**Architecture:** Keep existing mapping contracts and atomic pair submissions. Newly generated guided bands identify choices by learning target rather than entity, so multiple facts of one entity cannot collide. Each item carries its own property label; properties and goal revisions remain independent. Existing saved interval tasks keep their entity response keys.

**Spec:** User-approved five-event mockup and conversation, 20 October 2026.

## Constraints

- One linear time axis, no handles, knobs, independent stretching or artificial bar widening.
- Up to five ranges, minimum three; try smaller valid groups when geometry cannot fit.
- Names and custom field labels outside chart; property shortName is optional display metadata.
- Pending learning targets only, at most one known support, no FSRS/acquisition credit for contextual bands.
- Wrong answers retain the active band, matched entries persist, completion waits for Continue.
- Chronology may mix entity types and interval property keys. Other matching formats retain their rules.
- Preserve old drafts and contracts; no database migration or progress reset.

## Steps

- [x] RED/GREEN domain tests for mixed properties, two facts of one entity, settings per field, fact response keys, current revisions and atomic result ownership.
- [x] Implement item labels, optional declarative shortName, geometry-compatible grouping and stable sorted chart rows.
- [x] RED/GREEN browser tests for guided answers, wrong retry, five rows, legend, explicit Continue, reload, keyboard, mobile/landscape/desktop and long names.
- [x] Implement compact chart, active year label, one combined answer/legend list and reduced-motion states.
- [x] Verify interval simulations, full tests, build, Chromium/WebKit and real pack analysis; inspect screenshots and update documentation.

## Review focus

- A matching request for a second property on the same entity must not replay or grade the first property's result.
- Displayed year ranges must be recorded as disclosures; context success still cannot resolve exact mistakes.
- Excluded properties and hidden/support records cannot become primary answer buttons.
- A five-row group that is unreadable must fall back to a valid smaller subset without losing the anchor.
- Existing saved tasks still use their persisted response keys after UI replacement.


## Validation — 20 October 2026

- Full regression suite: 507 tests passed (`artifacts/guided-full-tests.log`). Additional per-fact error ownership and legacy-revision assertions: 4/4 passed.
- Production build passed (`artifacts/guided-build-verified.log`).
- Chromium and WebKit: real StudyFeed wrong/right answers, restored completion with explicit Continue; component five/three facts, repeated entity with different fields, axis label spacing at320px, landscape/desktop, keyboard Enter, reduced motion, long custom label.
- Real `periods-demo-v1.engi`: 192-step error scenario and160-step extended scenario passed at2 seconds/action; all remaining errors resolved. A separate400-step simulation finishes all properties.
- Read-only review found a mismatch between clicked entity and asked fact in guided wrong answers. Reproduced in real StudyFeed (save error), fixed to pass the asked entity with the selected answer; regression now checks the exact retry message.
- Ruling: use6px minimum real bar length (not12px) because users no longer tap bars; endpoint labels live outside the plot. Scale geometry is never independently widened.
- Ruling: preserve legacy entity-keyed contract revisions and response keys; new quiz tasks alone use fact target keys. No migration/reset.
- Ruling: quick-play analyzer drains for at least10 simulated minutes, rather than100 steps, so a2-second action rate does not truncate scheduled5-minute confirmations.
