# Interval Exercises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить точные проверки периодов, дополнение границы и сопоставление полос без дополнительных обязательств в расписании.

**Architecture:** Период остаётся существующим фактом и существующей целью. Чистый адаптер дат обслуживает генерацию и UI. Метаданные упражнения разделяют точный ответ, проверку границы и контекст; частичные результаты сохраняются отдельно от FSRS.

**Tech Stack:** React, TypeScript, Dexie, node:test/tsx, Playwright Chromium/WebKit. Новые зависимости не нужны.

**Spec:** `docs/superpowers/specs/2026-10-16-interval-exercises-design.md`

## Global Constraints

- Один факт периода — одна единица прогресса и максимум одна открытая ошибка.
- Первый выпуск упражнений работает с точными закрытыми годовыми диапазонами.
- Начало не позже конца; приблизительные и открытые значения не округляются.
- Существующий формат `.engi` и старый прогресс сохраняются.
- Поддержать телефон, изменение ориентации и восстановление черновика.
- Частичный/контекстный ответ не обновляет точную память FSRS.
- Только первый самостоятельный ответ получает самостоятельный зачёт.
- Частичные упражнения не могут бесконечно откладывать полноценную проверку.

## Review Focus

1. Полная дата 1 января похожа на начало целого года: новая метаинформация сохраняет исходную точность; старые данные без неё обрабатываются консервативно.
2. Показываемый конец интервала раскрывает часть ответа: исключить немедленную независимую проверку целого периода.
3. У диапазона 1941–1941 ограничены допустимые варианты: не генерировать обратные периоды и не зацикливаться.
4. Последняя полоса угадывается исключением: контекстный результат не продвигает точную память.
5. На узком экране короткая полоса неразличима: отклонить группу, сохранив задачу в очереди для другого формата.

## Task 1: Единая модель и представление периода

**Files:**
- Create: `src/lib/engi/questions/date-interval.ts`
- Modify: `src/lib/engi/types.ts`, `src/lib/engi/import/semantic-merge.ts`, `src/lib/engi/validate.ts`, `src/lib/engi/knowledge/properties.ts`
- Modify: `src/lib/engi/questions/recipe-factory.ts`, `src/components/study/ObjectIntroCard.tsx`
- Modify: `PACK_FORMAT_V3.md`, `ARCHITECTURE_V3.md`
- Test: `tests/date-interval.test.ts`, `tests/v3.test.ts`

**Interfaces:**
- `DateInterval={start:number;end:number}` — годы, а не миллисекунды.
- `yearInterval(f:Fact):DateInterval|undefined` — только подтверждённая годовая точность обеих границ.
- `formatDateFact(f:Fact):string` — общая отображаемая запись даты/периода.
- Optional `Fact.dateBoundaryPrecision:{start:'year'|'month'|'day';end:'year'|'month'|'day'}`; старые факты без поля валидны.

- [ ] Написать тесты: `{start:1147,end:1149}` отображается `1147–1149`; одиночная дата сохраняет текущее представление; полные даты не округляются; приблизительные интервалы не допускаются в `yearInterval`; старый годовой диапазон 01-01/12-31 остаётся пригодным по консервативному правилу.
- [ ] Запустить `node --import tsx --test tests/date-interval.test.ts`; убедиться в ожидаемом падении.
- [ ] Реализовать адаптер и запись точности в `dateValue`; протянуть необязательное поле через валидацию и копирование фактов. Не менять ID/ревизию существующих целей только из-за отображения.
- [ ] Обновить вывод в `textValue`, генераторе ответов и новой карточке. Сохранить ID ответа старых задач; новые задачи используют единое отображение. Не пересоздавать старые сохранённые задания молча.
- [ ] Добавить тест повторного импорта: годовые и полные даты сохраняют смысл, факты не дублируются, старый прогресс не сбрасывается. Проверить export/restore нового поля.
- [ ] Запустить профильные тесты импорта и `pnpm build`; зафиксировать проверенный результат коммитом.

