# Repeated timed recall during waiting practice

## Reproduction

The previous frequency cap still allowed repeated successful self-reports to be
used as fallback practice. These tasks have `intent: practice` / `reason: game`:
they do not advance the pending confirmation, so successful answers do not remove
them from the fallback pool. A rolling twenty-screen cap merely spaces that loop.

The longer portrait test produced twelve timed recalls in 120 two-second screens,
with every answer correct and all confirmation deadlines still in the future.
The earlier twenty-four-screen test checked only frequency and close returns;
it accepted two recalls and therefore missed the continuing loop.

The user confirmed a single-card timer with “Вспомнил / Не вспомнил” on
`http://localhost:5173/engi/`. Reading that server's module confirmed the previous
cap was already served locally; GitHub publication was not this case's cause.

## Fix

Exclude timed recall from the generic fallback practice pool in mixed mode.
Actual due work and the initial, one-off learning rehearsal still use their own
eligible pools. Explicit recall-only practice retains its requested format. No
FSRS or grading behavior is changed to make filler look like learned knowledge.

An unsubmitted filler already queued by the old policy is retired when resuming
mixed learning. Retirement skips its open attempt and selects current work without
an answer event or completion increment. Submitted answers, actual learning
rehearsals, due work and repairs retain their existing handling.

The ordinary home Start button also reused any same-deck session, including a
legacy recall-only or practice session. Those modes bypass mixed scheduling or
admission intentionally. Home now resumes only daily mixed learning; other modes
use its existing start-new-daily-mixed path. Explicit recall APIs remain explicit.

## Evidence

- Extended `recall-frequency-diagnostics.test.ts` from 24 to 120 fast screens for
  3, 4, 6 and 12 portraits plus choice-only control: zero timed filler, all objects
  remain usable, no invented FSRS memory. The test failed with twelve recalls
  before the pool fix.
- Stale-session regression failed before the resume fix, then passed: an old
  unsubmitted filler is replaced without a review event; a submitted answer keeps
  its task and submitted result.
- `recall-waiting-browser.mjs` imports the real supplied presidents archive in an
  isolated Chromium profile, admits four illustrated objects, and performs 120
  correct practice screens with resumes and new visits. No timed filler appears
  and memory remains unchanged. It also tests an obsolete queued filler and then
  mounts the real StudyFeed, waits for the explicit timer, clicks “Вспомнил”, and
  verifies transition to the next task with no page errors.
- The real App home-button regression reproduced hidden recall-only resumption
  (`actual: recall_reveal`, `expected: mixed`). The corrected button starts daily
  mixed learning from both old recall-only and old mixed-practice sessions.
- Against the previous trainer/lifecycle modules from `b8be076`, this same browser
  test fails on screen 7 with `Recall used as waiting filler`. Against the fixed
  modules it passes all 120 screens and the actual timer/button check.

Browser command: `node tests/recall-waiting-browser.mjs`. Set `ENGI_RECALL_PACK` to
an available .engi archive (default: local presidents v21 test archive), and
`ENGI_TEST_URL` to the Vite URL. `ENGI_RECALL_TRAINER_MODULE` permits a temporary
baseline service module for a red/green comparison; it is only a test input.
The archive and detailed trace remain local artifacts, outside the commit.

Final validation: 561 tests passed, targeted grading/resume tests passed, production
build passed, and the extended real-pack/browser/home-button regression passed.
