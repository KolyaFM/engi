# Chronology cards and shared practice header

- The approved cards-on-an-axis design is implemented for names and image cues. Images use contain, retain aspect ratio, and support enlarged viewing. A pointer drag moves the entire card; fixed rank numbers and the axis do not move. Keyboard arrows remain available without visible arrow controls.
- Exact slot grading is shared by the presentation and assessment. New order contracts carry `grading: position`; previously persisted contracts retain their original interpretation, preserving contract immutability. Equal years are excluded by existing strict-order generation.
- Correct slots are locked after checking. Other cards move through the remaining slots. All years appear only after the full order is correct. The player explicitly continues; no automatic success transition hides the revealed dates.
- `sortOrder` and optional `sortCheckedOrder` in the session interaction preserve movement, feedback and correction through reload. The initial review/attempt is immutable. Local corrections update the interaction only and do not add reviews, grant memory credit or close error episodes.
- The `order-reveal` visibility phase records exact-date disclosures on completion. New sort feedback claims are conditional on that phase, so an incorrect rank check does not falsely claim the years were displayed. No database schema migration or content-pack format change is required.
- Practice counters use the same blue/green/red rounded badges across formats, with accessible labels and an explanation popover. Counts still refer to learning properties. Practice uses the introductory card palette and the slogan footer is removed from both practice and the application shell.

Validation: full suite passed 373 tests before the last small refinements; targeted final suite passed 20 tests including the additional image-cue regression. Build passed. Browser scripts cover absolute feedback, fixed slots, keyboard and pointer drag, full image display, enlarged preview, correction reload, hidden/revealed dates, no automatic exit, no duplicate review, 320px layout, counters and footer removal. `tests/chronology-design-browser.mjs` produces before/error/completion screenshots in `artifacts/` and uses only an isolated browser profile.

## Drag interaction refinement

Dragging now uses a viewport overlay, while neighbouring movable cards animate into the preview positions before release. The overlay settles into its destination on release; Escape and pointer cancellation restore the original order. Rank markers and green slots stay fixed. The optional `sortDirtySlots` interaction field keeps edited incorrect slots neutral until the next check, including after reload and when a card is moved back. Neither preview movement nor correction creates extra memory evidence. The browser regression additionally checks live transforms, overlay lifetime, neutral feedback, cancellation and touch events.

References: https://dndkit.com/legacy/api-documentation/draggable/drag-overlay/ and https://design.gitlab.com/patterns/drag-and-drop/.
