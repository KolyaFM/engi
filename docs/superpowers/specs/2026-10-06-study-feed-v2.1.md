У тебя есть:

1. текущая рабочая версия `engi-v2`;
2. предыдущая архитектурная спецификация;
3. Deep Research по Study Feed / learning science / juicy UX.

Текущую архитектуру knowledge graph, IndexedDB, PropertyDefinition, EntityTypeDefinition, Fact, Tags, packs, backups, FSRS и local-first **не переписывать**.

Эта итерация посвящена исключительно:

- качеству процесса обучения;
- скорости мобильного взаимодействия;
- правильному feedback;
- Recall без клавиатуры;
- исправлению Timeline;
- New Knowledge loop;
- microinteractions / juice;
- честным return hooks;
- удалению остатков старого learning flow.

Главный критерий:

> Энги должен ощущаться не как тест с формами, а как очень быстрая интерактивная лента знаний.

---

# 1. Choice: неправильный ответ НЕ раскрывает правильный

Это обязательное изменение.

Сейчас после неправильного ответа приложение показывает отдельный feedback с правильным ответом.

Так больше не делать.

Новый flow:

```text
Вопрос

[ Моне    ]
[ Ренуар  ]
[ Дега    ]
[ Мане    ]
```

Пользователь нажимает неправильный:

```text
[ Моне    ]
[ Ренуар ✕] ← красный
[ Дега    ]
[ Мане    ]
```

На этом всё.

НЕ показывать:

```text
Правильный ответ: Моне
```

НЕ подсвечивать правильный вариант.

НЕ переходить дальше.

Пользователь должен **сам продолжать выбирать**, пока не найдёт правильный.

Например:

```text
тап Ренуар
→ красный

тап Дега
→ красный

тап Моне
→ зелёный ✓
→ короткая реакция
→ следующий card
```

Ошибочные варианты после нажатия:

- остаются красными;
- больше не принимают повторный tap;
- остальные варианты остаются активными.

Когда выбран правильный:

- он становится зелёным;
- прошлые ошибки остаются визуально красными до ухода карточки;
- через примерно 300–450 ms card автоматически сменяется.

Не нужна кнопка Next.

---

# 2. Очень важно: одна карточка = один learning event

Если пользователь внутри одного Choice ошибся три раза, это НЕ три отдельных FSRS review.

Пример:

```text
Renoir ✕
Degas ✕
Monet ✓
```

Результат этой карточки:

```text
overall result = incorrect
```

Потому что правильный ответ не был получен с первой попытки.

В `ReviewEvent.metadata` сохранить:

```ts
attemptSequence: [
  'renoir',
  'degas',
  'monet'
]

wrongChoices: [
  'renoir',
  'degas'
]

attemptCount: 3
```

FSRS обновить **один раз**.

Если первая попытка неправильная:

```text
FSRS → Again
```

даже если пользователь потом нашёл правильный ответ.

Это retrieval failure + correction.

Не считать финальный forced-correct как Good.

---

# 3. Confusion Graph при нескольких ошибках

Каждый реально выбранный неправильный Entity является полезным сигналом confusion.

Например:

```text
правильный = Monet

ошибки:
Renoir
Degas
```

обновить:

```text
confusion Monet ↔ Renoir
confusion Monet ↔ Degas
```

Но не раздувать graph бесконечно.

Один неправильный вариант должен учитываться максимум один раз на конкретной карточке.

Можно сохранять все wrong choices, но FSRS update остаётся один.

---

# 4. Feedback неправильного Choice должен быть локальным

Никаких больших плашек:

```text
Правильный ответ...
Следующее повторение...
Источник...
```

во время обычного feed.

Feedback происходит **прямо на элементах вопроса**.

Wrong:

- option краснеет;
- короткое движение/shake примерно 120–180 ms;
- остальные ответы остаются активными.

Correct first try:

- зелёный fill/border;
- лёгкий scale/pulse;
- авто-next.

Correct after mistakes:

- correct зелёный;
- wrong остаются красными;
- чуть более длинная пауза, например 400–550 ms;
- авто-next.

Дополнительная информация скрыта за `···`.

---

# 5. Никакой отдельной «плашки правильного ответа» после Choice

Это жёсткое правило.

После неправильного multiple choice пользователь **обязан самостоятельно найти правильный вариант**.

Это относится также к:

