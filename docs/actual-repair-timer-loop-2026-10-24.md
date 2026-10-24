# Actual saved-queue reproduction: looping timed repairs

The user still reported the loop after the practice and home-start fixes. A local
read-only capture of the actual Engi database identified another path: the current
1137 reverse-date question was `intent: repair`, `reason: retry`, not practice.
Its repeated successful self-reports had `earlyReveal: true` and
`repairEligible: false`. The error correctly stayed open, but repair selection
kept choosing a timer to vary the previous objective question. Repair selection
bypassed the ordinary rhythm guard entirely.

The capture contains personal progress and remains in ignored local artifacts.
A temporary development-only, same-origin localhost capture hook was removed
immediately afterwards; neither the hook, endpoint, capture, nor raw content is
committed. The original browser's learning rows and answers were not rewritten.

## Correction

- Mixed repair uses an available objective presentation for that mistake before
  a timed self-report. Variation cannot force alternating choice and recall.
- Timed repair candidates also pass the common recall spacing and canonical
  knowledge guards. Explicit recall-only still honors the requested format.
- A saved, unsubmitted timed repair is replaced on resume when a viable objective
  alternative exists. The helper respects the episode's failed-image restriction.
  Submitted answers retain their results; replacement neither grades the question
  nor advances its completed count.
- Correct objective repair still resolves the error through existing evidence
  rules. Early reveal is not reclassified as an independent success.

## Verified reproduction

`node --import tsx --test tests/replay-study-snapshot.ts` restores the actual capture
into a separate fake-indexeddb database and uses its original clock/session/errors.
Before the fix it failed when the same reverse-date timed repair returned. After
the fix it replaces the saved timer, runs at least twenty exercise screens, checks
that subsequent repairs use objective questions, and verifies the original error
is resolved. Repeated runs gave 27–28 exercise screens; the remaining single timer
after saved-timer replacement was ordinary first-check rehearsal, not a repair.

`node tests/replay-study-snapshot-browser.mjs` restores that same capture into an
isolated Chromium profile, mounts the real StudyFeed, clicks the correct objective
option, and verifies: old attempt skipped, correct answer accepted with
`repairEligible: true`, original error resolved, and no page errors. It does not
grade or alter the original browser's session.

Both commands accept `ENGI_SNAPSHOT` (default: ignored local capture). They are
opt-in reproductions, not CI tests dependent on private progress. Shared CI
coverage in `feed-repair-admission.test.ts` checks objective preference, sparse
recall-only data and hard spacing, explicit recall, saved timed repair replacement,
and actual objective answer/error closure without inventing FSRS memory.

Validation: full suite 563 passed; final focused repair/grading suite 25 passed,
including the extra resume fixture added after the full run started; production
build passed. The actual-queue service and browser reproductions passed separately.
