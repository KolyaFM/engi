# Completing a new card

The preceding optimization measured selection → intro appearance. It did not
measure the full Done click → next usable screen path. This follow-up covers that
separate path and removes the requested “Сохраняем выбор…” status text.

Confirmed duplicate work in `completeIntro → selectNext`:

- two full bundle reads;
- two full configuration reads;
- two catalog lookups/clones;
- lifecycle reconciliation immediately after accepting into that same lifecycle.

The accepting write transaction now passes its bundle, settings, normalized
configuration, catalog, and accepted ledger into selection. This is transaction
reuse, not a cache of progress. Existing callers still read fresh state normally.
Normalization happens after familiarity choices are written, including legacy
filtering and forward/reverse suspension rules. The same configuration is used
for acceptance and selection; synthesized directions are persisted as before.

Incoming normal-task media now warms as soon as selection returns, like intro
media. Counter refresh waits for a rendered incoming task and its first animation
frame instead of opening a write transaction ahead of task readiness. Errors and
explicit counter refresh actions retain their existing paths.

## Verification

`intro-presentation.test.ts` asserts one bundle read, one configuration read, and
one catalog lookup for a real intro completion, alongside scoped properties,
restoration and snapshot isolation checks. Existing transaction rollback,
idempotency, exposure episode ownership and suspended-property checks remain.

`node tests/intro-done-browser.mjs` mounts the real feed with 500 numeric facts and
clicks Done twice, verifies exactly one completion, checks absence of the removed
status, and delays feedback loading to assert counters wait for incoming task
readiness. Optional `ENGI_PERF_PACKS` accepts comma-separated archive basenames
served from artifacts; `ENGI_PERF_CPU` controls Chromium CPU slowdown. Every run
uses isolated browser storage.

Three real packs were also probed (states, presidents, artists). Their baseline
service-only Done handler took roughly 64–98 ms on this computer; at CPU×4 the UI
transition still takes hundreds of milliseconds. Samples varied under concurrent
test load, so no universal speedup or iPhone latency claim is made. Cold proposal
generation, image decoding and the slide-in animation remain distinct costs.

The final isolated Done browser checks passed: ~83/132 ms for the two numeric
transitions and ~114/176 ms with all three real packs loaded. These include an
intentional 30 ms feedback-read delay in the regression test and measure visible
readiness, not the end of the 280 ms entry animation. They are samples, not percentiles.
Full regression run: 560 passed; final focused snapshot/state/settings tests:
26 passed; production build and mobile gesture browser suite passed.
