# Statistics implementation

Spec: ../specs/2026-10-13-statistics-design.md

1. Add a pure property-level statistics projection. Test deduplication, first scheduled answers, acquisition, known properties, migration baselines, shared decks and day boundaries.
2. Load complete persisted review history in bounded pages on the statistics screen only. Include pending first-answer receipts. Cache unchanged history; never generate study questions here.
3. Replace the dashboard with the approved warm/lavender layout: mastery, growth, daily results, activity and deck progress. Add date/deck filters and concise drill-downs.
4. Check regression tests, full suite, build and mobile/desktop browser behavior.

Progress: started in the existing codex/deck-properties-and-design checkout; preserve previous changes.
Ruling: use a cached read-only projection rather than adding writes to the answer transaction. This keeps statistics isolated from the performance-sensitive feed. Rebuild full history once per browser lifetime or after history changes; reopening an unchanged screen reuses it.
Ruling: legacy progress without reliable completion dates is an opening baseline, never today's growth. Do not fabricate historical points.

Completed: property-level projection, paged full-history loader, read-only cache and dashboard with filters/drill-downs. Cache invalidates on review history, pending receipts, lifecycle and mistake-ledger writes; reset regression passes.
Review: fixed legacy target-ID mapping, dialog focus restoration and short-history comparison gating.
Validation: pnpm test — 443 passed; pnpm build passed; statistics-browser.mjs passed empty state, two real packs, filters, calendar, chart, gallery, focus restoration and 320/393/1365px layouts. Screenshots: artifacts/statistics-393.png and artifacts/statistics-1365.png.
Remaining design extension: comparison between two 30-day retention periods is not displayed; the current screen exposes first-answer accuracy and daily personal growth comparison. No invented values are shown for incomplete history.
