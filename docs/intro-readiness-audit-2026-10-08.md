# First-question readiness audit

## Reproduction

Run `tests/intro-interaction-browser.mjs` against the development server with `ENGI_TEST_URL` and optional `ENGI_BROWSER_PATH`. It uses isolated browser contexts, generated objects and local cached images; it does not access personal progress.

The probe tracks screen attachment, completed image decoding, enabled choices, the visible acquisition countdown and scroll position. It also collects the existing opt-in performance spans. It taps the correct answer using touch coordinates without scrolling, then measures the next question.

## Results before the fix

| Scenario | Last Done → first screen | Image ready after screen | First screen → enabled choices | Next screen → enabled choices |
| --- | ---: | ---: | ---: | ---: |
| 6 objects | 81 ms | within first sample | 10,005 ms | within first sample |
| 60 objects | 200 ms | within first sample | 9,748 ms | within first sample |
| 6 objects, CPU slowed 4× | 356 ms | 42 ms | 9,526 ms | 60 ms |

Sampling interval: 16 ms. Measurements are browser observations, not universal device guarantees. All three scenarios accepted the first answer with scrollTop still zero.

## Finding

The reproduced delay is predominantly the deliberate acquisition deadline, not image or question loading. `pickLifecycleFeed` parks a question with `readyAt` when no other safe work is available. `StudyFeed` disables answer buttons until that deadline. On a fresh dataset, completing three introductions quickly leaves roughly ten seconds of protected time; the next question generally has no remaining deadline.

The earlier suspected lost image-load notification was not reproduced in these scenarios. The current evidence does not prove or exclude a separate device-specific scrolling defect.

To remove the apparent freeze, address the acquisition waiting policy or its presentation. Bypassing image readiness would not remove the observed ten-second delay, and changing independent evidence eligibility requires preserving the memory-credit rules.

Full measurements: `artifacts/intro-readiness-profile.json`.

## Implemented fix

Initial acquisition no longer imposes a mandatory ten-second timer. Objects are separated by selection order rather than an idle screen. Buttons become available when the actual question and its image are ready. There is no countdown, waiting screen or blocked first question.

The same browser probe now checks that new questions have no artificial `readyAt`, accept a touch answer without scrolling, and continue to the next question. The measurements artifact contains the latest post-fix run; the table above records the earlier diagnosis. Established FSRS and disclosure restrictions are unchanged.