## Task 2: Соблюдение настроек и варианты полного диапазона

**Files:**
- Create: `src/lib/engi/questions/interval-distractors.ts`
- Modify: `src/lib/engi/session/composer.ts`, `src/services/learning-chronology.ts`
- Test: `tests/interval-distractors.test.ts`, `tests/learning-chronology.test.ts`

**Interfaces:**
- Consumes `yearInterval`, `DateInterval`, `formatDateFact`.
- `intervalDistractors(b:Bundle,item:Item,recipe:Recipe,random?:()=>number):Task['options']|undefined`.
- `buildLearningChronology` сохраняет сигнатуру, фильтрует якорь, участников и опоры по настройкам свойства выбранного формата.

- [ ] Написать тест: при `learning.sort='off'` не создаётся учебный `sort`; если `categorize` разрешён, допустим соответствующий формат; при обоих запретах возвращается `undefined`.
- [ ] Написать генеративные тесты диапазонов: правильный вариант единственный, три уникальных неверных; нет конца раньше начала; смещения 1–3; правильный ответ бывает по краям и внутри по началу/концу; встречаются изменения одной и обеих границ.
- [ ] Убедиться, что тесты падают, затем реализовать конечный пул допустимых преобразований, выбор с перемешиванием без бесконечных циклов. Отсутствие полного набора даёт обычные допустимые альтернативы или другой формат.
- [ ] Подключить к `composeUnit` только прямой `choice` годового периода; оставить обратные вопросы, группы и одиночные даты без изменения. Использовать существующее чередование режимов альтернатив.
- [ ] Проверить `compileTaskContract` и `assess`: точный ответ оценивается существующей целью `precision='range'`, неверный — той же целью; не добавлять новые цели за границы.
- [ ] Запустить новые тесты, `tests/numeric-distractors.test.ts`, `tests/group-affinity.test.ts`, `pnpm build`; коммит.

## Task 3: Частичные результаты без изменения расписания

**Files:**
- Create: `src/lib/engi/study-core/interval-evidence.ts`, `src/services/interval-evidence-service.ts`
- Modify: `src/lib/engi/types.ts`, `src/lib/engi/study-core/contracts.ts`, `src/lib/engi/study-core/compiler.ts`
- Modify: `src/services/study-core-service.ts`, `src/services/goal-proposals.ts`, `src/services/review-commit.ts`
- Test: `tests/interval-evidence.test.ts`

**Interfaces:**
- Optional `Task.intervalExercise` discriminated union: `{kind:'endpoint';edge:'start'|'end'}` or `{kind:'bands';scale:IntervalScale}`; existing task formats remain `choice`/`match`.
- `TaskContract.intervalEvidence?:{kind:'endpoint';edge:'start'|'end'}|{kind:'bands'}` — проверяет компилятор, не принимает неподтверждённые клиентские данные.
- `IntervalEvidence={goalId:string;revision:string;lastExerciseAt?:string;lastEdge?:'start'|'end';start?:{correct:boolean;at:string};end?:{correct:boolean;at:string};failedContextAt?:string;attemptIds:string[]}`.
- `recordIntervalEvidence(previous:IntervalEvidence|undefined,input:{taskId:string;goalId:string;revision:string;kind:'start'|'end'|'context';correct:boolean;at:string}):IntervalEvidence`; хранить последние 20 ID попыток.
- `readIntervalEvidence` читает агрегат для целей одним bulkGet, без сканирования истории; записи `appMeta` используют префикс `studyCore:intervalEvidence:`.

