# Общая политика ленты и быстрые переходы — план внедрения

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline implementation after plan review. Steps use checkbox syntax. Work directly on main as requested.

**Goal:** Убрать избыток recall, сохранить все подходящие механики и готовить следующий экран во время текущего взаимодействия.

**Architecture:** Существующие правила памяти определяют доступную работу. Ограниченные адаптеры предлагают представления; чистая политика выбирает семейство по весам, затем знание/разновидность. Структура и медиа готовятся без назначения вопроса и зачёта показа; окончательный выбор проверяется после сохранения ответа.

**Tech Stack:** Existing React, TypeScript, Dexie, node:test/tsx, Playwright; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-23-feed-rhythm-design.md`.

## Результат выполнения

Реализация и проверки завершены; см. `docs/feed-rhythm-results-2026-10-23.md`.
556/556 тестов, сборка, mobile smoke и Chromium/WebKit проверки периодов прошли.
Ниже сохранён исходный план; отклонения от его шагов и непройденная инженерная
цель ≤50 мс на 500 свойствах явно перечислены в отчёте. Использован нативный
исполнитель и одна независимая проверка всей реализации; её замечания исправлены
через RED→GREEN и повторный полный прогон.

## Global Constraints

- Main only; no migration, new branch/worktree or parallel legacy selector.
- Node.js 22.13+, pnpm 10.30.1; preserve import/backup compatibility.
- Сопоставление ≥3, конвейер 3–6, порядок 3–5, self-check 3–4.
- Practice/частичные ответы/подсказки не увеличивают память; сроки и область обучения не ослабляются.
- Mixed: ≤4 опциональных recall в окне 20 заданий, ≥4 других задания после recall при валидных альтернативах. Нижней обязательной квоты recall нет.
- Не выравнивать recall/choice одного знания. Типы, теги и пакеты не хардкодить.
- Trace/warmup не меняют последовательность, память и показанные знания.
- Предзагрузка не держит DB transaction и не блокирует ответ.
- Следующий вопрос не назначается без проверки актуального состояния.

## Review Focus

1. Ошибка/раннее раскрытие после warmup не обходят интервал и не закрывают ошибку — задачи 3, 5.
2. Materialize меняет текст/изображение: учёт следует фактическому взаимодействию — задачи 1, 4.
3. Sparse, recall-only и ordering-only не зависают из-за ритма — задачи 2, 4.
4. Удаление пакета/смена выбора в другой вкладке отменяют старый вопрос, даже когда картинка прогрета — задачи 3, 5.
5. Медленное/битое изображение, unmount и повторный тап не дают пустых ответов, утечки URL или раннего таймера — задачи 5, 6.

## Карта изменений

New `src/services/feed-interactions.ts`: исчерпывающая классификация форматов/подтипов.
New `src/lib/engi/session/feed-rhythm-policy.ts`: чистая политика весов и ограничений.
New `src/services/feed-presentations.ts`: адаптеры существующих генераторов.
Modify lifecycle-feed-service/proposal-diversity/selection-decision: общий выбор и объяснение.
New `src/services/feed-media.ts`, `src/media/prepared-media.ts`: сбор ресурсов и общий ограниченный пул.
Modify media-store/use-media-url/trainer-service/StudyFeed: warmup и быстрый переход.
Tests ниже содержат реальные пути и критерии каждого изменения.

### Task 1: Классификация и регресс плохого ритма

**Files:** create feed-interactions.ts, `tests/feed-interactions.test.ts`; modify proposal-diversity.ts, four-object-feed.test.ts, recall-frequency-diagnostics.test.ts.

**Interfaces:**
- `FeedFamily = 'objective'|'group'|'relations'|'recall'|'self-check'`.
- `FeedInteraction = {family:FeedFamily;kind:string;direction:'forward'|'reverse';cue:'image'|'name';answer:'image'|'text';numeric?:'nearby'|'related'}`.
- `classifyFeedInteraction(task:Pick<Task,'recipe'|'items'|'presentation'|'intervalExercise'|'numericChoiceMode'>):FeedInteraction`.
- `FEED_FORMAT_POLICY:Record<Format,'supported'|'explicit-only'>`: timeline/missing explicit-only; все прочие существующие Format supported. Actual kind различает atomic-choice, multi-choice, recall, match, category, category-conveyor, boundary-conveyor, order-date/number, period-bands/start/end и flip-grid.

- [ ] Add classifier tests for every Format, one-item match/category as choice, bands before match fallback, every image/direction/numeric variant, exhaustive compile coverage.
- [ ] Extend four-object report with actual item count/interaction and recall windows. Assert mixed cap with valid alternatives, not equal recall counts; assert choice-only zero recall. Write report before assertion.
- [ ] Run `node --import tsx --test tests/feed-interactions.test.ts tests/four-object-feed.test.ts tests/recall-frequency-diagnostics.test.ts`; confirm meaningful red: missing classifier/excess recall.
- [ ] Implement classifier, delegate presentationFamily to it without selector changes. Classifier green; integration rhythm remains red until task 4. Do not publish an intentionally failing intermediate main commit.

### Task 2: Чистая политика и модель

**Files:** create feed-rhythm-policy.ts, `tests/feed-rhythm-policy.test.ts`.

**Interfaces:**
- `RhythmCandidate = {key:string;interaction:FeedInteraction;knowledgeKeys:readonly string[];objectIds:readonly string[];need:number;knowledgeAge:number;variantPenalty:number}` (need/penalty 0..1, age capped 0..30).
- `RhythmTurn = {key:string;interaction:FeedInteraction;knowledgeKeys:readonly string[];objectIds:readonly string[];optional:boolean}`.
- `rankRhythmCandidates(candidates:readonly RhythmCandidate[],history:readonly RhythmTurn[],options:{seed:string;format:string;allowRecallFallback:boolean}):{key:string;score:number;blocked?:'recall-gap'|'recall-window'|'format-run';components:Record<string,number>}[]`.

- [ ] Write model tests: 300 turns, seeds 1/17/41 plus 100 seeds; 3/4/6/12 knowledge; unavailable families; explicit/sparse recall; no candidates. Duplicate choice proposals 100×, assert no family-weight inflation.
- [ ] Run red tests. Implement without Math.random/Date/DB: weights objective45/group25/relations15/recall10/self-check5. Normalize eligible families, deficit from last 20 actual turns bounded ±2; score starts deficit×20 + need×8 + age/30×4 − variantPenalty×3 − immediate-same-kind×8; stable selectionTie for equality.
- [ ] Compare deficit coefficients 10/20/30 on identical inputs; keep lowest passing caps and ≤30 continuously eligible opportunities per interaction absent urgent interruptions. Within a family prefer oldest actual kind; more aliases never add weight. Record selected coefficients with model report.
- [ ] Enforce recall gap/window and >3 optional same-kind avoidance only with alternatives; fallback separate explicit call after failed alternatives. No artificial minimum recall frequency. Run `node --import tsx --test tests/feed-rhythm-policy.test.ts`; expect deterministic and zero cap/coverage violations.

### Task 3: Адаптеры всех существующих упражнений

**Files:** create feed-presentations.ts, `tests/feed-presentations.test.ts`; reuse goal/group/self-check/chronology/interval generators.

**Interfaces:**
- `PresentationCandidate = {key:string;interaction:FeedInteraction;goals:readonly LearningGoal[];supportGoalIds:readonly string[];proposal?:GoalProposal;preparedTask?:Task}`.
- `PresentationContext = {bundle:Bundle;enabled:Memory[];session:SessionRow;history:Task[];ready:GoalProposal[];practice:GoalProposal[];supports:GoalProposal[];memories:ReadonlyMap<string,GoalMemory>;intervalEvidence:ReadonlyMap<string,IntervalEvidence>;affinity:GroupContext;now:number}`.
- `buildPresentationCandidates(context:PresentationContext):{candidates:PresentationCandidate[];availability:Record<string,{count:number;reason?:string}>}`.
- `materializePresentation(candidate:PresentationCandidate,context:PresentationContext):Task|undefined`.

- [ ] Tests: actual practice group versus single match; unseen/suspended/other-scope exclusions; known supports limited by existing builder policy; group sizes; close periods; ordering-only; canonical deduplication; wrong/early reveal changes candidate eligibility. Confirm red.
- [ ] Capability buckets once per supplied snapshot, no per-candidate DB queries. Limit 8 proposals per actual kind and 96 total, allocate kinds before filling per-kind budget. Preserve existing search budgets; period builder at most once per selection.
- [ ] Return at most one prepared Task from each currently eager contextual generator. No early winner return, persisted draft or prepareStudyTask for losers. Keep exact/contextual evidence and disclosure budget unchanged.
- [ ] Settings/deletion between contexts and no eligible work yield explicit reasons. Run `node --import tsx --test tests/feed-presentations.test.ts tests/learning-variety.test.ts tests/interval-feed.test.ts`; expected pass.

### Task 4: Интеграция выбора и достижимость

**Files:** modify lifecycle-feed-service, selection-decision, proposal-diversity; create `tests/feed-mechanic-coverage.test.ts`; existing feed/interval integration tests.

**Interfaces:** use tasks 1–3, preserve pickLifecycleFeed signature and contracts. Trace adds interaction/rank components/block reasons from the same selection, never a second generator call.

- [ ] Add real-service reachable scenarios for every inventory row, including images, reverse, nearby/related numbers, both period edges, sets, contextual and standalone ordering. Assert actual shown interaction, eligibility and memory effect, not isolated generator output.
- [ ] Keep work-lane/repair/admission owners. Convert early format returns into adapter candidates; preserve exact overdue priority and partial-disclosure budget.
- [ ] Replace practice's format-count equality with family choice followed by knowledge/variant. Build practice groups with practice contracts. Reclassify materialized Task before accounting. Try at most 8 ranked candidates, prefer unattempted kinds; no unbounded retries.
- [ ] Recall fallback only after all valid alternatives fail and no allowed introduction exists. Report specific cause. Test four-object, one-goal, recall-only and ordering-only without deadlock.
- [ ] Run `node --import tsx --test tests/four-object-feed.test.ts tests/recall-frequency-diagnostics.test.ts tests/feed-mechanic-coverage.test.ts tests/feed-variety.test.ts tests/continuous-mechanics.test.ts tests/interval-fast-feed.test.ts`; rhythm and memory assertions green, trace-on/off identical.
- [ ] Report per-kind availability, wait, shares, actions/time. Commit passing selector/tests together, excluding generated artifacts.

### Task 5: Общий ресурс изображений и безопасный warmup

**Files:** create feed-media.ts, prepared-media.ts, `tests/feed-media.test.ts`, `tests/prepared-media.test.ts`; modify media-store.ts, use-media-url.ts, trainer-service.ts, StudyFeed.tsx.

**Interfaces:**
- `taskMediaSources(task:Task):string[]`: cue image, answerImage, option images and all group items, deduplicated.
- `prewarmMedia(sources:readonly string[],signal?:AbortSignal):Promise<void>`.
- `acquirePreparedMedia(source:string):Promise<{url:string;release():void}>` shares pool with prewarm.
- trainer service `previewFeedMedia(sessionId:string):Promise<string[]>`: at most 12 sources of up to 3 structural candidate previews. Read-only, no selection randomness, lifecycle/day-plan mutation or attempt creation. If safe preview unavailable, warm current resources only.

- [ ] Tests for all image locations, concurrent single fetch/decode, active URL protection, zero-ref eviction, failed decode retry, abort/unmount, wrong-answer/scope/deletion invalidation, preview-on/off sequence and memory equality. Run red.
- [ ] Pool bounds: ≤24 idle entries and ≤12 MiB idle blob bytes, LRU zero-ref eviction; active resource refs protected. Ahead warmup ≤12 sources, concurrency2, cancel on task/scope change. State blob budget truthfully, not an assertion about decoded GPU memory.
- [ ] Warm structural candidates without cloning DB or calling mutating selector speculatively. Keep existing content cache validation until measured otherwise; no cache of schedules. Final selection rereads current scope/settings even after cross-tab edits.
- [ ] Import/delete/restore invalidates idle media; hook cleanup releases refs. Fire-and-forget before answer/feedback ends; no decode/network await inside IndexedDB transaction. Broken media retains existing truthful error flow.
- [ ] Run `node --import tsx --test tests/feed-media.test.ts tests/prepared-media.test.ts tests/feed-performance.test.ts` and image/browser regressions, then commit passing changes.

### Task 6: Быстрый переход в UI

**Files:** StudyFeed.tsx, trainer-service.ts, feed-performance.ts; create `tests/feed-transition-browser.mjs`; extend mobile-study-smoke stage reporting.

**Interfaces:** preserve answer/advanceFeed signatures; bounded stages `ui.transition.request`, `ui.transition.ready`, `media.decode`; distinguish intentional feedback/recall time from computation.

- [ ] Browser regressions: local portrait/answer-grid/flag/group/period → next; broken image, double tap, hidden tab, pending visibility writes, retry, early reveal, reload/reduced motion. Assert no empty options, jump back, early timer or grading.
- [ ] Await answer/visibility commits; overlap authoritative selection and existing 180 ms exit. No new wait/spinner minimum. Do not select from an uncommitted outcome or discard writes on visual exit.
- [ ] Avoid broad getDayPlan write transaction before scheduled advance: postpone nonurgent counter refresh until transition commits; reuse already computed projection only if current. Counters eventually reflect committed canonical units without blocking next frame.
- [ ] Use shared warmed resources; no revoke/recreate on rerender. Animate transform/opacity, no forced-layout loop. Enable interaction and start recall only after cue is ready and visible.
- [ ] Run transition browser test and `pnpm test:smoke:mobile`; existing gestures, reload, wrong-card retention, cleanup must pass. Commit.

### Task 7: Скорость и полный регресс

**Files:** create `tests/feed-latency.test.ts`, `tests/feed-latency-browser.mjs`; update MOBILE_SMOKE.md and audit with before/after.

- [ ] Fixture 50/500/2000 properties with groups/numbers/images/periods. Assert capability build ≤1 per revision/config, proposals ≤96, materialize attempts ≤8, preview ≤12 sources, no per-proposal DB query. Test cache invalidation and fallback boundedness before wall-clock assertions.
- [ ] Browser performance.now; 100 warm transitions after 10 warmup turns, ≥3 repeated runs normal and CPU×4. Warm selection+prepare p95 target≤50 ms at 500 properties; gap after useful feedback/exit to next-ready p95≤100 ms. For ×4 require no regression vs same-environment baseline, report actual values.
- [ ] Report cold start/resume/transition separately, median/p95/max, long tasks, reads/decode counts. Slow network/cold media separate; no fake-Date timing or universal iPhone claim. Run baseline and updated builds against same fixtures/device.
- [ ] Run `pnpm test`, `pnpm build`, `pnpm test:smoke:mobile`, transition/coverage browser tests. Fix failures without weakening learning/correctness assertions for speed.
- [ ] Review all inventory rows/five failure classes, inspect diff; commit relevant files, push main only once green. Report deployment independently of push.

## Замеры до реализации

Service probe: 6 fresh four-object sessions, last 1000 instrumented stages;
advance.total p95 16.35 ms (56 samples), selection p95 6.11 ms, prepare p95 1.56 ms.
Это локальный fake-indexeddb, не iPhone.

Повторный production mobile smoke, 393×852 touch Chromium, 8 объектов, CPU×1:
11 основных сценариев, 41 timing sample, ошибок страницы нет. Selection p95 39 ms
(34 samples), advance.total p95 47 ms (25), task.prepare p95 7 ms (26).
ui.cardLoad median6/p95 16/max428 ms. Choice answer→next-visible median422 ms
(11 samples); включает полезный feedback и в одном случае неверный ответ перед
верным, поэтому не равно «чистое время подбора». Групповые end-to-end замеры
включают несколько действий и не сравниваются с одиночным выбором напрямую.
Логи/JSON — artifacts/feed-latency-baseline.* и artifacts/mobile-smoke/report.json.

Код продукта пока не изменён; план после self-review передаётся пользователю.
