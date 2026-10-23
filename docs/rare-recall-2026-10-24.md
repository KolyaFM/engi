# Rare recall and repeated knowledge

The previous mixed-feed protection allowed four recalls per twenty screens and a
four-screen intervening gap. It did not enforce an interval for the same canonical
knowledge. A fresh four-portrait simulation with every answer correct returned one
portrait at turns 19 and 25, another at turns 35 and 43. Per-family weight 10 also
renormalized to about 18% when only objective choice (45) and recall were available.

The new mixed-feed policy uses recall weight 3, no more than two recalls in any
twenty exercises, and at least nine other exercises between recalls. Canonical
knowledge previously used in recall stays unavailable to recall for twenty
exercise positions; changing the task ID, direction, or cue does not bypass it.
These are hard guards, including retries after failed materialization. Explicit
recall-only mode retains its explicit format selection.

Unavailable recall candidates are excluded from the soft format-run alternatives.
If oldest-knowledge practice has no permitted presentation, selection expands to
the remaining practice candidates rather than overriding recall protection. Work
eligibility, disclosure delays, and FSRS writes remain in their existing paths.
The existing thirty-presentation history now survives a newly started visit;
previously only its last three presentations were retained. Unseen selections are
still excluded from this history.

## Evidence

- Four-object fresh feeds: six deterministic 64-turn scenarios, with/without
  numeric facts, all correct answers, resume plus new visits every thirteen turns.
  They enforce the same-knowledge twenty-exercise gap and rolling two-in-twenty cap.
- Practice diagnostics on 3, 4, 6, and 12 portraits: respectively 2, 2, 2, and 1
  recalls in twenty-four exercises; no return of the same portrait after just one
  or two other exercises. Choice-only control: zero recall.
- Policy simulation: 100 seeds × 300 selections, including 100 duplicate candidate
  copies, rare-format availability, explicit-mode behavior, and blocked-recall
  interaction with the soft format-run preference.

This replaces the earlier four-in-twenty frequency policy. It does not assign each
object a required recall turn or give a successful self-report new memory credit.

Verification: 561 tests passed and the production build passed. A separate review
found no concrete regression in the cap, retry, knowledge-key or visit-history paths.