- [ ] Написать тесты: одно действие записывается один раз; неверный конец не означает неверное начало; новая ревизия не использует старую диагностику; существующая FSRS-карта после частичного ответа побайтово не меняется.
- [ ] Написать тест ошибки: частичный неправильный ответ открывает/уточняет одну ошибку периода, частичный правильный не закрывает её; самостоятельный полный ответ закрывает её существующим механизмом.
- [ ] Запустить тесты и увидеть ожидаемое падение.
- [ ] Реализовать контракт и атомарную фиксацию частичного результата с попыткой. Не изменять семантику старых `choice`/`mapping`; точные задачи идут прежним путём, частичные не вызывают `applyMemory` и `advanceAcquisition`.
- [ ] Видимая граница и обратная связь формируют claim полного факта, консервативно блокирующий немедленный независимый зачёт. Не менять claims внутри существующего exposure episode.
- [ ] Проверить восстановление агрегата из резервной копии, удаление с колодой через существующие очистки `appMeta`; добавить префикс в точечную очистку, если она не охватывает его.
- [ ] Запустить новые тесты и тесты exposure/mistakes/acquisition; коммит.

## Task 4: Дополнить границу в ленте

**Files:**
- Create: `src/services/interval-composition.ts`, `src/components/study/IntervalEndpointCard.tsx`
- Modify: `src/services/lifecycle-feed-service.ts`, `src/services/goal-feed.ts`, `src/services/proposal-diversity.ts`
- Modify: `src/components/study/StudyFeed.tsx`, `src/lib/engi/import/schema-v3.ts`, `src/lib/engi/validate.ts`, `src/lib/engi/types.ts`, `src/lib/engi/import/semantic-merge.ts`
- Test: `tests/interval-feed.test.ts`, `tests/interval-exercises-browser.mjs`

**Interfaces:**
- `buildEndpointTask(b:Bundle,exact:Task,evidence:IntervalEvidence|undefined,history:Task[]):Task|undefined` — исходная точная задача определяет цель и очередь; результат сохраняет исходный ID знания и получает новый ID задания.
- Optional pack templates `promptTemplates.rangeStart`/`rangeEnd`, setting `learning.rangeBoundary:'auto'|'on'|'off'`; обновить все валидаторы/перенос метаданных, не требовать поля у старых пакетов.
- UI consumes persisted `Task` and normal `ChoiceCard` callbacks; shows question and `1939 — ?` or `? — 1945`, buttons remain existing choice surfaces.

- [ ] Сначала тесты: предпочесть ошибочную границу, иначе чередовать; допустимые годы не пересекают видимую границу; показанная граница не засчитывается; шаблон пакета используется дословно.
- [ ] Тест завершения: на одно знание максимум одно частичное упражнение между точными проверками; если других целей нет, следующий допустимый вопрос — полноценный контроль, без экрана остановки из-за частичного упражнения.
- [ ] После ожидаемого падения реализовать генерацию и интеграцию после выбора актуальной цели. Полный контроль имеет приоритет при открытой ошибке/сроке подтверждения. Контекстные упражнения не вытесняют срочное повторение.
- [ ] Проверить экран в Chromium/WebKit: обе границы, первый неверный ответ, повторное нажатие, восстановление после reload, смена объекта. Кнопки не перекрывают область свайпа других форматов.
- [ ] Прогнать тесты, `pnpm build`; коммит.

## Task 5: Общая шкала и подбор полос

**Files:**
- Create: `src/lib/engi/questions/interval-scale.ts`, `src/services/interval-group-composition.ts`
- Modify: `src/services/lifecycle-feed-service.ts`, `src/services/proposal-diversity.ts`, `src/lib/engi/import/schema-v3.ts`, `src/lib/engi/validate.ts`, `src/lib/engi/types.ts`, `src/lib/engi/import/semantic-merge.ts`
- Test: `tests/interval-scale.test.ts`, `tests/interval-groups.test.ts`

**Interfaces:**
- `IntervalScale={min:number;max:number;ticks:number[];mode:'dated'|'sparse'|'anchored';bands:{id:string;start:number;end:number;marker:string;colorIndex:number;support?:boolean}[]}`.
- `buildIntervalScale(intervals:{id:string;start:number;end:number;support?:boolean}[],mode:IntervalScale['mode'],width:number):IntervalScale|undefined`.
- `buildIntervalGroup(b:Bundle,ready:GoalProposal[],supports:GoalProposal[],history:Task[],width:number):Task|undefined`.
- Optional pack setting `learning.rangeBands:'auto'|'on'|'off'`; `match='off'` также запрещает полосы.

