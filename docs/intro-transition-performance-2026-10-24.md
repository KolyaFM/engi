# New-card transition performance

The introduction path repeated work after selection: a full content read, full
canonical target reconstruction, and a hidden day-plan transaction. Image warmup
only covered tasks, so introductions had no prepared hero/property media.

Selection now returns transient presentation items alongside an intro. The trainer
associates its exact returned session snapshot with that content through a WeakMap.
StudyFeed renders the prepared snapshot immediately; ordinary selection saves keep
the current presentation, while restored sessions use an explicit read-only load.
No content snapshot is persisted, shared by session ID, or reused across newly
selected content/settings snapshots. The intro component no longer reconstructs
all targets when prepared items are available.

Hidden intro screens no longer request day-plan or structural future-task previews.
The selected hero and enabled property pictures warm during the outgoing transition;
current-image preparation also covers intros. Media failure remains nonfatal to
warmup. No speculative selection, grading, or admission occurs.

## Measurements

`node tests/intro-latency-browser.mjs`, Chromium, isolated IndexedDB, 393×852,
500 numeric properties/50 objects, no images, six cold/warm starts. Before/after
artifacts are local `artifacts/intro-latency-{before,after}.json`.

| Measurement | Before | After |
| --- | ---: | ---: |
| Warm median: selection complete → visible intro frame | 51.2 ms | 28.1 ms |
| Warm median: start selection → visible intro frame | 111.7 ms | 64.8 ms |
| First cold selection + visible intro frame | 351.5 ms | 222.7 ms |

These small local samples measure rendering readiness, not completion of the
intentional 280 ms slide-in animation. They do not establish an iPhone latency
guarantee or the cost of cold image decoding. A real states pack browser test also
checks loaded maps/flags, familiarity saves, restored image questions and matching;
gesture browser checks cover intro swipe completion and retries.

## Regression checks

- Final verification: 559 tests passed; production build passed; the intro browser
  benchmark/restoration check, mobile gesture suite, and real map/flag image suite
  passed. An independent review found no concrete regression in the optimization.
- Prepared selection snapshot, read-only restoration, current property settings.
- Hero/property warmup includes enabled images and excludes unrelated ones.
- Browser test requires a newly mounted visible sheet, checks no hidden day-plan
  reads, saves familiarity, and restores the saved introduction.
- An existing 30-day interval simulation asserted an optional bands format must
  win selection while only four properties graduate. The same failure reproduces
  with the previous trainer. Its graduation/repair assertions remain; actual bands
  delivery is required by `interval-fast-feed.test.ts`, including first appearance
  before turn 35. No scheduling weights were changed to satisfy this simulation.
