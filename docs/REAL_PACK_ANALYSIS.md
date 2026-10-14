# Real-pack learning analysis

Run the production importer and trainer against actual `.engi` archives in an isolated Node process:

```powershell
pnpm analyze:packs "C:/path/states.engi" "C:/path/laureates.engi"
```

The runner uses `fake-indexeddb` and an in-memory media cache. It never opens browser databases or rewrites input archives. Archives are validated once, then imported into separate databases for each scenario.

Profiles cover a novice with deliberate mistakes, disabled/declared-known properties, returning after seven days, and extended correct play. Each screen advances simulated time by 20 seconds. Sessions resume every 20 tasks. Error profiles continue for up to 100 correct screens to check whether remaining mistakes can be resolved.

Assertions cover continuous playback, study selection, ambiguous reverse choices, compatible matching groups, group sizes, and practice leaving FSRS memory unchanged. A failed assertion produces a nonzero exit code and saves the trace plus diagnostic state. This is a scheduler diagnostic, not a historical fact check, visual browser test, or wall-clock performance benchmark.

Reports default to `artifacts/real-packs/`. Override with `ENGI_PACK_REPORT_DIR`; restrict profiles with `ENGI_PACK_PROFILES` (comma-separated `novice,partial,returning,extended`). Traces and failure snapshots are intentionally local artifacts. Reproduce a failure with the same profile order: process-wide question caches can affect randomized materialization even when each profile resets its random seed.

## Findings: 2026-10-14

Inputs: `usa-50-states-v3-flags-as-properties.engi` and `nobel-30-laureates-v3-clean.engi`. Both passed import validation. Twelve scenarios exercised 1,737 screens; ten passed, two failed the error-drain assertion. Reports: `artifacts/real-packs-final/summary.json`. The states failure reproduced with diagnostic state in `artifacts/real-packs-repair-sequence/3.json`.

- **Deck starvation:** selecting both decks yielded only states during the first 160 screens. Introduction selects the first eligible canonical object; it does not balance selected decks. This is an application scheduling issue.
- **Repair postponement:** returning profiles for both decks retained one mistake after 100 correct continuation screens. The states reproduction retained the reverse Maine nickname error. Its shared acquisition unit was in confirmation; a later rehearsal disclosed the answer and moved availability forward again. Repair eligibility shares that availability and regular eligible work is also removed from dedicated repair candidates. Remaining mistakes therefore have no demonstrated bounded service time. The failure proves prolonged postponement, not permanent unanswerability.
- **Question text:** neither archive supplies reverse prompt templates. Generic inverse wording is the documented fallback, not lost import data.
- **Passed checks:** disabled and declared-known properties stayed out of graded work; matching did not mix entity groups; ordering used 3–5 items; conveyors used 3–6; reverse distractors did not contain another correct owner; practice did not change FSRS memory.

## Scheduler changes

Ready mistakes no longer disappear from repair selection merely because the same knowledge is also eligible for ordinary training. They retain the existing spacing between attempts and disclosure exclusions. When the exact memory is already due, the selected check is an ordinary review and can update FSRS; an additional correction before that deadline remains a repair and preserves future scheduling. Ordinary reviews of the last object yield to the regular variety selector when other learning is available. Same-screen correction still cannot count as a new independent answer.

New introductions choose the available selected deck least recently introduced. This uses existing persisted introduction order, survives session replacement, and requires no new stored schedule or database migration. Shared objects update all their member decks; exhausted decks fall out naturally. Newly enabled properties of an existing object retain their introduction priority. Membership and recency maps are built in linear passes rather than comparisons scanning deck members repeatedly.

`tests/feed-repair-admission.test.ts` checks reverse repair priority, disclosure exclusions, due versus future review rights, alternating decks, selection boundaries, and continuation after a smaller deck is exhausted. Existing integration tests also verify that a mature review can leave Relearning, while an early repair never reschedules future memory.

Replacement goal sessions carry the last three completed presentations from the previous active session. Ordinary ranking uses that completed history instead of the next preselected, unseen question. This avoids another immediate object repeat at the beginning of a visit without new metadata, counters, or migrations. Repairs prefer the selected format when that knowledge supports it; existing alternative-format fallback remains available for undersized scopes and diagnostic-only sessions.

## Pack regression results

The corrected selection passed all twelve profiles (1,357 screens; `artifacts/real-packs-fixed-final/summary.json`). Every deliberate error was resolved by correct continuation. Remaining errors after normal play needed 0–3 additional screens, rather than the previous failing 100-screen drains. These are seeded synthetic answer scenarios, not equivalent human retention measurements.

In the 160-screen two-deck run, introductions split equally: nine states and nine laureates, versus twenty-one states and no laureates previously. A separate rerun of all three returning combinations also passed (`artifacts/real-packs-fixed-due-variety/summary.json`).

Final verification: `pnpm test` passed all 474 tests, including the 21-day service simulations with no avoidable learning-object repeats and the 30-day lifecycle model. `pnpm build` passed. Full test output: `artifacts/feed-repair-complete-tests.log`. No browser UI or historical content accuracy claim is made by these scheduler checks.

## Random new objects

Within the next eligible deck group, new introductions now sample uniformly from distinct unseen objects. Multiple properties and question directions do not increase an object's selection probability. Existing-object introductions for newly enabled properties keep priority. The selected introduction is stored in the session, so resuming does not draw another object.