- [ ] Написать тесты: одна линейная шкала для всех полос, никакого независимого растяжения; минимум 3/максимум 5 участников, минимум 2 актуальные цели, максимум 1 опора; одинаковые периоды не создают неоднозначную группу.
- [ ] Проверить крайние длительности и экран 320 px: минимальная видимая длина полосы 12 px, различие любых двух полос хотя бы по одной границе 6 px, область нажатия каждой строки 44 px. При невозможности вернуть `undefined`.
- [ ] Проверить режим без чисел: обязательная подписанная опора; после перемешивания остаётся единственное соответствие по видимым отношениям порядка/пересечения/вложения; симметричные решения отклоняются перебором максимум 5! перестановок.
- [ ] Реализовать после ожидаемых падений. Смешивание типов объектов допустимо, если роль периода и масштаб совместимы; нельзя группировать годы жизни и даты войн только потому, что совпал размер числа. Нейтральные группы разных типов допускаются для временного контекста, без утверждения общей роли.
- [ ] Подключить в ленту с ограничением: максимум одно упражнение полос среди последних 6 заданий; не ставить подряд с обычной хронологией. Нехватка группы не блокирует точную задачу якоря.
- [ ] Выполнить тесты; коммит.

## Task 6: Экран полос и итоговая проверка

**Files:**
- Create: `src/components/study/IntervalBandsCard.tsx`, `src/components/study/interval-exercises.css`
- Modify: `src/components/study/StudyFeed.tsx`, `src/db/engi-db.ts`, `src/services/trainer-service.ts`, `src/services/study-core-service.ts`, `package.json`
- Test: `tests/interval-exercises-browser.mjs`, `tests/interval-learning-simulation.test.ts`

**Interfaces:**
- `IntervalBandsCard` uses matching pair callbacks and saved `InteractionDraft.matching`; pair keys are stable band IDs, not coordinates. Draft stores selected IDs only, never derived pixels.
- Task construction uses conservative mobile width 288 px by default. UI may request a safe exact-choice replacement before any answer/exposure if geometry becomes illegible after resizing; no false answer/skip penalty.

- [ ] Написать browser tests перед компонентом: выбор объекта/полосы в любом порядке, неправильная пара снимает выбор, правильная подписывается без затемнения остальных, клавиатура, reload сохраняет пары, поворот не меняет ответы.
- [ ] Реализовать три строки на телефоне и до пяти на широком экране, общую шкалу и разделённые строки с маркером/цветом. Все годы открываются после окончания. Применить существующие цвета поверхностей, reduced motion и фокус.
- [ ] Для контекстных пар оставить первый результат неизменным, опору и последнюю пару по исключению не считать самостоятельной точной проверкой. Не выполнять FSRS-переходы при завершении группы.
- [ ] Симуляция: 30 дней, пользователь ошибается только в конце, затем исправляет; знание не раздваивается, число ошибок сходится к нулю, отключённые/«Знаю» не возвращаются, частичные упражнения не удерживают очередь.
- [ ] Запустить `pnpm test`, `pnpm build`, browser tests Chromium/WebKit и `pnpm analyze:packs C:/Users/KolyaFM/Downloads/century12-world-history-v6-compact.engi`. Отчёты — только `artifacts/`, реальные пользовательские данные не менять.
- [ ] Проверить diff на отсутствие новых обязательств и изменений старых целей, обновить архитектуру/формат пакетов; коммит.

## Итоговый обзор

После всех задач проверить: точность не теряется при импорте, ID старых целей не изменены,
все настройки отключения соблюдаются, счётчики считают свойства, частичный успех не
закрывает полный долг, лента всегда достигает точного контроля. Не публиковать и не
отправлять изменения в удалённую ветку без отдельного поручения.