```text
Categorize
Missing
Find Target
Before / After
Near-twin discrimination
другим discrete-choice форматам
```

если вопрос построен как выбор из нескольких ответов.

---

# 6. Timeline / Slider больше НЕ submit на отпускании пальца

Сейчас release slider считается ответом.

Это неудобно и создаёт случайные ответы.

Новый flow:

```text
Когда произошло событие?

1800 ━━━━━━━●━━━━━━━━ 2000

              1872

        [ Подтвердить ]
```

Пользователь:

```text
drag
↓
отпустил
↓
может ещё поправить
↓
Подтвердить
```

Только tap:

```text
Подтвердить
```

создаёт ReviewEvent.

Slider release:

```text
onPointerUp
```

НИКОГДА не отправляет ответ.

---

# 7. Timeline: исправить утечку правильного ответа

В текущей реализации диапазон slider строится вокруг правильного года, а initial position оказывается почти рядом с правильным ответом.

Это ломает задачу.

Убрать это полностью.

Нельзя:

```text
min = correctYear - 60
max = correctYear + 60
initial = midpoint
```

Вместо этого диапазон должен происходить из контекста категории/property.

Например:

```text
Президенты США:
1780 — 2030
```

или:

```ts
min(all values for property) - margin
max(all values for property) + margin
```

Один и тот же property/category должен использовать стабильную шкалу.

Начальная позиция:

- либо нейтральная фиксированная;
- либо предыдущая пользовательская не используется;
- никогда не вычисляется из correct answer.

---

# 8. Timeline feedback

После `Подтвердить`:

показать:

```text
Твой ответ: 1872
Правильно: 1863
```

но максимально компактно прямо вокруг шкалы.

Например маркеры:

```text
1850 ━━━━━━━━●━━━━|━━━━━━ 1900
            ты    факт
```

Не открывать отдельную большую feedback card.

После этого:

- tap/swipe → далее;
- либо небольшой auto-advance, если результат очень близкий.

Timeline остаётся diagnostic/partial evidence согласно текущей learning model.

Не превращать приблизительное попадание в доказательство exact-date memory.

---

# 9. Recall-Reveal полностью переделать под 5-секундный таймер

Никакой клавиатуры.

Никакой кнопки:

```text
Показать ответ
```

Основной Recall flow:

```text
[изображение / cue]

Кто это?

     5
```

Начинается обратный отсчёт:

```text
5
4
3
2
1
```

Через 5 секунд ответ автоматически раскрывается.

Пользователь ничего не нажимает до reveal.

---

# 10. Recall timer должен быть визуально спокойным

Не делать огромный стрессовый секундомер.

Лучше:

```text
тонкое кольцо
или
тонкая progress line
```

которая постепенно заканчивается.

Можно показывать небольшую цифру:

```text
5
4
3...
```

но она не должна быть главным визуальным объектом.

Цель таймера:

> заставить реально попытаться извлечь ответ из памяти,

а не создать нервную мини-игру.

Default:

```text
5000 ms
```

В будущем можно адаптировать время, но сейчас оставить фиксированные 5 секунд.

---

# 11. Recall: после 5 секунд answer reveal

После timeout:

```text
Кто это?

Клод Моне
```

Ответ появляется прямо на карточке.

Переход должен быть приятным:

```text
prompt немного смещается
answer fade/slide in
media остаётся на месте
```

Примерно:

```text
180–250 ms
```

Не должно быть отдельного modal/dialog.

---

# 12. Recall grading — ТОЛЬКО свайп

После reveal пользователь оценивает себя:

```text
← Не вспомнил

Вспомнил →
```

Жесты:

```text
SWIPE LEFT
→ Не вспомнил

SWIPE RIGHT
→ Вспомнил
```

Не делать две большие кнопки как основной interaction.

Карточка должна физически следовать за пальцем.

Пример:

```text
drag right
→ card slightly moves/rotates right
→ появляется мягкий зелёный hint «Вспомнил»

drag left
→ красный/нейтральный hint «Не вспомнил»
```

При достижении threshold:

```text
~25–30% screen width
```

отпускание засчитывает ответ.

Если threshold не достигнут:

```text
card spring back
```

---

# 13. Recall swipe visual language

До reveal свайп НЕ активен.

После reveal:

справа можно очень ненавязчиво показать:

```text
Вспомнил →
```

слева:

```text
← Не вспомнил
```

Это affordance, а не большие кнопки.

