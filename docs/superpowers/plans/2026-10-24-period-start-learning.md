# Period-start learning

Approved behavior: a pack can name/enable the start of an exact period as a
learnable date, available to questions and mixed chronology, without an extra
introduction row or duplicate stored fact. Initial implementation covers years
derived from exact range bounds; approximate dates and ambiguous multiple periods
must not silently become exact knowledge.

Implementation:
1. Add opt-in `learning.periodStart: {name, question?, sort?}` to property import
   and internal validation. Preserve it on compatible pack reimport.
2. Keep source fact IDs. Add an item/recipe date-edge marker, stable derived
   knowledge-unit ID, and independent `period-start-year` goal precision/revision.
   Generate forward questions and ordering from the exact start year.
3. Full-range disclosures reveal start goals; start-only disclosures reveal only
   start goals. Keep start memory, counters/statistics and period memory distinct.
4. Mix compatible exact-date and start-date goals in contextual chronology, with
   per-item date labels. Honor selected properties and excluded/untrusted facts.
5. Intro uses the original period once and applies its familiarity choice to all
   its goals. New derived knowledge never adds a duplicate source row.
6. Test schema/import/reimport, generation, exposure/evidence, source edits,
   selection and mixed chronology, introduction UI, settings, full build/suite.

No database migration or persisted duplicate fact. Existing packs stay opt-in.

Implemented and verified:
- Full `pnpm test`: 577 passed, 0 failed (including 13 period-start regressions).
- `pnpm build`: passed.
- `node tests/period-start-browser.mjs`: mobile 393×852 and desktop 1440×900;
  original range appears once, familiarity applies to both targets, five mixed
  dates/starts fit with per-item labels, text/images sort and reveal correct years.
- Sample archive built from `examples/period-starts` into the ignored
  `artifacts/period-starts-test.engi`; examples are explicitly synthetic.
- Independent review caught and verified repairs for inherited source exclusions
  and categorization when sorting is disabled. No outstanding important findings.
