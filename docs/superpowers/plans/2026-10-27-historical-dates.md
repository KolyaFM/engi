# Historical years and periods

Authorized: implement BCE and cross-era dates; unspecified era is CE and existing
packs and progress remain compatible. No zero year appears in the interface.

Pack v3 keeps existing date syntax and adds `{year:44,era:"BCE"}`; era is optional
and defaults to CE for each point, including each range endpoint. First release
supports BCE at year precision; finer BCE dates are rejected explicitly.

Keep existing CE storage and semantic revisions byte-compatible. Add optional
era metadata on fact boundaries, stored only for BCE. A central date module
provides validation, chronological order, year coordinates and formatting.
Astronomical year coordinates are computed (1 BCE = 0), never shown as dates.
Historical facts never reuse scheduling timestamps as their date representation.

Update import/overlap/conflict detection, fact fingerprints, derived starts,
exact choices and nearby distractors, ordering, period groups and endpoints,
all visible year labels, and backup round trips. BCE-containing backups use a
new version so older apps cannot silently discard era metadata.

Verify: legacy CE identities, early CE years, BCE-only/cross-era/single-year
periods, wrong-order and zero rejection, approximate precision, no zero labels,
matching and contextual chronology evidence, import updates and backups, mobile
and desktop rendering, full tests/build, independent review.

Completed verification:
- Full `pnpm test`: 599 passed, 0 failed.
- `pnpm build`: passed.
- Historical date regression suite: 13 passed, including legacy CE identity,
  BCE import/export, invalid era/precision, chronological ordering and backups.
- Chromium and WebKit: mobile and desktop, BCE-only and cross-era charts.
- Independent review confirmed legacy-format guards and year-endpoint validation;
  no remaining important defects found in reviewed paths.
- Synthetic test pack: `examples/historical-periods/bundle.json`.