После нескольких использований hints можно уменьшать.

Для accessibility/reduced-motion режима разрешается fallback:

```text
две компактные кнопки
```

но основной mobile UX — swipe.

---

# 14. Recall evidence semantics

Если:

```text
SWIPE LEFT
```

→ `Again`

Если:

```text
SWIPE RIGHT
```

→ максимум `Good`.

Не выдавать Easy только потому, что пользователь заявил:

```text
«вспомнил»
```

Latency уже известен:

```text
reveal произошёл через 5 sec
```

поэтому пока не пытаться делать сложный rating inference.

---

# 15. Защита Recall от самообмана

Проблема covert recall:

пользователь может после reveal сказать:

> ну да, я это знал.

Поэтому использовать несколько механизмов.

Если Memory Target регулярно получает:

```text
Remembered
```

через Recall-Reveal, иногда проверять его через:

```text
hard Choice
near-twin discrimination
Find Target
reverse cue
```

Если там пользователь ошибается:

```text
понизить доверие к self-grade
```

Не надо показывать пользователю «ты врёшь».

Просто Session Composer чаще использует objective probes.

---

# 16. Recall нельзя показывать слишком часто подряд

5 секунд forced thinking существенно медленнее обычного Choice.

Не делать:

```text
Recall
Recall
Recall
Recall
```

Оптимальный rhythm:

```text
быстрые cards
быстрые cards
Recall
быстрые
быстрые
challenge
...
```

Например heuristic:

```text
Recall-Reveal ≈ 10–20% обычного feed
```

Это не жёсткая цифра — адаптировать под learning need.

---

# 17. New Knowledge — реализовать полноценный loop

Сейчас это одна из главных недостающих частей.

Новый Memory Target:

```text
PRETEST
```

например обычный Choice.

Если пользователь сразу знает:

```text
correct
→ максимум Good
→ продолжаем
```

Если не знает:

```text
wrong
→ пользователь сам находит правильный ответ
→ Encoding Moment
```

---

# 18. Encoding Moment

Для нового знания после ошибки не просто сразу переключать карточку.

На 1–2 секунды сделать маленький информационный reward.

Например:

```text
КАЛВИН КУЛИДЖ

30-й президент США

Единственный президент США,
родившийся 4 июля.
```

или для картины:

```text
«Олимпия»
Эдуар Мане

Картина вызвала скандал
на Парижском салоне 1865 года.
```

Не статья.

Не больше:

```text
1–2 коротких предложений
```

Если `Entity.summary` отсутствует:

не генерировать текст через LLM runtime.

Просто показать:

```text
объект
правильную связь
```

---

# 19. После Encoding — настоящий retrieval позже

После нового знания:

```text
2–5 unrelated cards
↓
retrieval probe
```

Не повторять мгновенно.

Probe должен отличаться.

Например:

```text
Pretest:
картина → автор

Later:
Find Monet's painting
```

или:

```text
Recall-Reveal
```

---

# 20. Error Loop должен стать законченным визуально

Сейчас есть confusion/retry инфраструктура.

Добавить ощущение closure.

Пример:

```text
Monet
→ пользователь выбрал Renoir ✕

через 4 cards:

та же / другая картина Monet
Monet vs Renoir
```

Если пользователь теперь правильно различил:

короткий subtle feedback:

```text
Разобрано ✓
```

или маленькое визуальное соединение:

```text
Моне ≠ Ренуар ✓
```

примерно 400–700 ms.

Не выдавать XP.

Это именно ощущение:

> я исправил конкретную путаницу.

---

# 21. Near-twin discrimination использовать активнее

Если confusion высокий:

```text
Monet ↔ Renoir
```

не надо всегда показывать:

```text
Monet
Renoir
Picasso
Da Vinci
```

Периодически делать почти чистую discrimination card:

```text
[картина]

Моне       Ренуар
```

Это должна быть специальная learning mechanic.

После серии успешных различений confusion постепенно decay.

---

# 22. Juice: correct feedback

Обычный first-try correct:

```text
tap
↓
button depress 70–100ms
↓
зелёная confirmation
↓
очень лёгкий scale 1 → 1.02 → 1
↓
next card
```

Общий delay около:

```text
250–350 ms
```

Не делать confetti на каждый правильный ответ.

---

# 23. Juice: wrong feedback

Wrong choice:

```text
option red
short horizontal shake
```

примерно:

```text
120–180ms
```

Никакого полного card shake.

Никакого громкого sound fail.

Пользователь продолжает искать правильный вариант.

---

# 24. Juice: milestones

Более заметные эффекты допустимы только для редких реальных событий:

```text
дневной learning goal достигнут
новый набор полностью покрыт
первый Memory Target достиг stability 30d
confusion полностью разобрана
```

Например:

```text
тонкий burst / glow / particles
600–900 ms
```

но без блокировки feed.

---

# 25. Sound

По умолчанию звук выключен.

Если sound включён:

- очень короткий UI click/correct;
- тихий;
- без агрессивного arcade sound.

Ошибки не должны звучать как наказание.

---

# 26. Haptics

Не строить UX вокруг `navigator.vibrate`, потому что iPhone PWA его нормально не поддерживает.

Если API существует:

```text
progressive enhancement
```

Если нет:

```text
ничего не ломается
```

Основной juice должен быть визуальным/tactile через движение UI.

---

# 27. Card transition

После завершённого atomic question:

текущая карточка:

```text
translateY(-6%..-12%)
opacity 1→0
```

следующая:

```text
translateY(4%..0)
opacity 0→1
```

примерно:

```text
180–240ms
```

Не делать длинные 500ms transitions после каждого ответа.

Feed должен ощущаться мгновенным.

---

# 28. Challenge entrance

Sort / более сложный Match / крупная Timeline задача:

перед challenge можно сделать очень короткий visual break:

```text
CHALLENGE
Хронология
```

на:

```text
400–600ms
```

без кнопки Continue.

Потом challenge.

Это помогает ритму ленты.

---

# 29. Daily goal не должен останавливать пользователя

После условных 15 retrievals:

```text
✓ Цель на сегодня выполнена
```

небольшой overlay.

Feed продолжает работать.

Не показывать:

```text
Занятие завершено
Вернуться
```

---

# 30. Добавить honest return hooks

На Home использовать реальные данные.

Например:

```text
6 знаний начинают забываться

Моне ↔ Ренуар
почти разобраны

3 новых объекта готовы к открытию

До закрепления всей подборки
«Президенты США» осталось 4

Сегодня 5 знаний могут перейти
за горизонт 30 дней
```

Не показывать все одновременно.

Выбирать один наиболее meaningful hook.

---

# 31. Улучшить Progress motivation

Не XP.

Сделать особенно заметными:

```text
Coverage
Помню сейчас
Закреплено ≥7d
≥30d
≥90d
```

Добавить milestone transitions:

```text
29 / 47
↓
30 / 47
```

чтобы изменение ощущалось.

Можно показать:

```text
Сегодня укреплено:
+4 знания ≥30 дней
```

если это реально следует из данных.

---

# 32. Pack conflict resolver

Текущая версия уже защищает user modifications от overwrite.

Но нужен UI для конфликта:

```text
Ваша версия:
Y

Версия пакета:
X

[Оставить мою]
[Принять из пакета]
```

При необходимости:

```text
Подробнее
```

Не заставлять пользователя разбираться с этим во время Study Feed.

---

# 33. Удалить legacy typed Recall

Из проекта всё ещё необходимо вычистить старый путь:

```text
input text recall
legacy createRetry → recall
старые UI-компоненты
```

Никакая reachable production code path не должна создавать typed Recall.

Тест:

```text
document.querySelector('input[type=text]')
```

не обязательно буквально должен быть пуст для всего приложения, потому что Knowledge Editor имеет text input.

Но **StudyFeed никогда не должен показывать клавиатуру для ответа на learning task**.

---

# 34. Удалить legacy Session flow

Если новый:

```text
composeFeed()
```

полностью заменяет `generateSession()` в production StudyFeed:

старый generator либо:

- удалить;
- либо чётко вынести в tests/legacy compatibility.

Не держать два конкурирующих learning engine без причины.

---

# 35. Session buffer

Feed должен работать непрерывно.

Например:

```text
buffer = 12–20 cards
```

когда осталось:

```text
5
```

достроить следующие.

Пользователь этого не видит.

Не генерировать бесконечный массив в памяти.

---

# 36. Preload

Для следующих карточек preload:

```text
next 2–4 media
```

чтобы изображения никогда не моргали белым после ответа.

Приоритет:

```text
next card
next+1
next+2
```

---

# 37. Swipe mechanics должны быть безопасными

Recall swipe:

```text
touch-action: pan-y?
```

аккуратно настроить, чтобы PWA не конфликтовал с browser gestures.

Не активировать swipe от микроскопического движения.

Использовать:

```text
distance threshold
+
velocity threshold
```

и тестировать на реальном iPhone.

Не перехватывать системный edge swipe «назад» возле левого края, если это возможно избежать.

---

# 38. Reduced Motion

При:

```css
prefers-reduced-motion: reduce
```

убрать:

```text
rotation
shake
spring
large translate
particles
```

Оставить:

```text
color state
opacity
instant transition
```

Learning semantics не меняются.

---

# 39. Accessibility

Даже если mobile-first:

- interactive target минимум около 44×44 CSS px;
- цвета correct/wrong должны иметь также icon/state, а не только green/red;
- Recall swipe должен иметь keyboard/fallback controls на desktop/accessibility;
- screen reader должен услышать reveal и результат;
- disabled wrong options не должны исчезать.

---

# 40. Не трогать сейчас

Не переписывать:

```text
knowledge graph
PropertyDefinition
EntityTypeDefinition
Dexie storage
packs architecture
FSRS core
ReviewEvents
backup model
GitHub Pages
PWA architecture
```

кроме конкретных багов, необходимых для этой итерации.

---

# 41. Acceptance tests: Choice

Добавить tests:

### First try correct

```text
tap correct
→ 1 ReviewEvent
→ correct=true
→ FSRS Good
→ auto advance
```

### Wrong then correct

```text
tap wrong
→ no ReviewEvent yet
→ wrong option red
→ correct not revealed

tap correct
→ exactly 1 ReviewEvent
→ correct=false
→ chosen sequence preserved
→ FSRS Again
```

### Two wrong then correct

всё ещё:

```text
1 ReviewEvent
1 FSRS update
2 confusion updates
```

---

# 42. Acceptance tests: Slider

```text
move slider
→ no answer submitted

release pointer
→ no answer submitted

move again
→ no answer submitted

tap Confirm
→ exactly 1 ReviewEvent
```

Проверить также double tap защиты/idempotency.

---

# 43. Acceptance tests: Recall

```text
open Recall card
→ answer hidden

0–4.999 sec
→ answer remains hidden

5 sec
→ answer automatically revealed

swipe right
→ remembered
→ max grade Good

swipe left
→ missed
→ Again
```

До reveal swipe не должен засчитываться.

---

# 44. Acceptance test: No keyboard learning

Пройти mixed feed:

```text
Choice
Recall
Categorize
Match
Missing
Timeline
Sort
```

и ни один learning task не должен требовать ввод текста.

---

# 45. Acceptance test: Timeline leak

Создать несколько дат.

Проверить:

```text
initial slider value
```

не зависит от конкретного correctYear.

Если пользователь ничего не знает и просто жмёт Confirm на initial value, это не должно систематически попадать в tolerance.

---

# 46. Acceptance test: New Knowledge

```text
new target
→ pretest

wrong
→ user finds correct answer
→ encoding moment
→ microfact
→ no lapse as old knowledge

2–5 cards later
→ retrieval probe
```

Проверить отдельно, что failed initial pretest не считается обычным FSRS lapse.

---

# 47. Acceptance test: Error Repair

```text
Monet answered Renoir

after several cards:
target returns

successful discrimination
→ confusion decays
→ repair does not incorrectly double-update FSRS
```

---

# 48. После реализации

Запустить:

```text
pnpm test
pnpm build
```

и исправить regression.

В итоговом отчёте перечислить:

```text
1. Choice multi-attempt flow;
2. ReviewEvent semantics;
3. Timeline confirm;
4. Timeline leak fix;
5. Recall 5-second timer;
6. Recall swipe implementation;
7. New Knowledge loop;
8. error/repair changes;
9. juice/microinteractions;
10. return hooks;
11. legacy code removed;
12. tests;
13. build result;
14. что обязательно проверить на реальном iPhone.
```

Не останавливайся на описании или макете. Измени проект.

Главные правила этой версии:

> **Неправильный Choice не рассказывает ответ — пользователь сам его находит.**

> **Slider никогда не отправляет ответ просто от отпускания пальца.**

> **Recall = 5 секунд настоящего воспоминания → автоматический reveal → свайп.**

> **Любое лишнее нажатие должно иметь причину.**