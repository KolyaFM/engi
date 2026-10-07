## Project Structure (File Tree):
```text
./
├── .github
│   └── workflows
│       └── deploy-pages.yml
├── .gitignore
├── README.md
├── UPDATE_V2.md
├── VALIDATION.md
├── docs
│   └── superpowers
│       ├── plans
│       │   ├── 2026-10-06-learning-v2.2.md
│       │   └── 2026-10-06-study-feed-v2.1.md
│       └── specs
│           ├── 2026-10-06-learning-v2.2.md
│           └── 2026-10-06-study-feed-v2.1.md
├── index.html
├── package.json
├── postcss.config.js
├── public
│   └── favicon.svg
├── scripts
│   ├── build-engi-pack.mjs
│   └── check-learning.mjs
├── src
│   ├── App.tsx
│   ├── components
│   │   ├── knowledge
│   │   │   ├── ConflictResolver.tsx
│   │   │   ├── DeckCard.tsx
│   │   │   ├── DeckCatalog.tsx
│   │   │   ├── DeckDetailView.tsx
│   │   │   ├── DeckKnowledgeBrowser.tsx
│   │   │   ├── EntityEditor.tsx
│   │   │   ├── EntityLearningPanel.tsx
│   │   │   ├── EntityPage.tsx
│   │   │   ├── KnowledgeBrowser.tsx
│   │   │   ├── KnowledgeImage.tsx
│   │   │   ├── PropertyEditor.tsx
│   │   │   ├── RelationPicker.tsx
│   │   │   ├── decks.css
│   │   │   └── entity-learning.css
│   │   ├── progress
│   │   │   └── ProgressDashboard.tsx
│   │   ├── settings-panel.tsx
│   │   ├── study
│   │   │   ├── ChoiceCard.tsx
│   │   │   ├── ObjectIntroCard.tsx
│   │   │   ├── RecallRevealCard.tsx
│   │   │   ├── SortChallengeCard.tsx
│   │   │   ├── StopStudyCard.tsx
│   │   │   ├── StudyFeed.tsx
│   │   │   ├── TimelineCard.tsx
│   │   │   ├── learning22.css
│   │   │   ├── study-feed.css
│   │   │   └── useStudyPreferences.ts
│   │   └── ui
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── progress.tsx
│   │       ├── select.tsx
│   │       └── tabs.tsx
│   ├── db
│   │   ├── engi-db.ts
│   │   ├── learning-migration.ts
│   │   ├── migrations.ts
│   │   └── repositories.ts
│   ├── lib
│   │   ├── engi
│   │   │   ├── engine.ts
│   │   │   ├── indexes.ts
│   │   │   ├── knowledge
│   │   │   │   ├── conflicts.ts
│   │   │   │   ├── decks.ts
│   │   │   │   ├── motivation.ts
│   │   │   │   ├── progress.ts
│   │   │   │   └── properties.ts
│   │   │   ├── learning
│   │   │   │   ├── bootstrap.ts
│   │   │   │   ├── knowledge-unit.ts
│   │   │   │   └── mastery.ts
│   │   │   ├── questions
│   │   │   │   ├── distractors.ts
│   │   │   │   ├── exemplar-selector.ts
│   │   │   │   ├── question-templates.ts
│   │   │   │   ├── recipe-factory.ts
│   │   │   │   └── timeline.ts
│   │   │   ├── session
│   │   │   │   ├── candidate-pool.ts
│   │   │   │   └── composer.ts
│   │   │   ├── types.ts
│   │   │   └── validate.ts
│   │   └── utils.ts
│   ├── main.tsx
│   ├── media
│   │   ├── media-store.ts
│   │   └── use-media-url.ts
│   ├── pwa
│   │   └── update-manager.ts
│   ├── services
│   │   ├── backup-service.ts
│   │   ├── knowledge-service.ts
│   │   ├── learning-service.ts
│   │   ├── pack-format.ts
│   │   ├── pack-service.ts
│   │   ├── pack-worker.ts
│   │   ├── review-commit.ts
│   │   ├── storage-health.ts
│   │   └── trainer-service.ts
│   └── styles.css
├── tests
│   ├── adaptive22.test.ts
│   ├── browser.mjs
│   ├── deck-components.test.ts
│   ├── deck-detail.test.ts
│   ├── deck-integration.test.ts
│   ├── decks-style.test.ts
│   ├── decks.test.ts
│   ├── feed.test.ts
│   ├── fixtures
│   │   └── seed.json
│   ├── helpers22.ts
│   ├── learning22.test.ts
│   ├── local.test.ts
│   ├── motivation.test.ts
│   ├── production.mjs
│   ├── recall22-browser.mjs
│   ├── review22.test.ts
│   ├── templates22.test.ts
│   └── v2.test.ts
├── tsconfig.json
└── vite.config.ts
```

### File: res://.gitignore
```
node_modules/
dist/
*.tsbuildinfo
*.engi
*.engi-backup
packs/
dist-packs/
pack-source/
!tests/fixtures/*.engi
/.ai_backups

```

### File: res://index.html
```html
<!doctype html><html lang="ru"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/><meta name="theme-color" content="#184be7"/><meta name="apple-mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-title" content="Энги"/><link rel="icon" href="%BASE_URL%favicon.svg"/><link rel="apple-touch-icon" href="%BASE_URL%icon... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

```

### File: res://package.json
```json
{
  "name": "engi",
  "version": "2.2.0",
  "private": true,
  "engines": {
    "node": ">=22.13.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "node --import tsx scripts/check-learning.mjs && node --import tsx --test tests/*.test.ts",
    "pack:build": "node --import tsx scripts/build-engi-pack.mjs",
    "test:browser": "node tests/browser.mjs",
    "test:production": "node tests/production.mjs",
    "test:recall": "node tests/recall22-browser.mjs"
  },
  "dependencies": {
    "@zip.js/zip.js": "^2.8.0",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "dexie": "^4.0.11",
    "lucide-react": "^1.31.0",
    "radix-ui": "^1.6.7",
    "react": "19.2.6",
    "react-dom": "19.2.6",
    "sonner": "^2.0.8",
    "tailwind-merge": "3.6.0",
    "ts-fsrs": "^5.4.2",
    "workbox-window": "^7.4.1",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.2.1",
    "@types/node": "22.19.19",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.2",
    "fake-indexeddb": "^6.0.0",
    "playwright": "1.62.1",
    "tailwindcss": "4.2.1",
    "tsx": "^4.20.0",
    "tw-animate-css": "^1.4.0",
    "typescript": "5.9.3",
    "vite": "8.0.13",
    "vite-plugin-pwa": "^1.0.0"
  },
  "type": "module",
  "packageManager": "pnpm@10.30.1"
}

```

### File: res://postcss.config.js
```javascript
export default {plugins:{'@tailwindcss/postcss':{}}};

```

### File: res://README.md
```markdown
# Энги 2.2

Локальный тренажёр знаний с лентой полезных повторений. React + TypeScript + Vite, Dexie/IndexedDB, Cache Storage, настоящий ts-fsrs и Workbox PWA. Сервер, учётная запись и внешняя генерация ответов не нужны.

Обновление реализует новое ТЗ v2.2: независимая память каждого свойства, знакомство с объектом и интервальное обучение. Изменения и порядок обновления: [UPDATE_V2.md](UPDATE_V2.md). Результаты проверок и приёмка на iPhone: [VALIDATION.md](VALIDATION.md).

## Запуск

Требуется Node.js 22.13+ и pnpm 10.30.1. В корне проекта:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Открыть `http://localhost:5173/engi/`. Для рабочей PWA:

```powershell
pnpm test
pnpm build
pnpm preview
```

Preview: `http://localhost:4173/engi/`. Готовая сборка находится в `dist/`. Service worker включён в production; в dev он выключен. Начальная установка зависимостей и загрузка приложения требуют сети, дальнейшая практика работает локально.

Разные адреса сайта имеют отдельные хранилища. Для обновления с сохранением данных используйте прежний адрес приложения. Для переноса между адресами или устройствами нужны `.engi-backup` и исходные пакеты `.engi`.

## Практика

Семь форматов: Choice, Recall-Reveal, Match, Categorize, Missing, Timeline и Sort. Ответы в ленте не требуют текстового ввода.

Неверный вариант становится красным и недоступным, остальные остаются активными; правильный не раскрывается. Карточка завершается после правильного выбора, первая попытка определяет результат обучения. В историю пишется одно событие с последовательностью попыток и уникальными ошибочными вариантами.

Recall открывает ответ через 5 секунд активного времени или по кнопке «Показать сейчас». Нажатие только раскрывает ответ; оценка выполняется отдельно. Таймер приостанавливается в фоне, в подробностях и до загрузки изображения. После раскрытия: вправо — вспомнил, влево — не вспомнил. Короткий жест возвращает карточку. Для доступности есть компактные кнопки, настройка и клавиатурные стрелки.

Timeline использует общую шкалу для поля и группы объектов; начальная позиция не привязана к ответу карточки. Отпускание пальца и стрелки лишь меняют значение. Ответ отправляет кнопка «Подтвердить». Timeline/Sort/Missing являются диагностическими и не меняют FSRS.

Перед новым объектом показывается знакомство со свойствами: красный, оранжевый, жёлтый, зелёный или ★. Выбор сохраняется и задаёт старт, без успешного ответа и FSRS review. Неудачная первая проверка не создаёт lapse. Краткий контекст из базы помогает познакомиться с фактом, затем отложенная карточка проверяет его снова. Быстрое исправление существующей памяти до срока не обновляет FSRS повторно. С... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

После каждого ответа лента выбирает следующий актуальный вопрос. Нет автоматического повторения знаний до срока ради заполнения ленты. Свойства одного объекта разнесены; дневной бюджет — 3 новых объекта, при большой очереди — 1. Когда полезные вопросы закончились, доступны ещё 2 новых объекта, свободная практика или завершение. Свободная практика до срока не изменяет расписание FSRS. Изображения п... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

## Знания и сохранность

Объекты, типы, поля, связи, теги, изображения и источники можно редактировать локально. Новые типы и поля работают без изменения кода. Непроверенные и неоднозначные факты остаются в базе, но исключаются из неподходящих заданий.

Dexie использует схему v3. Старые Memory Target IDs консервативно объединяются в KnowledgeUnit; соответствия сохраняются отдельно, исходная история остаётся неизменной. Ответ, память, событие и состояние ленты записываются одной транзакцией; повтор task.id не дублирует результат. История экрана ограничена последними 1000 событиями, backup содержит все.

Конфликты обновления пакетов доступны в «Знаниях» и «Прогрессе»: сравнить версии, оставить свою либо принять пакет. Изменение значения факта сбрасывает только его цели памяти; история остаётся. Принятое решение оставить свою версию запоминается и не повторяется при том же обновлении пакета.

Настройки → «Сохранить резервную копию». Копия v2 содержит прогресс, историю, настройки, личные знания, определения, ручные правки и собственные изображения. Изображения пакетов восстанавливаются повторным импортом `.engi`. Старые пакеты и копии v1 принимаются. Очистка данных сайта удаляет локальное хранилище.

## Пакеты .engi

Подготовьте отдельную папку с `manifest.json`, `bundle.json` и файлами `media/`. Схема пакета — 1 или 2; пользовательские типы/поля требуют 2. Образец Bundle находится в `tests/fixtures/seed.json`; внешние изображения нужно заменить локальными файлами.

```json
{
  "format": "engi-pack",
  "schemaVersion": 2,
  "packId": "my.collection",
  "packVersion": 1,
  "name": "Моя подборка",
  "createdAt": "2026-10-06T12:00:00Z",
  "files": []
}
```

```powershell
pnpm pack:build ./pack-source ./dist-packs/my-collection.engi
```

Факты пакетов требуют HTTPS-источника, изображения — источника, лицензии и PNG/JPEG/WebP внутри архива. Builder валидирует ссылки и изображения, считает SHA-256 и формирует ZIP. Стабильные entity/fact IDs нельзя переназначать; для обновления увеличивайте packVersion.

Лимиты: пакет до 512 MiB, изображение и JSON до 16 MiB, максимум 50000 файлов. Проверяются пути, хеши, MIME, дубли, ссылки и подозрительное сжатие. Импорт работает в отдельном worker; отмена возможна до атомарного сохранения. Фактическая вместимость зависит от устройства.

## Браузерные проверки

```powershell
pnpm exec playwright install chromium
# Запустить pnpm dev в другом терминале
pnpm test:browser
# После pnpm build запустить pnpm preview в другом терминале
pnpm test:production
```

`ENGI_BROWSER_PATH` позволяет задать установленный Chromium. `ENGI_TEST_URL` и `ENGI_PRODUCTION_URL` меняют адреса проверок. Браузерные тесты используют отдельные временные контексты и тестовые данные.

```

### File: res://tsconfig.json
```json
{"compilerOptions":{"target":"ES2022","lib":["DOM","DOM.Iterable","ES2022"],"module":"ESNext","moduleResolution":"Bundler","jsx":"react-jsx","strict":true,"skipLibCheck":true,"esModuleInterop":true,"resolveJsonModule":true,"noEmit":true,"allowImportingTsExtensions":true,"paths":{"@/*":["./src/*"]},"types":["vite/client","vite-plugin-pwa/client","node"]},"include":["src","vite.config.ts","tests"]}

```

### File: res://UPDATE_V2.md
```markdown
# Энги 2.2 — отчёт обновления

Реализовано новое ТЗ v2.2. Исходная версия 2.1 сохранена отдельно. Приложение остаётся локальным: без сервера, аккаунта и генерации ответов.

1. **KnowledgeUnit.** Независимая ассоциация «объект → свойство»; идентификатор `ku:fact:<factId>:forward`. Форматы и обычные подсказки изображением/именем используют одну память. Обратное направление отдельно; распознавание объекта и визуальный автор произведения — отдельные навыки.
2. **Старые цели.** Объединение консервативное: ближайший срок, минимальная stability, максимальная difficulty. Исходные строки архивируются через `legacyOf`; история остаётся с исходными IDs. `targetMappings` сохраняет соответствия; повторная миграция не удваивает статистику.
3. **Initial familiarity.** `initialFamiliarity`, `triagedAt` и `bootstrap` в Memory. Выбор на знакомстве сохраняется сразу; создание стартовой памяти не добавляет Good, успешную проверку или событие review. Неотмеченные поля красные.
4. **Bootstrap.** После знакомства красный probe через 3 посторонние карточки, оранжевый/жёлтый через 5, зелёный через 8. После объективного успеха интервалы: красный 1/1/1 день, оранжевый 2/3, жёлтый 3/7, зелёный 7. Ошибка возвращает к дневному закреплению. Если посторонних карточек недостаточно, следующий probe доступен завтра; искусственных вопросов для заполнения нет.
5. **FSRS.** Объективные проверки проходят настоящий ts-fsrs. Bootstrap временно задаёт due; после 3/2/2/1 успешных шагов соответственно дальнейший срок полностью определяет FSRS. Самооценка Recall не заменяет объективное доказательство при bootstrap.
6. **Повторы.** После каждого ответа очередь пересчитывается из актуальных состояний. Нет случайного долива недолжных знаний. Подготовка медиа выполняется отдельно; дубликат отправки не создаёт повторное событие.
7. **Sibling bury.** Между вопросами одного объекта минимум 6 других карточек; в блоке из 15 предпочтителен один вопрос на объект, пока есть альтернативы. Категории мягко перемежаются; приоритет срока сохраняется.
8. **Новые объекты.** 3 в локальный день, при 20+ due — 1. Бюджет хранится в appMeta и переживает перезапуск. На экране завершения можно явно добавить 2. Новое свойство известного объекта получает компактное знакомство.
9. **Шаблоны.** `src/lib/engi/questions/question-templates.ts`: естественные вопросы для встроенных полей и нейтральный шаблон для остальных.
10. **Custom Property.** Редактор поля содержит «Как спрашивать?», шаблон с `{subject}` и предпросмотр. Отдельно настраиваются reverse/timeline/sort. Обратный вопрос требует явного разрешения, шаблона и однозначного отношения; шаблоны сохраняются в пакетах и backup.
11. **Early reveal.** Кнопка «Показать сейчас» завершает ожидание раньше 5 секунд, сохраняя фактическое активное время и `earlyReveal`. Само раскрытие не является оценкой. Ответ оценивается свайпом или кнопкой после раскрытия.
12. **Сложность.** Четыре ступени по этапу обучения, stability, retrievability, ошибке и скорости. Слабое знание получает объективное распознавание; прочное — более близкие варианты и Recall.
13. **Distractors.** Тип и допустимые ответы проверяются; личные путаницы имеют приоритет. Сходство категорий зависит от ступени сложности; ранние вопросы проще, поздние ближе.
14. **Exemplars.** Только разрешённые роли и `learningExemplar !== false`; мемы и архивные медиа исключены. Последние 3 ID по возможности не повторяются. Для малого пула предусмотрен корректный fallback.
15. **Latency.** Первая попытка сохраняется отдельно от времени вынужденного исправления. Скользящая оценка влияет на формат и поддержку, без произвольного умножения stability FSRS.
16. **Suspend.** ★ относится к одному знанию, сохраняет прошлую память и исключает его из обучения/активного прогресса. Снятие сохраняет прежний этап и делает знание доступным для проверки. Панель объекта показывает текущую, вычисленную освоенность и подробности свойств.
17. **Free Practice.** Явный выбор после завершения; due-вопросы оцениваются обычно, вопросы до срока получают событие `practice` и не изменяют FSRS. Быстрое исправление также не переносит срок повторно.
18. **Миграции.** Dexie v3 и таблица targetMappings. Совместимость v1/v2, старых пакетов и backup; восстановление backup до повторного импорта контента поддерживается. Факты и исходная история не переписываются.
19. **Тесты.** Добавлены миграция v2→v3 и повторный restore/reimport, familiarity без review, четыре bootstrap плана и handoff, независимость свойств, очередь/spacing/budget, early reveal, остановка/практика, suspend, шаблоны, медиа, latency и прогресс. Сохранены проверки пакетов, конфликтов, атомарности и rollback.
20. **pnpm test.** Итоговые числа и команды приведены в VALIDATION.md.
21. **pnpm build.** TypeScript и production/PWA сборка проверены; Service Worker включён. Предупреждение о размере основного JS остаётся.
22. **iPhone.** Нужна физическая приёмка Safari/PWA: безопасные зоны, фон и закрытие, жесты, VoiceOver, импорт/backup через «Файлы», офлайн и обновление. Чеклист — VALIDATION.md.
23. **Колоды знаний (Deck-First).** Раздел «Знания» переведён на колодочную архитектуру: тематические карточки с миниатюрами ключевых объектов, метриками памяти и быстрым запуском сессии. Внутри колоды — поиск, фильтры по типам объектов, привязка объектов и управление тегами. Системная папка «Неразобранное» группирует объекты без тегов. Доступно быстрое переключение на общий реестр всех объектов.

## Обновление и запуск

Перед обновлением сохраните `.engi-backup`. Распакуйте новую версию, выполните команды из README.md и используйте прежний адрес сайта: данные привязаны к origin. Для переноса на другой адрес восстановите backup и повторно импортируйте исходные `.engi` пакеты. Не очищайте данные сайта при обновлении.

Точное ТЗ: `docs/superpowers/specs/2026-10-06-learning-v2.2.md`.

```

### File: res://VALIDATION.md
```markdown
# Проверки Энги 2.2

Дата: 6 октября 2026. Windows, Node 24.21, pnpm 10.30.1. Реальный Chromium, мобильный экран 393×852. Физический iPhone/Safari не проверен.

## Автоматические результаты

- `pnpm test`: **60/60** тестов проходят; генератор дополнительно проверил **810** карточек семи форматов.
- `pnpm build`: TypeScript и production/PWA успешно. Созданы `dist/sw.js`, Workbox, manifest и отдельный pack worker. Предупреждение о JS chunk >500 kB остаётся.
- `pnpm test:recall`: **5/5** изолированных браузерных сценариев: раннее раскрытие без оценки, ровно 5000 мс, повтор записи после ошибки с исходным временем, пауза/фон и блокировка busy.
- `pnpm test:production`: проходит реальный импорт пакета через worker, управление service worker, reload без сети, изображение из Cache Storage, знакомство с тремя объектами без reviews, проверка после смены дня и точное продолжение после offline reload.
- `pnpm test:browser`: **14/14** проходят: прежние сценарии ошибок/жестов/таймеров/семи форматов, знакомство с autosave/reload и бюджетом 3→5, раннее раскрытие без события и управление Suspend в панели объекта.
- Независимая проверка исправлений: переход review→Suspend→review сохраняет этап; обратный вопрос получает компактное знакомство с правильным ответом и не считается новым объектом.

Проверены сохранность исходной истории при v1/v2→v3, восстановление backup до импорта пакетов, идемпотентность, точный rollback Memory/session при сбое события, ошибки пакетов, личные изображения, конфликты обновлений. Изменения тестов сохраняют эти проверки.

В небольшом новом наборе первая сессия может закончиться после знакомства с тремя объектами, без retrieval: строгие интервалы не позволяют создавать искусственные вопросы. Пробы будут доступны завтра; можно явно открыть ещё два объекта или выбрать свободную практику. При нехватке посторонних объектов due-свойства одного объекта тоже могут ждать следующего блока/сессии. Экран завершения сообщает об... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

## Проверка на физическом iPhone

1. Установить PWA на домашний экран. Проверить safe areas, небольшую высоту, увеличение шрифта и длинные имена/значения. Длинное знакомство прокручивается, «Готово» доступно.
2. На знакомстве выбрать четыре цвета и ★ для разных свойств. Полностью закрыть и открыть PWA: выбор сохранён. Завершить: нет review/успешных ответов; ★ не спрашивается.
3. Проверить красное/оранжевое/жёлтое/зелёное свойство в следующие дни; сроки независимы. Самооценка не объявляется доказанной памятью. Ошибка зелёного возвращает к learning.
4. Пройти due-карточки: свойства одного объекта не идут подряд; после окончания нет случайных повторов. Проверить три новых объекта, явное добавление двух, смену дня и budget1 при большой очереди.
5. Choice: две ошибки, reload, исправление. Варианты красные/недоступные, правильный заранее не раскрыт; одно событие с первой ошибкой и без Good за вынужденное исправление. Repair не переносит срок повторно.
6. Recall: через 1–2 секунды «Показать сейчас»; до оценки нет события. Затем свайп. В другом задании дождаться 5 секунд. Фон, подробности и закрытие PWA не должны добавлять скрытое время.
7. Проверить короткий, диагональный и полный свайп, прокрутку высокой карточки, системный жест края и быструю повторную отправку. До раскрытия оценка недоступна.
8. Включить VoiceOver и уменьшение движения: порядок фокуса, названия цветов, кнопки ≥44 px, чтение вопроса/ответа, выход из подробностей.
9. В объекте посмотреть текущую освоенность, last/due/stability; отложить одно свойство и вернуть. История сохранена, активный прогресс не считает ★ освоенным.
10. Проверить свободную практику до срока: расписание не меняется. Due-вопрос в этом режиме оценивается обычно. Прогресс отличает открытые знания от unseen и suspend.
11. Создать своё поле и шаблон с `{subject}`, проверить предпросмотр, обратный шаблон и сохранение после backup. Проверить различные допустимые изображения и отсутствие мемов в вопросах.
12. Timeline/Sort/Missing: диагностика не меняет FSRS; шкала отправляет ответ только по «Подтвердить», перетаскивание/кнопки Sort работают после reload.
13. Импортировать большой `.engi` из «Файлы», проверить сбой/отмену. После полной загрузки авиарежим, закрытие и запуск: изображения и ответы доступны.
14. Обновить пакет с ручной правкой, сравнить/принять любую версию. Проверить сохранность чужих свойств и историю; повторное обновление не возвращает признанный конфликт.
15. Сохранить `.engi-backup` через «Файлы»/share sheet, восстановить на тестовом адресе и повторно импортировать пакеты. Проверить личные изображения, данные, цвета, историю и mappings.
16. После резервной копии обновить оболочку на прежнем origin. Миграция сохраняет память; обновление не должно прерывать активную сессию.

```

### File: res://vite.config.ts
```typescript
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
import {fileURLToPath} from 'node:url';
export default defineConfig({base:'/engi/',resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},plugins:[react(),VitePWA({registerType:'prompt',injectRegister:false,includeAssets:['favicon.svg','icon-192.png','icon-512.png'],manifest:{name:'Энги — тренажёр знаний',short_name:'Энги',lang:'ru',display:'standalone',start_url:'/engi/',scope:'/engi/',theme_color:'#184be7',background_co... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

```

### File: res://.github/workflows/deploy-pages.yml
```yaml
name: Deploy Engi to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.30.1
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4

```

### File: res://docs/superpowers/plans/2026-10-06-learning-v2.2.md
```markdown
# Engi 2.2 learning implementation plan

> **For agentic workers:** Use superpowers:executing-plans for integrated learning changes. Independent question-template and presentation work can use superpowers:dispatching-parallel-agents after contracts are written below.

**Goal:** Property-specific, spaced local learning with object triage, conservative migration, bootstrap and real FSRS scheduling.
**Architecture:** Keep existing Memory/card storage and review atomicity; add optional learning metadata, explicit KnowledgeUnits and a legacy mapping table in Dexie v3. Composer selects one current eligible task; media lookahead is separate. Intro is content exposure and never a review.
**Tech Stack:** existing React/TypeScript/Vite/Dexie/ts-fsrs.
**Spec:** docs/superpowers/specs/2026-10-06-learning-v2.2.md.

## Constraints and decisions
- Ordinary fact forward cue variants share ku:fact:<factID>:forward. Reverse is distinct. Artwork author visual cue is a separate skill suffix :visual. Identity is ku:entity:<id>:visual_identity.
- Legacy rows remain archived by legacyOf, original event IDs/payloads untouched. targetMappings relates old IDs to units. Merge earliest due/lower stability/higher difficulty, max attempts and conservative correct count, summed confusion; no synthetic review. Restore/reimport reconciles mappings.
- Familiarity red/orange/yellow/green/suspended; objective triage proof absent. Default unselected red. Intro persists per-unit selections and marks entity exposure in appMeta, no FSRS success/event.
- Red 1 day, orange 2 then3 days, yellow3 then7 days, green7 days; after respective verified success steps (red3/orange2/yellow2/green1) real subsequent FSRS reviews determine intervals. Failures demote to red learning, next day; repairs never reschedule.
- Intro probes delayed3 cards red,5 orange/yellow,8 green; if too few unrelated candidates, finish honestly and probe due next day. No dummy cards consume spacing.
- Siblings buried6 unrelated cards and once per15 ordinary block when alternatives available. No random fallback in main. Daily new entity budget3, reduced1 for20+ due, persisted per local day; explicit +2 grant.
- Recall early reveal persists revealed:true, earlyReveal:true with real elapsed <=5000, not a grade.
- Memory optional status, initialFamiliarity, triagedAt, bootstrap {successes,probeAfterCards,sessionId}, objectiveReviews, lastReviewAt,lastOutcome,lastFailureAt,latencyEmaMs,recentMediaIds. Session adds intro?, exhausted?, newGranted?, diagnosticSeen?, ordinaryCount?.
- Question registry and custom promptTemplates {forward,reverse,timeline,sort}; no reverse without explicit template and unique relation. Recipe.prompt computed per actual item; mediaRoles optional.

## Review focus
- Backup before content and later reimport must map legacy progress once, without losing events or double-merging counts.
- Reject stale queued/suspended/no-longer-due tasks atomically, never leave unusable blank screen.
- Intro close/reopen retains selected colors; default triage cannot produce real Good.
- Limited corpus must reach stopping state, not relax siblings into spam.
- First-attempt latency survives incorrect attempts/reload; early reveal remains ungraded until explicit answer.

## Phases
- [x] A: KnowledgeUnit, migration, backup compatibility; failing migration tests, implement, test/build.
- [x] B/C: triage + suspend service, bootstrap and FSRS adapter; failing familiarity/repair tests, implement, test/build.
- [x] D/E: dynamic scheduler, invalidation, siblings, tags, daily budget, stop/practice; failing eligibility tests, implement, test/build.
- [x] F/G: templates/editors and early reveal; failing template and browser tests, implement, test/build.
- [x] H/I: mastery-based recipes/distractors/latency/exemplars, unit property UI/progress; failing rotation/mastery tests, implement, test/build.
- [x] J: end-to-end intro→probe→repair→stop/practice, browser/offline/backup/migration; fresh review, clean updated ZIP, 22-point report/iPhone checklist.

No git repository; v2.1 preserved in previous archive and work/engi. Implement in isolated work/engi22.

## Final verification
60/60 unit/integration tests; 810 valid generated questions; 14/14 browser acceptance; 5/5 isolated Recall checks; actual production worker/offline/PWA test; TypeScript + Vite/PWA build. Independent review fixes: suspendedFrom, direction-aware reverse Intro/source ownership, honest stopping copy. Physical iPhone acceptance remains manual.

```

### File: res://docs/superpowers/plans/2026-10-06-study-feed-v2.1.md
```markdown
# Study Feed 2.1 Implementation Plan

> **For agentic workers:** Execute inline using superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Implement the newer supplied learning UX specification in the existing Engi application.
**Architecture:** Preserve Dexie v2, stable IDs, pack/backup models and FSRS. Persist incomplete choice attempts in activeSessions, commit one review on completion, and separate presentation into reusable cards.
**Tech Stack:** React, TypeScript, Vite, Dexie, ts-fsrs; Node tests and real-browser Playwright checks.
**Spec:** `docs/superpowers/specs/2026-10-06-study-feed-v2.1.md`

## Global Constraints
- New supplied specification overrides older Research where contradictory.
- No keyboard answers, XP, runtime LLM, accounts or architecture rewrite.
- Recall reveal after 5000 ms; grading only after reveal.
- Choice corrections: no event until correct; first attempt determines review result.
- Failed new pretest never creates an FSRS lapse; later retrieval establishes memory.
- One discrete option contributes at most once per card; one review per task ID.
- All old content, events, memories, v1/v2 packs and backups remain readable.

## Review Focus
- Closing/reopening with unfinished attempts must preserve red options and Recall/timeline state.
- Repeated taps and write failures must never create multiple events or lose the correct result.
- Background tabs and missing images must not consume the recall thinking interval.
- Queued tasks may have stale "new" reasons; encoding must use actual memory existence.
- Pack conflict acceptance must validate the final graph and invalidate only changed fact values.

## Tasks

### 1. Review semantics and persisted interactions
Files: `types.ts`, `engi-db.ts`, `trainer-service.ts`, new `services/review-commit.ts`, `tests/feed.test.ts`.
Interface: answer(input) returns pending state or committed feedback; session.interaction stores attempts/reveal timing/slider/order. Review metadata includes attemptSequence, wrongChoices, attemptCount, firstTryCorrect. Preserve append-only event idempotency.
- [x] Add and run failing acceptance tests for no event on wrong tap, wrong→wrong→correct, pretest, concurrent final taps, resumed attempts and transaction rollback.
- [x] Implement incremental sessions and single review commit; collect all wrong entity options once, no forced-correct Good, delayed repair and self-grade calibration.
- [x] Run service tests and existing storage/migration/backup regression tests.

### 2. Composer and timeline context
Files: `session/composer.ts`, new `questions/timeline.ts`, recipe factory, engine; remove legacy generator/service paths.
Interface: Task.timeline {min,max,initial}; Task.pretest; Memory.selfReport calibration. repairTask carries target + unique wrong options and changes format or uses two-option discrimination.
- [x] Add and run failing tests for shared neutral timeline scale, mixed recall spacing, objective probes, small corpus continuation and stable target IDs.
- [x] Implement context ranges, 10–20% spaced recall heuristic, near-twin cards, safe small-pool cooldown fallback and bounded repair/buffers.
- [x] Move old batch generation out of production, update previous tests to current feed semantics and rerun.

### 3. Mobile cards and feedback
Files: `components/study/StudyFeed.tsx`, new `ChoiceCard.tsx`, `RecallRevealCard.tsx`, `TimelineCard.tsx`, `SortChallengeCard.tsx`, `useStudyPreferences.ts`, CSS.
Interface: card controls call service; Recall reports active elapsed time, pauses hidden/modal/missing image; arrows and compact controls support accessibility.
- [x] Write and run failing browser checks for hidden correct choice, slider release, 5000ms reveal, pre-reveal swipe, threshold gestures, save/reopen and reduced motion.
- [x] Implement in-place choices, 5s auto-reveal, card-following gestures with edge exclusion, explicit timeline confirm and compact markers, transitions, challenge entrance and encoding moments.
- [x] Add optional quiet sound (off), progressive haptics, preload next 4 media; validate phone-width layouts and no keyboard tasks.

### 4. Honest motivation and pack conflicts
Files: new `knowledge/motivation.ts`, progress/dashboard/home, new `ConflictResolver.tsx`, knowledge-service, settings.
Interface: returnHook(snapshot) selects one factual action; resolvePackConflict(table,id,choice) validates and persists user/upstream choice.
- [x] Add and run failing tests for due/new/collection hooks, daily retrieval count, stability milestone deltas and conflict resolution both ways including invalid incoming graph.
- [x] Implement real counters and non-blocking goal/milestone notices, 7/30/90 stability metrics and explicit conflict UI outside feed.
- [x] Verify backup of calibration data and local overrides still restores.

### 5. Regression, review, delivery
- [x] Run pnpm test, pnpm build and browser acceptance checks; fix regressions with reproductions.
- [x] Review all changes against new spec, including saved-session compatibility and graph validation.
- [x] Update README/UPDATE_V2/VALIDATION; package clean source plus rebuilt dist in outputs and concise Russian change report with real-iPhone checklist.

No Git repository exists in this extracted archive; deliver a reviewed ZIP rather than making commits or publishing.


```

### File: res://docs/superpowers/specs/2026-10-06-learning-v2.2.md
```markdown
Тебе переданы:

1. текущий исходный код `engi-v2.1`;
2. предыдущие спецификации;
3. Deep Research по Study Feed;
4. это ТЗ.

Это **не новый rewrite проекта**.

Сохранить текущие:

- local-first PWA;
- IndexedDB/Dexie;
- knowledge graph;
- Entity;
- Fact;
- PropertyDefinition;
- EntityTypeDefinition;
- Tags;
- Media;
- `.engi` packs;
- backup;
- ReviewEvents;
- ts-fsrs;
- current Study Feed;
- Choice с поиском правильного ответа после ошибки;
- Timeline с отдельным подтверждением;
- Recall-Reveal;
- confusion graph;
- repair queue;
- offline;
- GitHub Pages.

Главная задача версии 2.2:

> Переделать Энги из бесконечного генератора упражнений в систему долговременного обучения свойств объектов, похожую по фундаментальному принципу на Anki, но с интерфейсом и разнообразием заданий Энги.

---

# 1. Главная модель обучения

Основная аналогия:

```text
ANKI                  ЭНГИ

Note                  Entity
Fields                Properties / Facts
Card                  Learnable Property / Knowledge Unit
Card state            LearningState
Scheduler             FSRS + bootstrap learning
Tags/Deck             Tags / Collections
```

Пример Entity:

```text
Джон Ф. Кеннеди

Портрет → имя
Дата рождения → 29 мая 1917
Начало президентства → 1961
Конец президентства → 1963
Партия → Демократическая партия
Место рождения → Бруклайн
```

Объект **не имеет одного общего состояния “выучен”**.

Каждое его изучаемое свойство имеет собственное состояние памяти.

Например:

```text
Kennedy.birth_date
Kennedy.presidency_start
Kennedy.party
Kennedy.birth_place
```

должны иметь независимо:

```text
status
lastReviewAt
nextDueAt
stability
difficulty
retrievability
reviewCount
errorCount
confusions
bootstrap state
```

Пользователь может идеально знать партию Кеннеди и совершенно не помнить год рождения.

Scheduler обязан это понимать.

---

# 2. Ввести понятие Knowledge Unit

Нужен явный внутренний уровень между Fact и UI Task.

Назвать можно:

```ts
KnowledgeUnit
```

или сохранить `MemoryTarget`, если архитектурно удобнее.

Семантика:

> одна конкретная ассоциация, которую пользователь должен помнить.

Для большинства обычных свойств:

```text
Entity × Property × direction
```

Например:

```text
kennedy + party + forward
```

означает:

```text
Кеннеди → Демократическая партия
```

Разные UI Recipe:

```text
Choice
Recall-Reveal
Near Twin
Categorize
Match
```

НЕ создают отдельные LearningState.

Они только по-разному проверяют одну память.

---

# 3. Не плодить LearningState из-за presentation

Сейчас часть старой архитектуры может создавать разные Memory Targets вроде:

```text
name_to_party
image_to_party
```

для одного факта.

Для обычных Properties это надо максимально устранить.

Например:

```text
Кеннеди → партия
```

должно быть одной памятью.

Она может проверяться:

```text
портретом Кеннеди
именем Кеннеди
другой фотографией Кеннеди
Choice
Recall
Categorize
```

Но расписание одно.

---

# 4. Исключения: реально разные знания

Не объединять всё бездумно.

Некоторые ассоциации действительно являются разными знаниями.

Например:

```text
портрет → имя человека
```

и:

```text
имя → портрет
```

могут быть разными Knowledge Units.

Также:

```text
изображение картины → автор
```

и:

```text
название картины → автор
```

при необходимости могут быть отдельными.

Главный принцип:

> UI format не создаёт новую память. Реально другой cue/skill может.

---

# 5. Безопасная миграция старых Memory Targets

НЕ потерять существующий прогресс.

Перед миграцией изучить текущие Memory Target IDs.

Если несколько legacy targets теперь должны стать одним KnowledgeUnit:

- ReviewEvents не удалять;
- старые IDs не переиспользовать;
- создать mapping legacyTarget → newKnowledgeUnit;
- LearningState объединять консервативно.

При merge нескольких состояний нельзя оптимистично считать пользователя более обученным, чем он был.

Предпочитать:

```text
earliest due
lower stability
higher difficulty
```

или другую документированную консервативную стратегию.

ReviewEvents остаются append-only.

Добавить migration tests.

---

# 6. Новая карточка знакомства с объектом — Object Intro

Когда Entity впервые попадает в обучение, не надо сразу генерировать десять разрозненных вопросов.

Сначала показать один специальный экран:

```text
НОВЫЙ ОБЪЕКТ

[портрет]

Джон Ф. Кеннеди
35-й президент США

Дата рождения
29 мая 1917             🔴 🟠 🟡 🟢 ★

Начало президентства
1961                    🔴 🟠 🟡 🟢 ★

Конец президентства
1963                    🔴 🟠 🟡 🟢 ★

Партия
Демократическая         🔴 🟠 🟡 🟢 ★

Место рождения
Бруклайн                🔴 🟠 🟡 🟢 ★

                    [Готово]
```

Показывать только `learnable` Properties.

Это one-time triage объекта.

---

# 7. Значение цветов

Использовать простую шкалу:

```text
🔴 Не знаю

🟠 Знакомо, но не уверен

🟡 Скорее знаю

🟢 Знаю хорошо

★ Не учить
```

Формулировки можно немного отполировать, но смысл сохранить.

Одно нажатие на цвет назначает начальную оценку конкретному свойству.

---

# 8. Эти цвета НЕ являются FSRS-review

Это критически важно.

На Object Intro пользователь уже видит:

```text
Партия → Демократическая
```

Поэтому нажатие:

```text
🟢 Знаю хорошо
```

НЕ является retrieval success.

Не отправлять в FSRS:

```text
Easy
Good
```

только на основании этой самооценки.

Хранить отдельно:

```ts
initialFamiliarity:
  | red
  | orange
  | yellow
  | green
  | suspended
```

и:

```ts
triagedAt
```

Это seed scheduler'а, а не доказательство памяти.

---

# 9. ★ означает Suspend, а не “идеально знаю”

`★`:

```text
Не учить это свойство
```

KnowledgeUnit остаётся в базе, но исключается из обычного scheduler.

Это аналог Anki Suspend.

Не считать его автоматически:

```text
выученным
закреплённым
100% retention
```

В progress отдельно можно показывать:

```text
Не учу: 12
```

Пользователь может снять ★ позже.

---

# 10. Bootstrap Learning до полноценного FSRS Review

После Object Intro свойства ещё не имеют объективного доказательства памяти.

Ввести стадии:

```text
UNSEEN
↓
TRIAGED
↓
LEARNING / BOOTSTRAP
↓
REVIEW
```

Отдельно:

```text
SUSPENDED
```

FSRS управляет долгосрочным расписанием после начального learning/bootstrap.

Не копировать старый Anki с десятком внутридневных повторений.

---

# 11. Стартовое расписание 🔴

Для:

```text
🔴 Не знаю
```

свойство должно достаточно быстро получить настоящий retrieval probe.

Например:

```text
Object Intro
↓
3–6 unrelated cards
↓
первый вопрос
```

Если ошибка:

```text
correction
↓
repair через несколько других cards
↓
следующий обычный review не раньше следующего дня
```

После первого нормального успеха:

```text
due ≈ завтра
```

Красное свойство может приходить примерно ежедневно, пока пользователь не покажет несколько реальных успешных retrieval.

Не показывать его 5 раз за один вечер.

---

# 12. Стартовое расписание 🟠

Для:

```text
🟠 Знакомо
```

дать один объективный probe позднее в текущей сессии.

При успехе:

```text
следующая проверка ≈ 1–2 дня
```

после следующего успеха:

```text
≈ 3 дня
```

затем передать нормальному FSRS.

При ошибке:

```text
понизить до red-like learning
```

---

# 13. Стартовое расписание 🟡

Для:

```text
🟡 Скорее знаю
```

одна объективная проверка позднее в текущей сессии.

При успехе:

```text
следующая ≈ 2–3 дня
```

после следующего успеха:

```text
≈ 7 дней
```

затем обычный FSRS.

При ошибке:

```text
перевести в более интенсивный learning
```

---

# 14. Стартовое расписание 🟢

Для:

```text
🟢 Знаю хорошо
```

всё равно нужна хотя бы одна объективная проверка.

Не считать self-report доказательством.

Например:

```text
Object Intro
↓
8–15 unrelated cards
↓
один достаточно сложный probe
```

Если успешно:

```text
следующая проверка ≈ 7 дней
```

дальше FSRS.

Если ошибка:

```text
свойство явно переоценено
→ перевести в learning
```

---

# 15. Не хардкодить интервалы навсегда

Числа:

```text
1 день
3 дня
7 дней
```

используются только как bootstrap.

После появления реальных review data:

```text
FSRS
```

становится источником долгосрочного расписания.

Не строить новую самодельную замену FSRS.

---

# 16. Главная проблема v2.1: убрать бессмысленный refill

В текущем composer есть поведение:

```text
если полезных due/new больше нет
→ reason = practice
→ показывать всё равно что-нибудь
```

Это удалить из основного Study mode.

Основной scheduler имеет право выбирать только:

```text
due
bootstrap due
new/triage budget
repair
specific diagnostic probe
```

НЕ:

```text
что-нибудь, лишь бы feed продолжался
```

---

# 17. Удалить тест, закрепляющий неправильное поведение

Сейчас существует тест примерно такого смысла:

```text
a one-target corpus can refill without a permanent empty feed
```

Он закрепляет ошибочную продуктовую логику.

Если доступен один KnowledgeUnit и он уже успешно обработан:

НЕ генерировать из него ещё 11 карточек.

Правильный результат:

```text
полезных карточек сейчас больше нет
```

---

# 18. Feed больше не обязан быть бесконечным любой ценой

Главный Study mode:

```text
due закончились
+
bootstrap закончился
+
new budget закончился
+
repair пуст
```

→ показать:

```text
На сейчас всё важное повторено ✓
```

И варианты:

```text
[Открыть ещё новые знания]

[Свободная практика]

[Закончить]
```

Это мягкий stopping cue.

Никакой страшной:

```text
очередь: 472
```

---

# 19. Свободная практика — отдельный режим

Если пользователь сам хочет сидеть дальше:

```text
Свободная практика
```

может использовать не-due знания.

Но такие unscheduled вопросы НЕ должны автоматически растягивать FSRS интервалы.

Записывать их как:

```text
diagnostic / practice event
```

Если target действительно due — обычное scheduling evidence.

Таким образом пользователь может залипать сколько хочет, не ломая spaced repetition.

---

# 20. Composer должен пересчитываться после каждого ответа

Не создавать заранее 12 независимых карточек, которые игнорируют результат только что прошедшего review.

После любого scheduling-changing ответа:

```text
ответ
↓
LearningState update
↓
purge stale queued tasks
↓
recalculate eligibility
↓
next task
```

Допускается маленький lookahead для производительности.

Но если KnowledgeUnit получил новый `dueAt`, все ещё не показанные queued tasks этого KnowledgeUnit должны инвалидироваться.

---

# 21. Preload ≠ pre-schedule

Картинки следующих потенциальных объектов можно preload.

Но это не значит, что Task обязан остаться в очереди.

Разделить:

```text
media preloading
```

и:

```text
learning task scheduling
```

---

# 22. Bury Siblings одного Entity

Все Knowledge Units одного Entity являются siblings.

Например:

```text
Kennedy.birth_date
Kennedy.party
Kennedy.presidency_start
Kennedy.birth_place
```

Не показывать их рядом.

Минимум:

```text
same Entity cooldown = 5–8 unrelated cards
```

Ещё лучше:

в рамках одного микро-блока примерно из 15 ordinary reviews показывать максимум одно обычное свойство одного Entity.

Исключение:

```text
explicit repair
```

после ошибки.

---

# 23. Category Throttling

Не выдавать подряд много объектов одной узкой категории.

Например избегать:

```text
Monet
Renoir
Degas
Pissarro
Sisley
```

пять вопросов подряд, если это не специальный discrimination challenge.

Использовать Tags.

Пример эвристики:

```text
не больше 2 карточек с одним narrow tag
в последних 4–5 обычных карточках
```

Это soft constraint, не вечная блокировка.

---

# 24. New Knowledge Budget

Нельзя при импорте:

```text
100 президентов × 6 свойств
```

сразу считать все 600 Properties активными новыми карточками.

Ввести budget на знакомство.

Например default:

```text
до 3 новых Entity за обычный день/сессию
```

или адаптивно эквивалентное небольшое количество.

Object Intro сразу triage'ит несколько свойств, поэтому 3 Entity уже могут добавить 10–20 Knowledge Units.

Если due reviews много:

```text
уменьшать new budget
```

Если due почти нет:

```text
можно предложить ещё новые объекты
```

Но не заставлять пользователя лезть в настройки.

---

# 25. Добавление нового Property существующему Entity

Если пользователь позже добавил:

```text
Kennedy.birth_place
```

не надо снова показывать полный Object Intro.

Показать компактный:

```text
НОВОЕ СВОЙСТВО

Джон Кеннеди

Место рождения
Бруклайн

🔴 🟠 🟡 🟢 ★
```

и дальше тот же bootstrap scheduler.

---

# 26. Формулировки вопросов: отдельный registry

Сейчас вопрос часто выглядит непонятно:

```text
Когда это произошло?
```

Это недопустимо.

Важно:

`birth_date`, `presidency_start`, `party` — это **Properties**, а не Tags.

Создать отдельный файл:

```text
src/lib/engi/questions/question-templates.ts
```

или эквивалент.

Built-in Properties получают нормальные русские формулировки.

Например:

```ts
birth_date: {
  forward: 'Когда родился {subject}?',
  timeline: 'Когда родился {subject}?'
}

presidency_start: {
  forward: 'Когда {subject} стал президентом?',
  timeline: 'Когда {subject} стал президентом?'
}

presidency_end: {
  forward: 'Когда закончилось президентство {subject}?',
  timeline: 'Когда закончилось президентство {subject}?'
}

created_by: {
  forward: 'Кто автор «{subject}»?'
}

party: {
  forward: 'К какой партии принадлежал {subject}?'
}

birth_place: {
  forward: 'Где родился {subject}?'
}

creation_date: {
  forward: 'Когда была создана работа «{subject}»?'
}

capital: {
  forward: 'Какой город является столицей {subject}?'
}
```

Не использовать абстрактное:

```text
Какое значение свойства...
Когда это произошло...
```

если существует нормальный шаблон.

---

# 27. Custom Properties тоже должны иметь question template

Поскольку PropertyDefinition можно создать прямо в Энги, одного hardcoded файла недостаточно.

Добавить в `PropertyDefinition`, например:

```ts
promptTemplates?: {
  forward?: string
  reverse?: string
  timeline?: string
  sort?: string
}
```

Built-in defaults приходят из `question-templates.ts`.

Пользовательский Property может override их.

---

# 28. UI создания Property: “Как спрашивать?”

При создании learnable Property показывать:

```text
Название:
Место рождения

Тип:
Другой объект

Как спрашивать:
Где родился {subject}?
```

Дать preview:

```text
Где родился Джон Кеннеди?
```

Это намного понятнее технического `promptTemplate`.

Для Timeline при необходимости отдельное поле в Advanced:

```text
Формулировка вопроса для шкалы времени
```

---

# 29. Reverse learning не включать без нормальной формулировки

Для:

```text
Kennedy → Democratic Party
```

обратный вопрос:

```text
Democratic Party → Kennedy
```

может иметь много правильных ответов.

Поэтому reverse Recipe разрешать только если:

- Property явно разрешает reverse;
- существует reverse prompt;
- preflight гарантирует однозначность конкретного задания.

Не генерировать странные обратные вопросы автоматически.

---

# 30. Recall timer: разрешить досрочный reveal

Текущий Recall ждёт обязательные 5 секунд.

Изменить смысл:

```text
5 секунд = максимальное время на попытку вспомнить
```

а не обязательная отсидка.

Показать небольшую:

```text
Показать сейчас
```

или тап по countdown/progress indicator.

Flow:

```text
вопрос
↓
таймер идёт
↓
пользователь уже знает
↓
Показать сейчас
↓
answer reveal
↓
swipe left/right
```

---

# 31. Early reveal НЕ означает success

Нажатие:

```text
Показать сейчас
```

только раскрывает правильный ответ.

После reveal пользователь всё равно обязан:

```text
← Не вспомнил

Вспомнил →
```

Так случайный reveal не становится автоматическим `Good`.

---

# 32. Recall без действия пользователя

Если пользователь ничего не нажал:

```text
5.0 sec
↓
automatic reveal
```

После него:

```text
swipe left/right
```

как сейчас.

До reveal grading swipe неактивен.

---

# 33. Сохранить текущий Choice multi-attempt

Не регрессировать v2.1.

При неправильном answer:

```text
wrong option → red
```

НЕ показывать правильный.

Пользователь сам продолжает выбирать.

Только когда найден правильный:

```text
correct → green
→ завершить карточку
```

Если первая попытка была неправильной:

```text
overall review result = failed
```

FSRS update один.

Wrong choices идут в confusion graph.

---

# 34. Scaffolding: формат вопроса зависит от знания свойства

Это одна из ключевых первоначальных идей Энги.

Не спрашивать KnowledgeUnit всю жизнь одинаково.

Условные уровни:

```text
LEVEL 1 — новое / слабое
широкие контрастные distractors

LEVEL 2 — обычное learning
нормальные тематические distractors

LEVEL 3 — хорошее знание
очень похожие distractors / personal confusions

LEVEL 4 — сильное знание
Recall-Reveal / near-twin / transfer probe
```

Recipe выбирается не случайно, а исходя из LearningState.

---

# 35. Не связывать scaffolding с фиксированным количеством попыток

Использовать:

```text
stability
retrievability
recent success
confusion strength
latency
```

Например:

```text
low stability
→ easier recognition

medium stability
→ standard discrimination

high stability
→ hard discrimination / Recall
```

Если сильное знание внезапно провалено:

```text
difficulty stage temporarily drops
```

---

# 36. Dynamic distractor difficulty

Использовать текущий graph и Tags.

Приоритет кандидатов:

```text
1. личные confusions
2. тот же narrow tag
3. тот же EntityType
4. связанные категории
5. broader tag
6. random fallback
```

Но степень близости зависит от mastery.

Новичку:

```text
более различимые варианты
```

Сильному:

```text
near twins
```

---

# 37. Confusion имеет приоритет над общей сложностью

Если пользователь три раза путает:

```text
Monet ↔ Renoir
```

Renoir должен продолжать появляться как distractor для Monet даже если существуют “математически похожие” другие кандидаты.

После успешных различений confusion постепенно decay.

---

# 38. Exemplar Rotation реально использовать

Не просто хранить несколько Media.

Для Knowledge Units с visual cue:

```text
портрет → человек
картина → автор
архитектура → название
```

при разных review выбирать разные valid learning exemplars.

Хранить recent media usage.

Например не повторять один и тот же JPEG последние 2–3 показа KnowledgeUnit, если доступны альтернативы.

---

# 39. Не использовать неподходящие Media

Учитывать:

```text
Media.role
primary
learningExemplar
```

Например мем/обложка/деталь не должны случайно заменять официальный портрет, если Recipe требует portrait identification.

Recipe должен объявлять допустимые media roles.

---

# 40. Response latency использовать скрыто

Продолжать измерять скорость первого meaningful ответа.

Для Choice особенно хранить:

```text
firstAttemptLatencyMs
```

а не время до финального forced-correct.

Например:

```text
быстро + правильно несколько раз
→ повышать difficulty

правильно, но постоянно очень медленно
→ не переходить сразу к hardest format

мгновенная неправильная реакция
→ сильный сигнал автоматической confusion
```

---

# 41. Пока НЕ использовать latency как агрессивный FSRS multiplier

Не делать:

```text
1.4 sec = Easy
4.1 sec = Hard
```

жёстко.

В v2.2 latency используется главным образом для:

```text
format difficulty
distractor difficulty
diagnostics
```

FSRS по-прежнему основывается прежде всего на реальном результате retrieval.

---

# 42. Burned переосмыслить как “Закреплено”

Не удалять знание навсегда после достижения высокого уровня.

Можно показать статус:

```text
Закреплено
```

когда, например:

```text
stability очень высокая
или горизонт >= 180 дней
```

Но FSRS всё равно может когда-нибудь вернуть KnowledgeUnit.

Это milestone, а не permanent deletion.

---

# 43. ★ и “Закреплено” — разные вещи

```text
★ Не учить
```

= пользователь сознательно исключил свойство.

```text
Закреплено
```

= алгоритм считает память очень стабильной.

Не смешивать.

---

# 44. Entity Page должна показывать обучение по свойствам

На странице объекта:

```text
Джон Кеннеди

Дата рождения
🟡  Следующее: через 2 дня

Начало президентства
🟢  Закреплено 30д+

Партия
🔴  Повторить сегодня

Место рождения
★  Не учу
```

Tap по свойству → detail sheet:

```text
Последний review
Следующий review
Stability
Retrievability
Количество попыток
Ошибки
Confusions
```

Не обязательно показывать технические FSRS термины в основном view.

---

# 45. Цвет после начала обучения

Initial Familiarity нужен для старта.

После появления объективных reviews цвет в UI должен отражать уже реальное состояние памяти, а не навсегда первоначальный self-report.

Например визуально:

```text
🔴 слабое / часто забывается
🟠 learning
🟡 среднее
🟢 стабильное
★ suspended
```

Точные thresholds документировать и вычислять из LearningState.

Не менять `initialFamiliarity`, просто отображать `currentMastery`.

---

# 46. Progress считать по Knowledge Units

Coverage:

```text
сколько активных Knowledge Units получили хотя бы одно реальное retrieval evidence
```

Retention:

```text
средняя predicted retrievability
```

Stability horizons:

```text
>=7d
>=30d
>=90d
```

Suspended не должен искусственно улучшать mastery.

---

# 47. Progress по Entity

Дополнительно можно вычислять:

```text
Kennedy:
4/6 активных properties стабильно помню
```

Но не превращать это в один фальшивый процент “знаю Кеннеди на 83%” без контекста.

---

# 48. New Object не должен создавать ReviewEvents

Object Intro:

```text
не retrieval
не review
не FSRS evidence
```

Это только:

```text
content exposure
+
initial triage
```

Можно сохранить отдельный event:

```text
entity_triaged
```

но не смешивать его с ReviewEvents, которые означают проверку памяти.

---

# 49. Retry и normal review должны различаться

Ошибка:

```text
normal scheduled review
→ failed
→ FSRS update
→ repair queued
```

Repair:

```text
через 2–5 unrelated cards
```

используется для коррекции.

Успешный repair НЕ должен второй раз искусственно двигать FSRS interval.

Он может:

```text
уменьшить confusion
закрыть error loop
```

---

# 50. Repair не отменяет следующий scheduled review

Если KnowledgeUnit был провален сегодня:

```text
repair success
```

не означает:

```text
теперь забудем его на месяц
```

Обычный next due определяется результатом настоящего scheduled review/bootstrap.

---

# 51. Main feed priority

Порядок выбора кандидатов примерно:

```text
1. due repair
2. overdue scheduled reviews
3. bootstrap learning due
4. normally due reviews
5. limited new Entity intros
6. diagnostics/challenges
```

Не надо буквально держать один fixed order всегда, чтобы сохранить interleaving.

Но:

```text
non-due random practice
```

не входит в normal feed.

---

# 52. Не показывать одно и то же KnowledgeUnit несколько раз без причины

В обычной сессии KnowledgeUnit может повториться только если:

```text
explicit repair
bootstrap step реально due
```

Не потому что:

```text
composer не нашёл ничего лучше
```

---

# 53. Не показывать один Entity слишком часто

Даже если:

```text
Kennedy.party
Kennedy.birth_date
Kennedy.birth_place
```

все due одновременно:

разнести их.

Scheduler выбирает siblings из других Entity между ними.

---

# 54. Техническая структура scheduler

Рекомендуемое разделение:

```text
learning/
  knowledge-unit.ts
  bootstrap.ts
  fsrs-adapter.ts
  mastery.ts

session/
  candidate-pool.ts
  composer.ts
  sibling-bury.ts
  category-throttle.ts
  retry.ts

questions/
  question-templates.ts
  recipe-selector.ts
  distractors.ts
  exemplar-selector.ts
```

Названия можно изменить.

Не возвращать всё в один огромный `engine.ts`.

---

# 55. PropertyDefinition расширить аккуратно

Добавить только нужное.

Примерно:

```ts
learning?: {
  enabled: boolean
  reverse?: boolean
  countsTowardMastery?: boolean
}

promptTemplates?: {
  forward?: string
  reverse?: string
  timeline?: string
  sort?: string
}
```

Не превращать PropertyDefinition в гигантский JSON со всей логикой scheduler.

Scheduler состояние живёт отдельно.

---

# 56. Current v2.1 UX не ломать

Сохранить:

```text
wrong Choice остаётся красным
правильный не раскрывается автоматически
Slider требует Confirm
Recall grading свайпом
continuous Study Feed
microfeedback
New Knowledge encoding, если уже реализован
```

Только расширить Recall досрочным reveal.

---

# 57. Soft stopping card

Когда полезные карточки закончились:

```text
Готово на сейчас

Всё, что действительно пора было
повторить, уже повторено.
```

Можно ниже:

```text
+ Открыть 2 новых объекта

Свободная практика
```

Это должно ощущаться как достижение, а не ошибка:

```text
“Нечего показать”
```

---

# 58. Не показывать backlog dread

Не делать главный экран:

```text
583 карточки просрочено
```

Можно сказать:

```text
Сегодня есть что освежить
```

или:

```text
6 знаний особенно нуждаются в повторении
```

Главная цель — отсутствие тревоги из-за накопившейся очереди.

---

# 59. Return hooks строить из реального scheduler

Home может выбирать один meaningful hook:

```text
5 знаний пора освежить

Моне ↔ Ренуар почти разобраны

2 свойства Кеннеди готовы перейти
за горизонт 30 дней

Сегодня можно открыть
3 новых объекта
```

Не XP.

Не fake streak.

---

# 60. Что НЕ делать в этой версии

Не добавлять:

```text
RPG
coins
levels
leaderboards
mandatory confidence
typed recall
LLM runtime
embeddings / CLIP distractors
сложный IRT
music system
forced 10-second consolidation pauses
tech tree dependencies
flashlight/occlusion challenges
```

Это всё либо будущие эксперименты, либо сейчас не приоритет.

---

# 61. Automated test: свойства независимы

Создать:

```text
Kennedy.birth_date
Kennedy.party
```

Ответить:

```text
birth_date = fail
party = success
```

Проверить:

```text
разные LearningState
разные due
разная stability
```

---

# 62. Automated test: Object Intro не обучает FSRS

Поставить:

```text
party = green
```

на Object Intro.

Проверить:

```text
нет FSRS success
нет обычного ReviewEvent
```

До первой objective probe KnowledgeUnit остаётся unverifed/triaged.

---

# 63. Automated test: green

```text
green
↓
objective probe later
↓
success
↓
next bootstrap due ≈ 7d
```

Проверить, что green без probe не считается mastered.

---

# 64. Automated test: yellow

```text
yellow
↓
probe
↓
success
↓
next ≈ 2–3d
```

Дальнейший success переводит к более длинному расписанию / FSRS.

---

# 65. Automated test: red

```text
red
↓
probe
↓
fail
↓
repair
```

Проверить:

- одна scheduling failure;
- repair не делает второй FSRS update;
- следующий обычный review достаточно скоро;
- в эту же сессию нет бесконечного spam.

---

# 66. Automated test: no meaningless refill

Corpus:

```text
1 KnowledgeUnit
```

После успешного non-due review:

```text
normal feed
```

не должен создавать ещё 11 копий.

Ожидаемый результат:

```text
feed exhausted / stopping card
```

---

# 67. Automated test: queued task invalidation

Допустим target уже находился в lookahead.

Пользователь успешно ответил более раннюю карточку того же target.

После FSRS update:

```text
все stale queued cards target удаляются
```

---

# 68. Automated test: sibling bury

Три due свойства одного Entity.

При наличии других кандидатов они не должны идти:

```text
A1
A2
A3
```

подряд.

---

# 69. Automated test: question templates

Для:

```text
birth_date
```

вопрос:

```text
Когда родился Джон Кеннеди?
```

Для:

```text
presidency_start
```

вопрос:

```text
Когда Джон Кеннеди стал президентом?
```

Timeline не должен писать:

```text
Когда это произошло?
```

---

# 70. Automated test: custom question template

Создать custom Property:

```text
director
```

с шаблоном:

```text
Кто снял фильм «{subject}»?
```

Создать данные.

RecipeFactory должен использовать именно этот prompt без изменения source code.

---

# 71. Automated test: Recall early reveal

```text
Recall starts
timer = 5 sec

after 1.2 sec:
tap Show now

answer reveals
```

Проверить:

- reveal разрешён;
- таймер останавливается;
- review ещё не отправлен;
- только swipe left/right завершает карточку.

---

# 72. Automated test: exemplar rotation

У Entity 3 learning exemplars.

При нескольких spaced exposures стараться не выбирать один и тот же media подряд.

Если exemplar один — корректный fallback.

---

# 73. Automated test: scaffolding

Weak KnowledgeUnit:

```text
easy/standard recipe
```

Stable KnowledgeUnit:

```text
harder distractors / Recall eligible
```

После failure stable target временно не должен продолжать получать самый сложный формат.

---

# 74. Automated test: Free Practice

KnowledgeUnit не due.

Normal Study:

```text
не показывать
```

Free Practice:

```text
можно показать
```

Если это unscheduled practice:

```text
не увеличивать FSRS interval
```

---

# 75. Migration acceptance

После upgrade с текущего v2.1:

сохранить:

```text
Entities
Facts
Properties
Tags
Media
LearningState
ReviewEvents
confusions
packs
user edits
backup
```

Никакого wipe IndexedDB.

---

# 76. Финальный end-to-end сценарий

Пользователь впервые получает:

```text
Джон Кеннеди
```

Энги показывает Object Intro.

Пользователь ставит:

```text
Дата рождения        🔴
Начало президентства 🟡
Конец президентства  🟠
Партия               🟢
Место рождения       ★
```

После этого:

- место рождения больше не спрашивается;
- дата рождения получает ранний learning probe;
- начало президентства появляется сегодня, затем примерно через 2–3 дня;
- партия получает один объективный verification и при успехе уходит примерно на неделю;
- каждое свойство получает отдельный LearningState;
- вопросы имеют естественные формулировки;
- разные свойства Кеннеди не валятся подряд;
- один KnowledgeUnit не повторяется просто потому, что feed хочет заполнить место;
- с ростом памяти задания становятся сложнее;
- изображения ротируются;
- personal confusions становятся distractors;
- когда полезные reviews закончились, Энги честно говорит об этом.

Это главный acceptance scenario версии.

---

# 77. Порядок реализации

Реализовать по фазам:

### Phase A

KnowledgeUnit + migration + tests.

### Phase B

Object Intro + initial familiarity + Suspend.

### Phase C

Bootstrap scheduler + FSRS handoff.

### Phase D

Dynamic composer без meaningless refill + queue invalidation.

### Phase E

Sibling bury + category throttling + new budget.

### Phase F

Question templates + custom Property prompts.

### Phase G

Recall early reveal.

### Phase H

Scaffolding + distractor difficulty + latency signal.

### Phase I

Exemplar rotation + progress/property UI.

### Phase J

Free Practice + stopping state + final regression tests.

После каждой крупной фазы:

```text
pnpm test
pnpm build
```

Не ждать конца проекта, чтобы обнаружить сломанную migration.

---

# 78. Финальный отчёт кодера

После реализации указать:

1. как теперь определяется KnowledgeUnit;
2. как мигрировали старые Memory Targets;
3. как хранится initial familiarity;
4. как работает bootstrap для четырёх цветов;
5. когда управление переходит FSRS;
6. как предотвращены бессмысленные повторы;
7. как работает sibling bury;
8. как работает new knowledge budget;
9. где находятся question templates;
10. как custom Property задаёт свой вопрос;
11. как работает Recall early reveal;
12. как scaffolding выбирает сложность;
13. как выбираются distractors;
14. как ротируются media exemplars;
15. как используется latency;
16. как работает Suspend;
17. как работает Free Practice;
18. какие migrations добавлены;
19. какие tests добавлены;
20. результат `pnpm test`;
21. результат `pnpm build`;
22. что осталось проверить вручную на iPhone.

Главные правила v2.2:

> **Мы учим не объект целиком, а отдельные свойства объекта.**

> **Каждое свойство имеет собственную память и собственное расписание.**

> **Самооценка задаёт старт, но реальное знание доказывается retrieval.**

> **FSRS решает, когда повторять; Study Feed не имеет права нарушать интервалы только ради бесконечности.**

> **Формат вопроса становится сложнее по мере укрепления памяти.**

> **Если полезных вопросов больше нет — это успех, а не повод спросить Кеннеди двенадцатый раз.**
```

### File: res://docs/superpowers/specs/2026-10-06-study-feed-v2.1.md
```markdown
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
```

### File: res://public/favicon.svg
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="17" fill="#184be7"/><path d="M20 18h25v7H28v7h14v7H28v8h17v7H20z" fill="white"/><circle cx="49" cy="15" r="5" fill="#f0fa88"/></svg>
```

### File: res://scripts/build-engi-pack.mjs
```
import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {openAsBlob} from 'node:fs';
import {ZipWriter,BlobReader,TextReader,BlobWriter,configure} from '@zip.js/zip.js';
import {validateImport} from '../src/lib/engi/validate.ts';
import {manifestSchema,safePath,sha256,checkImage,MAX_PACK_BYTES,MAX_MEDIA_BYTES} from '../src/services/pack-format.ts';
const [source,output]=process.argv.slice(2);if(!source||!output){console.error('Usage: pnpm pack:build ./pack-source ./dist-packs/my-pack.engi');process.exit(1)}
configure({useWebWorkers:false});const root=resolve(source);const empty={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};const bundle=validateImport(JSON.parse(await readFile(resolve(root,'bundle.json'),'utf8')),empty,true);const input=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));const files=[];const paths=new Set(bundle.media.map(m=>m.url));let to... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
for(const path of paths){if(!safePath(path)||!path.startsWith('media/'))throw Error('Media URL must be a safe media/ path');const mime=path.endsWith('.webp')?'image/webp':/\.jpe?g$/.test(path)?'image/jpeg':path.endsWith('.png')?'image/png':'';if(!mime)throw Error('Only WebP, JPEG, PNG');const local=resolve(root,path);const blob=await openAsBlob(local,{type:mime});if(blob.size>MAX_MEDIA_BYTES)throw... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
const manifest=manifestSchema.parse({...input,files});const writer=new ZipWriter(new BlobWriter('application/zip'));await writer.add('manifest.json',new TextReader(JSON.stringify(manifest,null,2)));await writer.add('bundle.json',new TextReader(JSON.stringify(bundle,null,2)));for(const f of files)await writer.add(f.path,new BlobReader(await openAsBlob(resolve(root,f.path),{type:f.mime})),{level:0})... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

```

### File: res://scripts/check-learning.mjs
```
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recipes,eligible,preflight,assess,updateMemory,retention,canonicalTargets} from '../src/lib/engi/engine.ts';
import {composeFeed} from '../src/lib/engi/session/composer.ts';
const b=JSON.parse(readFileSync(new URL('../tests/fixtures/seed.json',import.meta.url)));
const due=canonicalTargets(b).map(i=>{const m=updateMemory(undefined,i,true,i.answerId);m.card.due=new Date(Date.now()-1000);return m});let count=0;for(const format of ['choice','recall_reveal','match','sort','categorize','timeline','missing']){
 for(let n=0;n<15;n++){const tasks=composeFeed(b,due,'all',format,'daily',[],12);assert(tasks.length>0,`No tasks: ${format}`);for(const t of tasks){assert(preflight(t));let answer;if(format==='choice')answer=t.items[0].answerId;else if(format==='recall_reveal')answer=true;else if(['match','categorize'].includes(format))answer=Object.fromEntries(t.items.map(i=>[i.entityId,i.answerId]));else if(form... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}
const r=recipes(b).find(r=>r.answerKey==='created_by'&&r.format==='choice');const item=eligible(b,r)[0];assert.equal(updateMemory(undefined,item,false,'wrong'),undefined,'New failed pretest must not receive Again');const memory=updateMemory(undefined,item,true,item.answerId);assert(memory.card.stability>0);assert(memory.firstSuccessAt);assert(retention(memory)>0.99);const again=updateMemory(memory... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
const multi=structuredClone(b);multi.facts.push({...multi.facts.find(f=>f.entityId===item.entityId&&f.key==='created_by'),id:'other-author',valueEntityId:b.entities.find(e=>e.type==='person'&&e.id!==item.answerId).id});assert(!eligible(multi,r).some(i=>i.entityId===item.entityId),'Multiple authors must be excluded');
const dateRecipes=recipes(b).filter(r=>r.answerKey==='creation_date');for(const r of dateRecipes)assert(eligible(b,r).some(i=>i.entityId==='mona-lisa'||i.entityId==='grande-jatte'),'Approximate and range dates included');
console.log(JSON.stringify({generatedAndChecked:count,formats:7,fsrs:'real scheduler',pretest:'passed',multipleAuthors:'passed',approximateDates:'passed'}));


```

### File: res://src/App.tsx
```typescript
import {useEffect,useRef,useState} from 'react';
import {Toaster,toast} from 'sonner';
import type {Snapshot} from './lib/engi/types';
import type {SessionRow} from './db/engi-db';
import {trainerService} from './services/trainer-service';
import {importPack} from './services/pack-service';
import {restoreBackup} from './services/backup-service';
import {progress} from './lib/engi/knowledge/progress';
import {DeckKnowledgeBrowser as KnowledgeBrowser} from './components/knowledge/DeckKnowledgeBrowser';
import {KnowledgeImage} from './components/knowledge/KnowledgeImage';
import {ProgressDashboard} from './components/progress/ProgressDashboard';
import {StudyFeed} from './components/study/StudyFeed';
import {SettingsPanel} from './components/settings-panel';
import {registerUpdates,applyUpdate,checkUpdates} from './pwa/update-manager';
import {protectStorage} from './services/storage-health';
import {returnHook,todayLearning} from './lib/engi/knowledge/motivation';
export default function App(){
 const [s,setS]=useState<Snapshot|null>(null),[error,setError]=useState(''),[tab,setTab]=useState('today'),[feed,setFeed]=useState<SessionRow|null>(null),[resume,setResume]=useState<SessionRow|undefined>(),[busy,setBusy]=useState(false),[importOpen,setImportOpen]=useState(false),[importProgress,setImportProgress]=useState(''),[update,setUpdate]=useState(false),[tag,setTag]=useState('all'),[format,... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 async function reload(){try{setS(await trainerService.getSnapshot());const active=await trainerService.getResumableSession();setResume(active?.feed&&(active.intro||active.exhausted||active.tasks[active.currentPosition])?active:undefined);setRevision(n=>n+1);setError('')}catch(e){setError((e as Error).message)}}
 useEffect(()=>{reload();return registerUpdates(()=>setUpdate(true),()=>{})},[]);
 async function start(t=tag,f=format,mode='daily'){setBusy(true);try{setFeed(await trainerService.startFeed(t,f,mode))}catch(e){toast.error((e as Error).message)}finally{setBusy(false)}}
 async function readFile(f:File){setBusy(true);abort.current=new AbortController();try{const name=f.name.toLowerCase();if(name.endsWith('.engi')){await importPack(f,setImportProgress,undefined,abort.current.signal);toast.success('Пакет импортирован');await protectStorage()}else if(name.endsWith('.engi-backup')){if(f.size>100*1024*1024)throw Error('Копия больше 100 МБ');await restoreBackup(JSON.par... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 if(feed)return <><Toaster richColors/><StudyFeed initial={feed} onExit={()=>{setFeed(null);reload()}}/></>;
 const p=s?progress(s):null,hook=s?returnHook(s):null,today=s?todayLearning(s):null;return <><Toaster richColors/><div className="app-shell"><header className="header"><button className="brand" onClick={()=>setTab('today')}>энги<span className="version-badge">2.2</span></button><nav>{[['today','Учиться'],['knowledge','Знания'],['progress','Прогресс'],['storage','Настройки']].map(([id,name])=><butt... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}


```

### File: res://src/main.tsx
```typescript
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App/>);

```

### File: res://src/styles.css
```css
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));
:root{--background:#fff;--foreground:#182b38;--card:#fff;--card-foreground:#182b38;--popover:#fff;--popover-foreground:#182b38;--primary:#184be7;--primary-foreground:#fff;--secondary:#edf1f6;--secondary-foreground:#182b38;--muted:#f1f4f7;--muted-foreground:#697886;--accent:#e8eeff;--accent-foreground:#184be7;--destructive:#c74744;--border:#dfe5eb;--input:#dfe5eb;--ring:#184be7;--radius:.7rem;--sid... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
.dark{--background:#12202c;--foreground:#f0f4f8;--card:#192b3b;--card-foreground:#f0f4f8;--popover:#192b3b;--popover-foreground:#f0f4f8;--primary:#779aff;--primary-foreground:#10213d;--secondary:#203548;--secondary-foreground:#f0f4f8;--muted:#203548;--muted-foreground:#b4c3d1;--accent:#30496b;--accent-foreground:#fff;--border:#354a5d;--input:#354a5d;--ring:#779aff}
@theme inline{--color-background:var(--background);--color-foreground:var(--foreground);--color-card:var(--card);--color-card-foreground:var(--card-foreground);--color-popover:var(--popover);--color-popover-foreground:var(--popover-foreground);--color-primary:var(--primary);--color-primary-foreground:var(--primary-foreground);--color-secondary:var(--secondary);--color-secondary-foreground:var(--se... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
*{box-sizing:border-box}body{margin:0;background:#f6f8fa;color:#182b38;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5}button,input,textarea{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.5}button,a,input,textarea{outline-offset:4px}button:focus-visible,a:focus-visible{outline:3px solid #7695ef}h1,h2,h3,p{margin:0}h1{font-size:clamp(30px,3.4vw,... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
@media(max-width:1050px){.header{padding:0 25px;gap:18px}.nav{gap:12px!important}.workspace{width:calc(100% - 48px)}.daily-copy{padding:28px;width:65%}.daily-copy h2{font-size:30px}.art-stack{min-width:180px}.stack-image{width:120px;height:164px}.stack-1{left:60px;top:94px}.stack-2{left:95px;top:34px}.goal-card{padding:23px}.collection-grid{gap:17px}.collection-images{padding:15px 20px;gap:7px}.ca... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
@media(max-width:760px){.header{height:auto;min-height:115px;flex-wrap:wrap;padding:16px 20px 0;gap:5px}.brand{font-size:27px}.brand-icon{width:36px;height:36px;border-radius:10px}.brand-icon svg{width:22px}.add-top{margin-left:auto;min-height:37px;font-size:13px;padding:8px 11px}.nav{order:3;width:100%;height:48px!important;justify-content:center;gap:16px!important}.nav button{font-size:13px;gap:... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
.review-row{display:flex;justify-content:space-between;gap:16px;align-items:center;border-bottom:1px solid #e2e9ef;padding:15px 0}.review-row strong{font-size:14px}.review-row p{font-size:13px;color:#7d8e9b;margin-top:4px}.review-row .text-button{white-space:nowrap}
/* Phone-first additions, preserving the existing visual language. */
.app-shell{min-height:100vh;min-height:100dvh;padding-bottom:env(safe-area-inset-bottom)}
.header{padding-top:env(safe-area-inset-top);height:auto;min-height:92px}
.notice{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:14px 20px;background:#e8eeff;border-bottom:1px solid #d2dcf9;font-size:14px}
.empty-state{display:flex;align-items:center;flex-direction:column;text-align:center;gap:16px;margin-bottom:28px;padding:40px 20px}
.storage-panel{margin-top:24px}.storage-panel dl{margin:20px 0}.storage-panel dl>div{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #e4e9ef}.storage-panel dd{text-align:right;margin:0}.storage-panel>p{margin-top:18px;font-size:14px}.backup-reminder{padding:12px;background:#fff3d9;border-radius:8px}
.study-footer{padding-bottom:max(18px,env(safe-area-inset-bottom))}.sort-actions button{min-width:44px;min-height:44px;touch-action:manipulation}.button,.option{touch-action:manipulation}input,textarea{font-size:16px!important}.modal{max-height:85dvh;overflow:auto}input{scroll-margin-top:100px}summary{cursor:pointer;padding:12px 0}details .button{margin-top:12px}
@media(max-width:760px){.header{padding-left:16px;padding-right:16px;gap:10px}.nav{gap:6px!important;width:100%;justify-content:space-between}.nav button{padding:0 5px!important;font-size:12px;min-height:48px}.nav svg{width:17px!important}.workspace{width:calc(100% - 32px);padding-top:28px}.study{width:calc(100% - 24px);padding:24px 0}.study-footer{position:sticky;bottom:0;background:#f6f8fa;paddi... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
.drag-handle{touch-action:none;border:0;cursor:grab;flex-shrink:0;min-width:44px;min-height:44px}.drag-handle:active{cursor:grabbing}
.sort-item strong{min-width:0;overflow-wrap:anywhere}
/* Engi 2: mobile study feed and personal knowledge editor. */
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}select{font:inherit;border:1px solid #dfe5eb;background:#fff;border-radius:12px;padding:12px;min-height:44px;color:#182b38;max-width:100%}input,textarea{color:inherit}.header nav{display:flex;gap:8px}.header nav button{min-height:48px;padding:12px 16px;border-radius:12px;border:0;background:none;font-weight:600}.head... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
@keyframes feed-enter{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes nudge{0%,100%{opacity:0}15%,85%{opacity:1}}
@media(max-width:760px){.header{flex-wrap:wrap;padding:12px 16px;gap:10px}.header nav{order:3;width:100%;justify-content:space-between;gap:0}.header nav button{font-size:14px;padding:8px 10px}.header .brand{font-size:28px}.feed-home{grid-template-columns:1fr;padding:28px;min-height:360px}.home-art{display:none}.feed-home h2{font-size:40px}.overlay{padding:0;align-items:flex-end}.editor-panel{max-h... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
@media(prefers-reduced-motion:reduce){.feed-current,.feed-nudge{animation:none}.state-exiting .feed-current{transform:none;transition:opacity 80ms}.feed-option:active:not(:disabled){transform:none}.feed-option{transition:background 80ms}.feed-nudge{display:none}}
.feed-option.answer-wrong{color:var(--color-error);background:var(--color-error-surface);border-color:#e19a90}

```

### File: res://src/components/settings-panel.tsx
```typescript
import {useEffect,useState} from 'react';
import {db,type PackRow} from '../db/engi-db';
import {storageHealth,protectStorage} from '../services/storage-health';
import {saveBackup} from '../services/backup-service';
import {toast} from 'sonner';
import {useStudyPreferences} from './study/useStudyPreferences';
import {resetLearningProgress} from '../services/learning-service';

export function SettingsPanel({revision,onImport,onRestore}:{revision:number;onImport:()=>void;onRestore:()=>void}){
 const [busy,setBusy]=useState(false);
 async function handleReset(){
  if(!window.confirm('Сбросить весь прогресс обучения? Это действие удалит карточки памяти, историю повторений и активные сессии. Сами знания и объекты останутся нетронутыми.'))return;
  setBusy(true);
  try{
   await resetLearningProgress();
   toast.success('Прогресс обучения сброшен');
   if(typeof window!=='undefined'&&typeof window.location?.reload==='function')window.location.reload();
  }catch(e){
   toast.error((e as Error).message);
  }finally{
   setBusy(false);
  }
 }
 return <>
  <BaseSettingsPanel revision={revision} onImport={onImport} onRestore={onRestore}/>
  <section className="panel storage-panel" style={{marginTop:'20px'}}>
   <h2>Сброс прогресса</h2>
   <p className="muted" style={{margin:'8px 0 16px',fontSize:'14px',color:'#697886'}}>
    Сбрасывает все карточки памяти, FSRS-расписание, историю ответов и дневной бюджет. Объекты, связи и изображения сохраняются.
   </p>
   <button type="button" className="button destructive" disabled={busy} onClick={handleReset} style={{minHeight:'44px',background:'#c74744',color:'#fff',borderColor:'#c74744'}}>
    {busy?'Сбрасываем…':'Сбросить прогресс обучения'}
   </button>
  </section>
 </>;
}

function BaseSettingsPanel({revision,onImport,onRestore}:{revision:number;onImport:()=>void;onRestore:()=>void}){
 const {preferences,save}=useStudyPreferences();
 const [health,setHealth]=useState<Awaited<ReturnType<typeof storageHealth>>>();const [packs,setPacks]=useState<PackRow[]>([]);
 async function refresh(){try{setHealth(await storageHealth());setPacks(await db.installedPacks.toArray())}catch(e){toast.error((e as Error).message)}}
 useEffect(()=>{refresh()},[revision]);const mb=(n:number)=>`${Math.round(n/1024/1024)} МБ`;
 return <><section className="panel study-preferences"><h2>Практика</h2><label className="check-label"><input type="checkbox" checked={preferences.sound} onChange={async e=>{try{await save({...preferences,sound:e.target.checked})}catch(error){toast.error((error as Error).message)}}}/>Тихий звук верного ответа</label><label className="check-label"><input type="checkbox" checked={preferences.accessi... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}


```

### File: res://src/components/knowledge/ConflictResolver.tsx
```typescript
import {useState} from 'react';
import type {Bundle} from '../../lib/engi/types';
import {packConflicts,type ConflictTable} from '../../lib/engi/knowledge/conflicts';
import {textValue} from '../../lib/engi/knowledge/properties';
import {resolvePackConflict} from '../../services/knowledge-service';
import {KnowledgeImage} from './KnowledgeImage';

export function ConflictResolver({bundle,onReload}:{bundle:Bundle;onReload:()=>Promise<void>}){
 const rows=packConflicts(bundle),[selected,setSelected]=useState<{table:ConflictTable;id:string}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const conflict=rows.find(c=>c.table===selected?.table&&c.row.id===selected.id);
 if(!rows.length)return null;
 const label=(table:ConflictTable,row:any)=>table==='facts'?`${bundle.entities.find(e=>e.id===row.entityId)?.name??'Объект'} · ${bundle.properties?.find(p=>p.id===row.key)?.name??'Поле'}`:table==='media'?`Изображение · ${bundle.entities.find(e=>e.id===row.entityId)?.name??'Объект'}`:row.name;
 const version=(row:any)=>conflict?.table==='facts'?textValue(row,bundle):row.name??row.role??'Версия изображения';
 const typeName=(id:string)=>bundle.entityTypes?.find(t=>t.id===id)?.name??id;
 function details(row:any):[string,string][]{
  if(conflict?.table==='entities')return [['Тип',typeName(row.type)],['Другие названия',row.aliases?.join(', ')||'Нет']];
  if(conflict?.table==='facts')return [['Объект',bundle.entities.find(e=>e.id===row.entityId)?.name??row.entityId],['Поле',bundle.properties?.find(p=>p.id===row.key)?.name??row.key],['Проверка',({verified:'Проверено',direct:'Прямое подтверждение',user_confirmed:'Подтверждено лично',unverified:'Не проверено',ambiguous:'Неоднозначно',conflict:'Противоречие',rejected:'Отклонено'} as Record<string,str... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
  if(conflict?.table==='media')return [['Лицензия',row.license],['Основное',row.primary?'Да':'Нет'],['Для обучения',row.learningExemplar===false?'Нет':'Да'],['Источник изображения',row.sourceUrl??'Личное изображение']];
  if(conflict?.table==='tags')return [['Родительская подборка',bundle.tags.find(t=>t.id===row.parentId)?.name??'Нет']];
  if(conflict?.table==='entityTypes')return [['Множественное число',row.pluralName??'Не задано'],['Значок',row.icon??'Нет']];
  return [['Вид значения',({entity:'Связь с объектом',text:'Текст',number:'Число',date:'Дата',boolean:'Да / Нет'} as Record<string,string>)[row.valueKind]??row.valueKind],['Типы объектов',row.subjectTypes?.map(typeName).join(', ')||'Все'],['Типы ответов',row.targetTypes?.map(typeName).join(', ')||'Все'],['Обратная связь',row.inverse?.enabled?row.inverse.name??'Включена':'Выключена']];
 }
 async function resolve(choice:'mine'|'pack'){if(!conflict||busy)return;setBusy(true);setError('');try{await resolvePackConflict(conflict.table,conflict.row.id,choice);setSelected(null);await onReload()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="panel"><h2>Ваши правки и обновления пакетов</h2><p className="muted">{rows.length} расхождений. Ваши изменения сохранены — выберите, какую версию оставить.</p><div className="conflict-list">{rows.map(c=><button className="button outline" key={c.table+c.row.id} onClick={()=>{setError('');setSelected({table:c.table,id:c.row.id})}}>{label(c.table,c.row)} <span>Сравнить →</... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 {conflict&&<div className="overlay"><section className="editor-panel" role="dialog" aria-modal="true" aria-label="Выбор версии"><div className="section-heading"><h2>{label(conflict.table,conflict.row)}</h2><button className="icon-button" aria-label="Закрыть сравнение" disabled={busy} onClick={()=>setSelected(null)}>×</button></div><div className="conflict-comparison">{[[conflict.row,'Ваша версия'... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 </section>;
}


```

### File: res://src/components/knowledge/DeckCard.tsx
```typescript
import type {DeckInfo} from '../../lib/engi/knowledge/decks';
import {KnowledgeImage} from './KnowledgeImage';
import './decks.css';

export function pluralObjects(count: number): string {
  const abs = Math.abs(count) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `${count} объектов`;
  if (rem > 1 && rem < 5) return `${count} объекта`;
  if (rem === 1) return `${count} объект`;
  return `${count} объектов`;
}

export function pluralSubtags(count: number): string {
  const abs = Math.abs(count) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `+${count} подтегов`;
  if (rem === 1) return `+${count} подтег`;
  if (rem > 1 && rem < 5) return `+${count} подтега`;
  return `+${count} подтегов`;
}

export type DeckCardProps = {
  deck: DeckInfo;
  onSelect: (deckId: string) => void;
  onStudy?: (deckId: string) => void;
};

export function DeckCard({deck, onSelect, onStudy}: DeckCardProps) {
  const images = deck.sampleImages;
  const hasDue = deck.stats.due > 0;
  const hasCovered = deck.stats.covered > 0;
  const canStudy = deck.stats.available > 0;

  return (
    <article
      className={`deck-card ${deck.isUntagged ? 'is-untagged' : ''}`}
      onClick={() => onSelect(deck.id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(deck.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Колода: ${deck.name}. ${pluralObjects(deck.entityCount)}`}
    >
      <div className="deck-art-stack" aria-hidden="true">
        {images.length === 0 ? (
          <div className="deck-stack-fallback">
            <span>{deck.isUntagged ? '📥' : deck.name.trim()[0]?.toUpperCase() ?? '📁'}</span>
          </div>
        ) : images.length === 1 ? (
          <div className="deck-stack-single">
            <KnowledgeImage src={images[0]} alt="" className="deck-stack-img" />
          </div>
        ) : images.length === 2 ? (
          <div className="deck-stack-double">
            <KnowledgeImage src={images[0]} alt="" className="deck-stack-img stack-back" />
            <KnowledgeImage src={images[1]} alt="" className="deck-stack-img stack-front" />
          </div>
        ) : (
          <div className="deck-stack-triple">
            <KnowledgeImage src={images[0]} alt="" className="deck-stack-img stack-left" />
            <KnowledgeImage src={images[1]} alt="" className="deck-stack-img stack-right" />
            <KnowledgeImage src={images[2]} alt="" className="deck-stack-img stack-center" />
          </div>
        )}
      </div>

      <div className="deck-card-body">
        <div className="deck-card-header">
          <h3 className="deck-title">{deck.name}</h3>
          {deck.childTagIds.length > 0 && (
            <span className="deck-badge-subtags">
              {pluralSubtags(deck.childTagIds.length)}
            </span>
          )}
        </div>

        <div className="deck-meta">
          <span className="deck-count">
            {deck.learnedEntityCount} из {deck.entityCount} изучено{deck.learnedEntityCount === deck.entityCount && deck.entityCount > 0 ? ' ✓' : ''}
          </span>
          {hasDue && (
            <span className="deck-badge-due" aria-label={`Пора повторить: ${deck.stats.due}`}>
              {deck.stats.due} к повторению
            </span>
          )}
        </div>

        <div className="deck-progress-row">
          {deck.entityCount > 0 ? (
            <div className="deck-retention">
              <div
                className="deck-retention-track"
                role="progressbar"
                aria-label="Прогресс изучения колоды"
                aria-valuenow={Math.round((deck.learnedEntityCount / deck.entityCount) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`deck-retention-fill ${deck.category === 'completed' ? 'is-completed' : ''}`}
                  style={{width: `${Math.round((deck.learnedEntityCount / deck.entityCount) * 100)}%`}}
                />
              </div>
              <span className="deck-retention-label">
                {deck.category === 'completed'
                  ? 'Изучено'
                  : deck.learnedEntityCount > 0
                  ? `${Math.round((deck.learnedEntityCount / deck.entityCount) * 100)}%`
                  : 'Не начато'}
              </span>
            </div>
          ) : (
            <span className="deck-unstarted">Пустая колода</span>
          )}
        </div>

        <div className="deck-actions">
          <button
            type="button"
            className="deck-study-btn button primary"
            disabled={!canStudy}
            onClick={e => {
              e.stopPropagation();
              onStudy?.(deck.id);
            }}
          >
            Учить
          </button>
        </div>
      </div>
    </article>
  );
}
```

### File: res://src/components/knowledge/DeckCatalog.tsx
```typescript
import {useMemo, useState} from 'react';
import type {Snapshot} from '../../lib/engi/types';
import {getDeckList, type DeckInfo} from '../../lib/engi/knowledge/decks';
import {DeckCard} from './DeckCard';
import {ConflictResolver} from './ConflictResolver';
import './decks.css';

export type DeckCatalogProps = {
  snapshot: Snapshot;
  onSelectDeck: (deckId: string) => void;
  onStudy: (tagId: string) => void;
  onCreateDeck: () => void;
  onCreateEntity: () => void;
  onReload: () => Promise<void>;
};

export function DeckCatalog({
  snapshot,
  onSelectDeck,
  onStudy,
  onCreateDeck,
  onCreateEntity,
  onReload,
}: DeckCatalogProps) {
  const [query, setQuery] = useState('');

  const allDecks = useMemo(() => getDeckList(snapshot), [snapshot]);

  const filteredDecks = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, 'е');
    if (!q) return allDecks;
    return allDecks.filter(deck =>
      deck.name.toLowerCase().replace(/ё/g, 'е').includes(q)
    );
  }, [allDecks, query]);

  const regularDecks = useMemo(
    () => filteredDecks.filter(d => !d.isUntagged),
    [filteredDecks]
  );
  const untaggedDeck = useMemo(
    () => filteredDecks.find(d => d.isUntagged),
    [filteredDecks]
  );

  return (
    <div className="deck-catalog">
      <div className="page-heading">
        <div>
          <p className="eyebrow">База знаний</p>
          <h1>Колоды</h1>
        </div>
        <div className="catalog-heading-actions">
          <button type="button" className="button outline" onClick={onCreateDeck}>
            + Новая колода
          </button>
          <button type="button" className="button primary" onClick={onCreateEntity}>
            + Новый объект
          </button>
        </div>
      </div>

      <div className="catalog-toolbar">
        <div className="search">
          <input
            type="search"
            placeholder="Найти колоду по названию…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Поиск колоды"
          />
        </div>
      </div>

      <ConflictResolver bundle={snapshot.bundle} onReload={onReload} />

      {(() => {
        const inProgress = filteredDecks.filter(d => d.category === 'in_progress');
        const completed = filteredDecks.filter(d => d.category === 'completed');
        const unlearned = filteredDecks.filter(d => d.category === 'unlearned');

        const sections = [
          {id: 'in_progress', title: 'В процессе изучения', decks: inProgress},
          {id: 'completed', title: 'Изучено', decks: completed},
          {id: 'unlearned', title: 'Не изучено', decks: unlearned},
        ].filter(s => s.decks.length > 0);

        if (sections.length === 0) {
          return (
            <div className="empty-state deck-empty">
              <p className="muted">
                {query ? 'Колоды с таким названием не найдены' : 'В базе пока нет колод. Создайте первую колоду или объект.'}
              </p>
              {!query && (
                <button type="button" className="button primary" onClick={onCreateDeck}>
                  Создать колоду
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="deck-catalog-sections" style={{display: 'flex', flexDirection: 'column', gap: '28px'}}>
            {sections.map(sec => (
              <section className="deck-catalog-section" key={sec.id} aria-label={sec.title}>
                <div className="section-divider" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px'}}>
                  <h2 style={{fontSize: '20px', margin: 0}}>{sec.title}</h2>
                  <span className="deck-section-count">{sec.decks.length}</span>
                </div>
                <div className="deck-grid">
                  {sec.decks.map(deck => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      onSelect={onSelectDeck}
                      onStudy={onStudy}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
```

### File: res://src/components/knowledge/DeckDetailView.tsx
```typescript
import {useMemo, useState} from 'react';
import type {Entity, Snapshot} from '../../lib/engi/types';
import {
  getDeckEntities,
  getDeckTypes,
  filterDeckEntities,
  getEntityMasterySummary,
  UNTAGGED_TAG_ID,
} from '../../lib/engi/knowledge/decks';
import {indexes} from '../../lib/engi/indexes';
import {entityTypes} from '../../lib/engi/knowledge/properties';
import {KnowledgeImage} from './KnowledgeImage';
import {pluralObjects} from './DeckCard';
import {
  archiveTag,
  attachEntityTag,
  detachEntityTag,
  saveTag,
} from '../../services/knowledge-service';
import './decks.css';

export type DeckDetailViewProps = {
  deckId: string;
  snapshot: Snapshot;
  onBack: () => void;
  onStudy: (tagId: string) => void;
  onSelectEntity: (entity: Entity) => void;
  onCreateEntity: (tagId?: string) => void;
  onReload: () => Promise<void>;
  onSelectDeck?: (deckId: string) => void;
};

export function DeckDetailView({
  deckId,
  snapshot,
  onBack,
  onStudy,
  onSelectEntity,
  onCreateEntity,
  onReload,
  onSelectDeck,
}: DeckDetailViewProps) {
  const isUntagged = deckId === UNTAGGED_TAG_ID;
  const tag = isUntagged ? undefined : snapshot.bundle.tags.find(t => t.id === deckId);
  const deckTitle = isUntagged ? 'Неразобранное' : tag?.name ?? 'Колода';
  const parentTag = tag?.parentId ? snapshot.bundle.tags.find(t => t.id === tag.parentId) : undefined;

  const [query, setQuery] = useState('');
  const [subtagFilter, setSubtagFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState<'name' | 'type'>('name');
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(tag?.name ?? '');
  const [editParent, setEditParent] = useState(tag?.parentId ?? '');
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [existingQuery, setExistingQuery] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  const entities = useMemo(() => getDeckEntities(snapshot.bundle, deckId), [snapshot.bundle, deckId]);
  const types = useMemo(() => getDeckTypes(entities, snapshot.bundle), [entities, snapshot.bundle]);
  const ix = useMemo(() => indexes(snapshot.bundle), [snapshot.bundle]);

  const childTags = useMemo(
    () => snapshot.bundle.tags.filter(t => !t.archived && t.parentId === deckId),
    [snapshot.bundle.tags, deckId]
  );

  const filteredEntities = useMemo(() => {
    let list = entities;
    if (subtagFilter !== 'all') {
      list = list.filter(e => ix.tagsByEntity.get(e.id)?.has(subtagFilter));
    }
    list = filterDeckEntities(list, snapshot.bundle, query, typeFilter);
    return [...list].sort((a, b) => {
      if (sort === 'type') {
        const typeComp = a.type.localeCompare(b.type);
        if (typeComp !== 0) return typeComp;
      }
      return a.name.localeCompare(b.name, 'ru');
    });
  }, [entities, subtagFilter, snapshot.bundle, query, typeFilter, sort, ix]);
  const typeMap = useMemo(
    () => new Map(entityTypes(snapshot.bundle).map(t => [t.id, t.name])),
    [snapshot.bundle]
  );

  const candidateEntities = useMemo(() => {
    if (!showAddExisting) return [];
    const currentIds = new Set(entities.map(e => e.id));
    const unselected = snapshot.bundle.entities.filter(e => !e.archived && !currentIds.has(e.id));
    const q = existingQuery.trim().toLowerCase().replace(/ё/g, 'е');
    if (!q) return unselected;
    return unselected.filter(e =>
      [e.name, ...(e.aliases ?? [])].some(n => n.toLowerCase().replace(/ё/g, 'е').includes(q))
    );
  }, [showAddExisting, entities, snapshot.bundle, existingQuery]);

  async function handleSaveTag() {
    if (isUntagged || !tag || !editName.trim()) return;
    setBusy(true);
    try {
      await saveTag({
        ...tag,
        name: editName.trim(),
        parentId: editParent || undefined,
      });
      await onReload();
      setShowSettings(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTag() {
    if (isUntagged || !tag) return;
    if (!window.confirm(`Удалить колоду «${tag.name}»? Объекты сохранятся в базе знаний.`)) return;
    setBusy(true);
    try {
      await archiveTag(tag.id);
      await onReload();
      onBack();
    } finally {
      setBusy(false);
    }
  }

  async function handleDetach(entityId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (isUntagged) return;
    if (!window.confirm('Убрать объект из этой колоды?')) return;
    setBusy(true);
    try {
      await detachEntityTag(entityId, deckId);
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddExisting() {
    if (isUntagged || selectedToAdd.size === 0) return;
    setBusy(true);
    try {
      for (const entityId of selectedToAdd) {
        await attachEntityTag(entityId, deckId);
      }
      setSelectedToAdd(new Set());
      setShowAddExisting(false);
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  const otherTags = useMemo(
    () => snapshot.bundle.tags.filter(t => !t.archived && t.id !== deckId),
    [snapshot.bundle.tags, deckId]
  );

  function getEntityEyebrow(e: Entity): string {
    const matchingSubtags = childTags.filter(ct => ix.tagsByEntity.get(e.id)?.has(ct.id));
    if (matchingSubtags.length > 0) {
      return matchingSubtags.map(t => t.name).join(', ');
    }
    return typeMap.get(e.type) ?? e.type;
  }

  return (
    <div className="deck-detail">
      <div className="deck-detail-nav">
        <button type="button" className="deck-detail-back" onClick={onBack}>
          {parentTag ? `← ${parentTag.name}` : '← Все колоды'}
        </button>
        {!isUntagged && (
          <button
            type="button"
            className="button outline"
            onClick={() => {
              setEditName(tag?.name ?? '');
              setEditParent(tag?.parentId ?? '');
              setShowSettings(true);
            }}
          >
            Настроить колоду
          </button>
        )}
      </div>

      <section className="deck-detail-hero">
        <div className="deck-detail-header-row">
          <div className="deck-detail-title-group">
            <p className="eyebrow">{isUntagged ? 'Системный раздел' : 'Колода знаний'}</p>
            <h1>{deckTitle}</h1>
            <p className="muted">{pluralObjects(entities.length)}</p>
          </div>
          <div className="deck-detail-hero-actions">
            <button
              type="button"
              className="button primary"
              onClick={() => onStudy(isUntagged ? 'all' : deckId)}
              disabled={entities.length === 0}
            >
              Учить эту тему
            </button>
            {!isUntagged && (
              <button
                type="button"
                className="button outline"
                onClick={() => {
                  setSelectedToAdd(new Set());
                  setExistingQuery('');
                  setShowAddExisting(true);
                }}
              >
                + Выбрать из базы
              </button>
            )}
            <button
              type="button"
              className="button outline"
              onClick={() => onCreateEntity(isUntagged ? undefined : deckId)}
            >
              + Создать объект
            </button>
          </div>
        </div>

        <div className="deck-detail-stats-bar">
          <div className="deck-detail-stat">
            <span className="deck-detail-stat-val">{entities.length}</span>
            <span className="deck-detail-stat-label">Объектов</span>
          </div>
          {childTags.length > 0 ? (
            <div className="deck-detail-stat">
              <span className="deck-detail-stat-val">{childTags.length}</span>
              <span className="deck-detail-stat-label">
                {childTags.length === 1 ? 'Подколода' : childTags.length < 5 ? 'Подколоды' : 'Подколод'}
              </span>
            </div>
          ) : (
            <div className="deck-detail-stat">
              <span className="deck-detail-stat-val">{types.length}</span>
              <span className="deck-detail-stat-label">Категорий</span>
            </div>
          )}
        </div>
      </section>

      <section className="deck-detail-toolbar">
        <div className="search">
          <input
            type="search"
            placeholder="Поиск объектов в колоде…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Поиск объектов в колоде"
          />
        </div>

        <div className="deck-detail-filter-row">
          {childTags.length > 0 ? (
            <div className="deck-type-pills" role="radiogroup" aria-label="Фильтр по подтегам">
              <button
                type="button"
                className={`deck-type-pill ${subtagFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setSubtagFilter('all')}
                aria-checked={subtagFilter === 'all'}
              >
                Все ({entities.length})
              </button>
              {childTags.map(ct => {
                const count = entities.filter(e => ix.tagsByEntity.get(e.id)?.has(ct.id)).length;
                return (
                  <button
                    type="button"
                    key={ct.id}
                    className={`deck-type-pill ${subtagFilter === ct.id ? 'is-active' : ''}`}
                    onClick={() => setSubtagFilter(ct.id)}
                    aria-checked={subtagFilter === ct.id}
                  >
                    {ct.name} ({count})
                  </button>
                );
              })}
            </div>
          ) : types.length > 1 ? (
            <div className="deck-type-pills" role="radiogroup" aria-label="Фильтр по типу">
              <button
                type="button"
                className={`deck-type-pill ${typeFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setTypeFilter('all')}
                aria-checked={typeFilter === 'all'}
              >
                Все ({entities.length})
              </button>
              {types.map(t => {
                const count = entities.filter(e => e.type === t.id).length;
                return (
                  <button
                    type="button"
                    key={t.id}
                    className={`deck-type-pill ${typeFilter === t.id ? 'is-active' : ''}`}
                    onClick={() => setTypeFilter(t.id)}
                    aria-checked={typeFilter === t.id}
                  >
                    {t.name} ({count})
                  </button>
                );
              })}
            </div>
          ) : null}

          <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap'}}>
            {types.length > 1 && childTags.length > 0 && (
              <select
                className="deck-detail-sort-select"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                aria-label="Фильтр по типу объекта"
              >
                <option value="all">Все типы</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            <label className="deck-sort-label" style={{display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px'}}>
              <span>Сортировка:</span>
              <select
                className="deck-detail-sort-select"
                value={sort}
                onChange={e => setSort(e.target.value as 'name' | 'type')}
              >
                <option value="name">По имени (А–Я)</option>
                <option value="type">По категории</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {filteredEntities.length === 0 ? (
        <div className="empty-state">
          <p className="muted">
            {query || typeFilter !== 'all'
              ? 'Объекты не найдены по заданным фильтрам'
              : 'В этой колоде пока нет объектов'}
          </p>
          {!query && typeFilter === 'all' && (
            <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
              {!isUntagged && (
                <button
                  type="button"
                  className="button primary"
                  onClick={() => setShowAddExisting(true)}
                >
                  Выбрать из базы
                </button>
              )}
              <button
                type="button"
                className="button outline"
                onClick={() => onCreateEntity(isUntagged ? undefined : deckId)}
              >
                Создать объект
              </button>
            </div>
          )}
        </div>
      ) : (
        <section className="deck-entity-grid" aria-label="Объекты колоды">
          {filteredEntities.map(e => {
            const img = ix.mediaByEntity.get(e.id)?.[0];
            const mastery = getEntityMasterySummary(e.id, snapshot);
            const typeName = typeMap.get(e.type) ?? e.type;

            return (
              <article
                key={e.id}
                className="deck-entity-card"
                onClick={() => onSelectEntity(e)}
                onKeyDown={ev => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    onSelectEntity(e);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Объект: ${e.name}, тип: ${typeName}, статус: ${mastery.label}`}
              >
                <div className="deck-entity-thumb-wrap">
                  {img ? (
                    <KnowledgeImage src={img.url} alt="" className="deck-entity-thumb" />
                  ) : (
                    <div className="deck-entity-thumb-fallback">
                      <span>{e.name.trim()[0]?.toUpperCase() ?? '•'}</span>
                    </div>
                  )}
                </div>

                <div className="deck-entity-card-info">
                  <p className="deck-entity-eyebrow">{getEntityEyebrow(e)}</p>
                  <h3 className="deck-entity-name">{e.name}</h3>
                </div>

                <div className="deck-entity-footer">
                  <span className="deck-entity-mastery" title={mastery.label}>
                    <span aria-hidden="true">{mastery.mark}</span>
                    <span>{mastery.label}</span>
                  </span>
                  {!isUntagged && (
                    <button
                      type="button"
                      className="deck-entity-detach-btn"
                      title="Убрать из колоды"
                      disabled={busy}
                      onClick={ev => void handleDetach(e.id, ev)}
                    >
                      Убрать
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Tag settings dialog */}
      {showSettings && tag && (
        <div className="overlay nested" onMouseDown={e => e.target === e.currentTarget && setShowSettings(false)}>
          <section className="editor-panel" role="dialog" aria-modal="true" aria-label="Настройки колоды">
            <div className="section-heading">
              <h2>Настройки колоды</h2>
              <button type="button" className="icon-button" onClick={() => setShowSettings(false)} aria-label="Закрыть">
                ×
              </button>
            </div>

            <label>
              Название колоды
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                maxLength={100}
              />
            </label>

            <label>
              Родительская колода
              <select value={editParent} onChange={e => setEditParent(e.target.value)}>
                <option value="">Без родительской (основная колода)</option>
                {otherTags.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}>
              <button
                type="button"
                className="button primary"
                disabled={busy || !editName.trim()}
                onClick={() => void handleSaveTag()}
              >
                Сохранить
              </button>
              <button
                type="button"
                className="button destructive"
                disabled={busy}
                onClick={() => void handleDeleteTag()}
                style={{background: '#c74744', color: '#fff', borderColor: '#c74744'}}
              >
                Удалить колоду
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Add existing entities modal */}
      {showAddExisting && (
        <div className="overlay nested" onMouseDown={e => e.target === e.currentTarget && setShowAddExisting(false)}>
          <section className="editor-panel" role="dialog" aria-modal="true" aria-label="Выбрать объекты из базы">
            <div className="section-heading">
              <h2>Добавить объекты в колоду</h2>
              <button type="button" className="icon-button" onClick={() => setShowAddExisting(false)} aria-label="Закрыть">
                ×
              </button>
            </div>

            <p className="muted" style={{fontSize: '13px', margin: '0 0 12px'}}>
              Отметьте объекты, которые хотите включить в колоду «{deckTitle}».
            </p>

            <div className="search">
              <input
                type="search"
                placeholder="Поиск по имени объекта…"
                value={existingQuery}
                onChange={e => setExistingQuery(e.target.value)}
              />
            </div>

            <div className="deck-candidate-list">
              {candidateEntities.length === 0 ? (
                <p className="muted" style={{padding: '16px', textAlign: 'center'}}>
                  Нет доступных объектов для добавления
                </p>
              ) : (
                candidateEntities.map(cand => {
                  const isChecked = selectedToAdd.has(cand.id);
                  return (
                    <label key={cand.id} className="deck-candidate-row">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          const next = new Set(selectedToAdd);
                          if (e.target.checked) next.add(cand.id);
                          else next.delete(cand.id);
                          setSelectedToAdd(next);
                        }}
                      />
                      <div className="deck-candidate-info">
                        <span className="deck-candidate-name">{cand.name}</span>
                        <span className="deck-candidate-type">{typeMap.get(cand.type) ?? cand.type}</span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px'}}>
              <button type="button" className="button outline" onClick={() => setShowAddExisting(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="button primary"
                disabled={busy || selectedToAdd.size === 0}
                onClick={() => void handleAddExisting()}
              >
                Добавить выбранные ({selectedToAdd.size})
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
```

### File: res://src/components/knowledge/DeckKnowledgeBrowser.tsx
```typescript
import {useMemo, useState} from 'react';
import type {Snapshot, Entity} from '../../lib/engi/types';
import {indexes} from '../../lib/engi/indexes';
import {entityTypes} from '../../lib/engi/knowledge/properties';
import {saveTag, newId} from '../../services/knowledge-service';
import {getEntityMasterySummary, UNTAGGED_TAG_ID} from '../../lib/engi/knowledge/decks';
import {DeckCatalog} from './DeckCatalog';
import {DeckDetailView} from './DeckDetailView';
import {EntityPage} from './EntityPage';
import {EntityEditor} from './EntityEditor';
import {KnowledgeImage} from './KnowledgeImage';
import {ConflictResolver} from './ConflictResolver';
import './decks.css';

export function DeckKnowledgeBrowser({
  snapshot,
  onReload,
  onStudy,
}: {
  snapshot: Snapshot;
  onReload: () => Promise<void>;
  onStudy: (tag: string) => void;
}) {
  const activeTags = useMemo(
    () => snapshot.bundle.tags.filter(t => !t.archived),
    [snapshot.bundle.tags]
  );
  const allEntities = useMemo(
    () => snapshot.bundle.entities.filter(e => !e.archived),
    [snapshot.bundle.entities]
  );

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'decks' | 'objects'>(activeTags.length > 0 ? 'decks' : 'objects');

  const [detail, setDetail] = useState<Entity | null>(null);
  const [edit, setEdit] = useState<Entity | null | undefined>(undefined);
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckParent, setNewDeckParent] = useState('');
  const [busy, setBusy] = useState(false);

  // Flat objects view filters
  const [objectQuery, setObjectQuery] = useState('');
  const [objectTagFilter, setObjectTagFilter] = useState('all');
  const [objectTypeFilter, setObjectTypeFilter] = useState('all');
  const [limit, setLimit] = useState(48);

  const ix = useMemo(() => indexes(snapshot.bundle), [snapshot.bundle]);
  const typeMap = useMemo(
    () => new Map(entityTypes(snapshot.bundle).map(t => [t.id, t.name])),
    [snapshot.bundle]
  );

  const filteredObjects = useMemo(() => {
    const q = objectQuery.trim().toLowerCase().replace(/ё/g, 'е');
    return allEntities.filter(e => {
      if (objectTypeFilter !== 'all' && e.type !== objectTypeFilter) return false;
      if (objectTagFilter !== 'all') {
        const entityTags = ix.tagsByEntity.get(e.id);
        if (!entityTags?.has(objectTagFilter)) return false;
      }
      if (!q) return true;
      const searchString = ix.searchByEntity.get(e.id);
      if (searchString && searchString.includes(q)) return true;
      return [e.name, ...(e.aliases ?? [])].some(n =>
        n.toLowerCase().replace(/ё/g, 'е').includes(q)
      );
    });
  }, [allEntities, objectQuery, objectTagFilter, objectTypeFilter, ix]);

  async function handleCreateDeck() {
    if (!newDeckName.trim()) return;
    setBusy(true);
    try {
      await saveTag({
        id: newId(),
        name: newDeckName.trim(),
        parentId: newDeckParent || undefined,
      });
      setNewDeckName('');
      setNewDeckParent('');
      setShowCreateDeck(false);
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {selectedDeckId ? (
        <DeckDetailView
          deckId={selectedDeckId}
          snapshot={snapshot}
          onBack={() => {
            const currentTag = snapshot.bundle.tags.find(t => t.id === selectedDeckId);
            if (currentTag?.parentId) {
              setSelectedDeckId(currentTag.parentId);
            } else {
              setSelectedDeckId(null);
            }
          }}
          onStudy={onStudy}
          onSelectEntity={e => setDetail(e)}
          onCreateEntity={() => setEdit(null)}
          onReload={onReload}
          onSelectDeck={id => setSelectedDeckId(id)}
        />
      ) : (
        <div className="deck-browser-root" style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
          <div className="deck-browser-nav-row">
            <div className="deck-view-switcher" role="tablist" aria-label="Режим отображения">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'decks'}
                className={`deck-view-tab ${viewMode === 'decks' ? 'is-active' : ''}`}
                onClick={() => setViewMode('decks')}
              >
                Колоды ({activeTags.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'objects'}
                className={`deck-view-tab ${viewMode === 'objects' ? 'is-active' : ''}`}
                onClick={() => setViewMode('objects')}
              >
                Все объекты ({allEntities.length})
              </button>
            </div>
          </div>

          {viewMode === 'decks' ? (
            <DeckCatalog
              snapshot={snapshot}
              onSelectDeck={id => setSelectedDeckId(id)}
              onStudy={onStudy}
              onCreateDeck={() => setShowCreateDeck(true)}
              onCreateEntity={() => setEdit(null)}
              onReload={onReload}
            />
          ) : (
            <div className="flat-objects-browser">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">База знаний</p>
                  <h1>Все объекты</h1>
                </div>
                <button type="button" className="button primary" onClick={() => setEdit(null)}>
                  + Новый объект
                </button>
              </div>

              <div className="catalog-toolbar">
                <div className="search">
                  <input
                    type="search"
                    placeholder="Название, тег, значение или связанный объект…"
                    value={objectQuery}
                    onChange={e => {
                      setObjectQuery(e.target.value);
                      setLimit(48);
                    }}
                    aria-label="Поиск по всем объектам"
                  />
                </div>
                <div className="toolbar-filters" style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  <select
                    value={objectTagFilter}
                    onChange={e => {
                      setObjectTagFilter(e.target.value);
                      setLimit(48);
                    }}
                    aria-label="Фильтр по колоде"
                  >
                    <option value="all">Все колоды</option>
                    {activeTags.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={objectTypeFilter}
                    onChange={e => {
                      setObjectTypeFilter(e.target.value);
                      setLimit(48);
                    }}
                    aria-label="Фильтр по типу"
                  >
                    <option value="all">Все типы</option>
                    {entityTypes(snapshot.bundle).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ConflictResolver bundle={snapshot.bundle} onReload={onReload} />

              <div className="catalog-grid">
                {filteredObjects.slice(0, limit).map(e => {
                  const img = ix.mediaByEntity.get(e.id)?.[0];
                  const mastery = getEntityMasterySummary(e.id, snapshot);
                  const typeName = typeMap.get(e.type) ?? e.type;

                  return (
                    <button
                      type="button"
                      className="object-card"
                      key={e.id}
                      onClick={() => setDetail(e)}
                    >
                      <div className="deck-entity-thumb-wrap">
                        {img ? (
                          <KnowledgeImage src={img.url} alt={e.name} className="deck-entity-thumb" />
                        ) : (
                          <div className="deck-entity-thumb-fallback">
                            <span>{e.name.trim()[0]?.toUpperCase() ?? '•'}</span>
                          </div>
                        )}
                      </div>
                      <p className="eyebrow">{typeName}</p>
                      <h3>{e.name}</h3>
                      <span className="deck-entity-mastery" style={{marginTop: 'auto', paddingTop: '4px'}}>
                        <span aria-hidden="true">{mastery.mark}</span> {mastery.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredObjects.length > limit && (
                <div style={{display: 'flex', justifyContent: 'center', margin: '20px 0'}}>
                  <button type="button" className="button outline" onClick={() => setLimit(n => n + 48)}>
                    Показать ещё
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Object detail view */}
      {detail && (
        <EntityPage
          entity={detail}
          snapshot={snapshot}
          onEdit={() => {
            const current = detail;
            setDetail(null);
            setEdit(current);
          }}
          onClose={() => setDetail(null)}
          onOpen={e => setDetail(e)}
          onReload={onReload}
        />
      )}

      {/* Object editor modal */}
      {edit !== undefined && (
        <EntityEditor
          bundle={snapshot.bundle}
          initial={edit ?? undefined}
          onSave={async () => {
            setEdit(undefined);
            await onReload();
          }}
          onClose={() => setEdit(undefined)}
        />
      )}

      {/* Create deck dialog */}
      {showCreateDeck && (
        <div
          className="overlay nested"
          onMouseDown={e => e.target === e.currentTarget && setShowCreateDeck(false)}
        >
          <section className="editor-panel" role="dialog" aria-modal="true" aria-label="Новая колода">
            <div className="section-heading">
              <h2>Новая колода</h2>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowCreateDeck(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            <label>
              Название колоды
              <input
                type="text"
                placeholder="Например, Импрессионизм или Президенты"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </label>

            <label>
              Родительская колода (по желанию)
              <select value={newDeckParent} onChange={e => setNewDeckParent(e.target.value)}>
                <option value="">Без родительской (основная колода)</option>
                {activeTags.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px'}}>
              <button type="button" className="button outline" onClick={() => setShowCreateDeck(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="button primary"
                disabled={busy || !newDeckName.trim()}
                onClick={() => void handleCreateDeck()}
              >
                {busy ? 'Создаём…' : 'Создать колоду'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
```

### File: res://src/components/knowledge/decks.css
```css
.deck-catalog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.catalog-heading-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.deck-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}
.deck-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--card, #fff);
  border: 1px solid var(--border, #dfe5eb);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 160ms ease, border-color 160ms ease;
  outline: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.deck-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--primary, #184be7);
}
.deck-card:focus-visible {
  outline: 3px solid var(--ring, #184be7);
  outline-offset: 2px;
}
.deck-card.is-untagged {
  border-style: dashed;
  background: var(--muted, #f8fafc);
}

/* Art Stack */
.deck-art-stack {
  position: relative;
  width: 100%;
  height: 136px;
  min-height: 136px;
  max-height: 136px;
  flex-shrink: 0;
  background: var(--secondary, #edf1f6);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deck-art-stack img,
.deck-stack-img {
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

.deck-stack-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: var(--card, #fff);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  font-size: 30px;
}

.deck-stack-single,
.deck-stack-double,
.deck-stack-triple {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.deck-stack-img {
  width: 84px;
  height: 108px;
  max-width: 84px;
  max-height: 108px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
  border: 2px solid var(--card, #fff);
}

.deck-stack-single .deck-stack-img {
  position: relative;
  transform: none;
  z-index: 1;
}

.deck-stack-double .deck-stack-img,
.deck-stack-triple .deck-stack-img {
  position: absolute;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.deck-stack-double .stack-back {
  transform: translateX(-18px) rotate(-6deg);
  z-index: 1;
}

.deck-stack-double .stack-front {
  transform: translateX(18px) rotate(4deg);
  z-index: 2;
}

.deck-stack-triple .stack-left {
  transform: translateX(-40px) rotate(-8deg) scale(0.92);
  z-index: 1;
}

.deck-stack-triple .stack-right {
  transform: translateX(40px) rotate(8deg) scale(0.92);
  z-index: 2;
}

.deck-stack-triple .stack-center {
  transform: translateX(0) rotate(0deg) scale(1);
  z-index: 3;
}

.deck-card:hover .stack-left {
  transform: translateX(-50px) rotate(-12deg) scale(0.92);
}

.deck-card:hover .stack-right {
  transform: translateX(50px) rotate(12deg) scale(0.92);
}

.deck-card-body {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 10px;
  flex: 1;
}
.deck-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.deck-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--foreground, #182b38);
  overflow-wrap: anywhere;
}
.deck-badge-subtags {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--muted, #f1f4f7);
  color: var(--muted-foreground, #697886);
  white-space: nowrap;
}
.deck-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.deck-count {
  font-size: 13px;
  color: var(--muted-foreground, #697886);
}
.deck-badge-due {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  background: #ffedd5;
  color: #c2410c;
}

.deck-progress-row {
  margin-top: auto;
  min-height: 24px;
  display: flex;
  align-items: center;
}
.deck-retention {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.deck-retention-track {
  flex: 1;
  height: 6px;
  background: var(--muted, #edf1f6);
  border-radius: 9999px;
  overflow: hidden;
}
.deck-retention-fill {
  height: 100%;
  background: var(--primary, #184be7);
  border-radius: 9999px;
  transition: width 200ms ease;
}
.deck-retention-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--foreground, #182b38);
  white-space: nowrap;
}
.deck-unstarted {
  font-size: 12px;
  color: var(--muted-foreground, #697886);
}

.deck-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}
.deck-study-btn {
  min-height: 44px;
  min-width: 80px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  touch-action: manipulation;
}

.deck-untagged-section {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-divider {
  display: flex;
  align-items: baseline;
  gap: 10px;
  border-top: 1px solid var(--border, #dfe5eb);
  padding-top: 20px;
}
.section-divider h2 {
  font-size: 20px;
  margin: 0;
}

@media (max-width: 640px) {
  .deck-grid {
    grid-template-columns: 1fr;
  }
}

/* Deck Detail View */
.deck-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.deck-detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.deck-detail-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  font-size: 14px;
  font-weight: 600;
  color: var(--primary, #184be7);
  background: none;
  border: none;
  padding: 6px 10px;
  border-radius: 10px;
}
.deck-detail-back:hover {
  background: var(--muted, #f1f4f7);
}

.deck-detail-hero {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  background: var(--card, #fff);
  border: 1px solid var(--border, #dfe5eb);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.deck-detail-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.deck-detail-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.deck-detail-title-group h1 {
  font-size: clamp(22px, 3.2vw, 30px);
  margin: 0;
}
.deck-detail-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.deck-catalog-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.deck-section-count {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 9999px;
  background: var(--muted, #f1f4f7);
  color: var(--muted-foreground, #697886);
}

.dark .deck-section-count {
  background: var(--secondary, #203548);
  color: var(--muted-foreground, #b4c3d1);
}

.deck-retention-fill.is-completed {
  background: #16a34a;
}

.deck-detail-stats-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid var(--border, #dfe5eb);
}
.deck-detail-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
}
.deck-detail-stat-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--foreground, #182b38);
}
.deck-detail-stat-label {
  font-size: 12px;
  color: var(--muted-foreground, #697886);
}

.deck-detail-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.deck-detail-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.deck-type-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.deck-type-pill {
  min-height: 34px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 9999px;
  border: 1px solid var(--border, #dfe5eb);
  background: var(--card, #fff);
  color: var(--muted-foreground, #697886);
  cursor: pointer;
  transition: all 140ms ease;
}
.deck-type-pill.is-active {
  background: var(--primary, #184be7);
  color: #fff;
  border-color: var(--primary, #184be7);
}
.deck-detail-sort-select {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--border, #dfe5eb);
  background: var(--card, #fff);
  color: var(--foreground, #182b38);
}

.deck-entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.deck-entity-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  background: var(--card, #fff);
  border: 1px solid var(--border, #dfe5eb);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  padding: 12px;
  gap: 8px;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}
.deck-entity-card:hover {
  border-color: var(--primary, #184be7);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}
.deck-entity-card:focus-visible {
  outline: 3px solid var(--ring, #184be7);
  outline-offset: 2px;
}
.deck-entity-thumb-wrap {
  width: 100%;
  height: 140px;
  border-radius: 12px;
  background: var(--secondary, #edf1f6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  padding: 6px;
  box-sizing: border-box;
}

.deck-entity-thumb,
.object-card img.deck-entity-thumb,
.object-card .deck-entity-thumb {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain !important;
  display: block;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 160ms ease;
}

.dark .deck-entity-thumb,
.dark .object-card .deck-entity-thumb {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

.deck-entity-card:hover .deck-entity-thumb,
.object-card:hover .deck-entity-thumb {
  transform: scale(1.03);
}

.deck-entity-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--muted-foreground, #697886);
}
.deck-entity-card-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
}
.deck-entity-eyebrow {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-foreground, #697886);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}
.deck-entity-name {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  overflow-wrap: anywhere;
}
.deck-entity-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: auto;
  padding-top: 6px;
}
.deck-entity-mastery {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--muted-foreground, #697886);
}
.deck-entity-detach-btn {
  font-size: 12px;
  font-weight: 500;
  color: var(--destructive, #c74744);
  background: none;
  border: none;
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  touch-action: manipulation;
}
.deck-entity-detach-btn:hover {
  background: #fee2e2;
}

/* Add existing items modal list */
.deck-candidate-list {
  max-height: 380px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 14px 0;
}
.deck-candidate-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border, #dfe5eb);
  border-radius: 12px;
  cursor: pointer;
  background: var(--card, #fff);
  user-select: none;
}
.deck-candidate-row:hover {
  background: var(--muted, #f8fafc);
}
.deck-candidate-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.deck-candidate-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.deck-candidate-name {
  font-size: 14px;
  font-weight: 600;
}
.deck-candidate-type {
  font-size: 12px;
  color: var(--muted-foreground, #697886);
}

@media (max-width: 540px) {
  .deck-entity-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

/* View Switcher */
.deck-browser-root,
.deck-catalog,
.deck-detail {
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}

.deck-view-switcher {
  display: inline-flex;
  background: var(--muted, #f1f4f7);
  padding: 4px;
  border-radius: 14px;
  gap: 4px;
  border: 1px solid var(--border, #dfe5eb);
}

.deck-view-tab {
  border: none;
  background: none;
  min-height: 40px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted-foreground, #697886);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all 140ms ease;
}

.deck-view-tab.is-active {
  background: var(--card, #fff);
  color: var(--foreground, #182b38);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.deck-browser-nav-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Dark Mode Overrides */
.dark .deck-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.dark .deck-card:hover {
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
}

.dark .deck-card.is-untagged {
  background: rgba(32, 53, 72, 0.35);
}

.dark .deck-art-stack {
  background: var(--muted, #203548);
}

.dark .deck-stack-fallback {
  background: var(--card, #192b3b);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

.dark .deck-stack-double .deck-stack-img,
.dark .deck-stack-triple .deck-stack-img {
  border-color: var(--card, #192b3b);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.dark .deck-badge-due {
  background: rgba(194, 65, 12, 0.25);
  color: #fb923c;
}

.dark .deck-badge-subtags {
  background: var(--secondary, #203548);
  color: var(--muted-foreground, #b4c3d1);
}

.dark .deck-entity-detach-btn:hover {
  background: rgba(199, 71, 68, 0.2);
}

.dark .deck-candidate-row:hover {
  background: var(--secondary, #203548);
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .deck-card,
  .deck-entity-card,
  .deck-stack-double .deck-stack-img,
  .deck-stack-triple .deck-stack-img,
  .deck-retention-fill {
    transition: none !important;
  }

  .deck-card:hover {
    transform: none !important;
  }

  .deck-card:hover .stack-left,
  .deck-card:hover .stack-right {
    transform: none !important;
  }
}
```

### File: res://src/components/knowledge/entity-learning.css
```css
.entity-learning{min-width:0}.entity-learning h3{margin:0 0 12px}.entity-learning-list{display:flex;flex-direction:column;gap:10px}
.entity-learning-row{position:relative;width:100%;min-height:64px;display:flex;flex-direction:column;align-items:flex-start;gap:7px;text-align:left;padding:14px 42px 14px 14px;border:1px solid var(--border,#dfe5eb);border-radius:14px;background:var(--card,#fff);color:var(--foreground,#182b38);font:inherit;overflow-wrap:anywhere}
.entity-learning-row strong{font-size:15px;line-height:1.4}.entity-learning-state{display:flex;align-items:center;gap:8px;font-size:14px;line-height:1.5;margin:0}.entity-learning-row small{font-size:13px;line-height:1.4;color:var(--muted-foreground,#697886)}
.entity-learning-arrow{position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:25px;color:var(--muted-foreground,#697886)}
.entity-learning-row:focus-visible,.unit-learning-detail button:focus-visible{outline:3px solid var(--ring,#184be7);outline-offset:3px}
.unit-learning-overlay{padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));box-sizing:border-box}
.unit-learning-detail{width:min(560px,100%);max-height:calc(100dvh - max(16px,env(safe-area-inset-top)) - max(16px,env(safe-area-inset-bottom)));overflow-wrap:anywhere;overscroll-behavior:contain}
.unit-learning-detail .section-heading{align-items:flex-start}.unit-learning-detail h2{font-size:22px;line-height:1.35;min-width:0}.unit-learning-detail .icon-button{flex-shrink:0;min-width:44px;min-height:44px}
.unit-learning-value{font-size:18px;line-height:1.5;font-weight:600;margin:0;white-space:pre-wrap}
.unit-learning-metrics{display:grid;gap:12px;margin:0}.unit-learning-metrics>div{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding-bottom:10px;border-bottom:1px solid var(--border,#dfe5eb)}
.unit-learning-metrics dt{font-size:14px;color:var(--muted-foreground,#697886);max-width:55%;line-height:1.45}.unit-learning-metrics dd{margin:0;font-size:14px;text-align:right;line-height:1.45;font-variant-numeric:tabular-nums}
.unit-learning-confusions h3{font-size:16px;margin:0 0 10px}.unit-learning-confusions ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}.unit-learning-confusions li{display:flex;justify-content:space-between;gap:16px;font-size:14px}.unit-learning-toggle{min-height:48px;white-space:normal}
@media(max-width:430px){.unit-learning-detail{padding:20px;gap:16px}.unit-learning-metrics>div{flex-direction:column;align-items:flex-start;gap:4px}.unit-learning-metrics dt{max-width:100%}.unit-learning-metrics dd{text-align:left}}

```

### File: res://src/components/knowledge/EntityEditor.tsx
```typescript
import {useState} from 'react';
import type {Bundle,Entity,Fact,PropertyDefinition} from '../../lib/engi/types';
import {entityTypes,properties} from '../../lib/engi/knowledge/properties';
import {newId,saveEntity,saveEntityType,saveTag,uploadImage,archiveEntity} from '../../services/knowledge-service';
import {PropertyEditor} from './PropertyEditor';
import {RelationPicker} from './RelationPicker';
export function EntityEditor({bundle,initial,onSave,onClose}:{bundle:Bundle;initial?:Entity;onSave:()=>void;onClose:()=>void}){
 const [b,setB]=useState(bundle),[entity,setEntity]=useState<Entity>(initial??{id:newId(),name:'',type:'person',aliases:[],externalIds:{},origin:'user'});const [facts,setFacts]=useState<Fact[]>(bundle.facts.filter(f=>f.entityId===initial?.id)),[tags,setTags]=useState(bundle.entityTags.filter(t=>t.entityId===initial?.id&&!t.archived).map(t=>t.tagId));const [field,setField]=useState(''),[fieldSearch... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 const defs=properties(b);const change=(id:string,delta:Partial<Fact>)=>setFacts(a=>a.map(f=>f.id===id?{...f,...delta}:f));const add=(p:PropertyDefinition)=>{const fact:Fact={id:newId(),entityId:entity.id,key:p.id,valueKind:p.valueKind,source:{kind:'manual',name:'Личное знание'},verification:'user_confirmed',origin:'user',...(p.valueKind==='boolean'?{valueBoolean:false}:{})};setFacts(a=>[...a,fact... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 return <div className="overlay"><section className="editor-panel" role="dialog" aria-modal="true" aria-label="Редактировать объект"><div className="section-heading"><h2>{initial?'Редактировать объект':'Новый объект'}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть">×</button></div><label>Название<input value={entity.name} onChange={e=>setEntity({...entity,name:e.target.v... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}

```

### File: res://src/components/knowledge/EntityLearningPanel.tsx
```typescript
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {Item,Memory,Snapshot} from '../../lib/engi/types';
import {indexes} from '../../lib/engi/indexes';
import {canonicalTargets} from '../../lib/engi/questions/recipe-factory';
import {currentMastery} from '../../lib/engi/learning/mastery';
import {retention} from '../../lib/engi/engine';
import {textValue} from '../../lib/engi/knowledge/properties';
import {setUnitSuspended} from '../../services/learning-service';
import './entity-learning.css';

const marks:Record<string,string>={red:'🔴',orange:'🟠',yellow:'🟡',green:'🟢',suspended:'★'};
const numeric=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1});
function dateLabel(value:unknown,includeTime=false){
 if(!value)return 'Пока не было';
 const date=new Date(value as string);
 if(!Number.isFinite(date.getTime()))return 'Пока нет даты';
 return date.toLocaleString('ru-RU',includeTime?{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:'long',year:'numeric'});
}
function nextLabel(memory?:Memory){
 if(memory?.status==='suspended')return 'Не запланировано';
 if(!memory)return 'После знакомства';
 const due=new Date(memory.card.due),end=new Date();end.setHours(23,59,59,999);
 if(!Number.isFinite(due.getTime()))return 'Пока нет даты';
 return due<=end?'Повторить сегодня':`Следующее: ${dateLabel(due)}`;
}

export function EntityLearningPanel({entityId,snapshot,onReload}:{entityId:string;snapshot:Snapshot;onReload:()=>void}){
 const [selectedId,setSelectedId]=useState<string>();
 const bundle=snapshot.bundle,ix=indexes(bundle),targets=canonicalTargets(bundle);
 const items=targets.filter(item=>item.factId?bundle.facts.find(f=>f.id===item.factId)?.entityId===entityId:item.entityId===entityId);
 const memories=new Map(snapshot.memories.filter(m=>!m.legacyOf).map(m=>[m.id,m]));
 function label(item:Item){
  const fact=bundle.facts.find(f=>f.id===item.factId);
  if(!fact)return 'Портрет → имя';
  const property=ix.propertyById.get(fact.key),base=property?.name??fact.key;
  if(item.targetId.endsWith(':reverse'))return property?.inverse?.name??`${base} → объект`;
  const hasVisual=items.some(other=>other.factId===item.factId&&other.targetId.endsWith(':visual'));
  return hasVisual?`${base} · ${item.targetId.endsWith(':visual')?'по изображению':'по имени'}`:base;
 }
 const selected=items.find(item=>item.targetId===selectedId);
 if(!items.length)return null;
 return <section className="entity-learning" aria-label="Обучение по свойствам">
  <h3>Обучение по свойствам</h3>
  <div className="entity-learning-list">{items.map(item=>{
   const memory=memories.get(item.targetId),mastery=currentMastery(memory);
   return <button type="button" className="entity-learning-row" key={item.targetId} onClick={()=>setSelectedId(item.targetId)} aria-haspopup="dialog">
    <strong>{label(item)}</strong>
    <span className="entity-learning-state"><span aria-hidden="true">{marks[mastery.color]}</span> {mastery.label}</span>
    {mastery.color!=='suspended'&&<small>{nextLabel(memory)}</small>}
    <span className="entity-learning-arrow" aria-hidden="true">›</span>
   </button>;
  })}</div>
  {selected&&<UnitLearningDetail key={selected.targetId} item={selected} label={label(selected)} snapshot={snapshot} memory={memories.get(selected.targetId)} onClose={()=>setSelectedId(undefined)} onReload={onReload}/>}
 </section>;
}

function UnitLearningDetail({item,label,snapshot,memory,onClose,onReload}:{item:Item;label:string;snapshot:Snapshot;memory?:Memory;onClose:()=>void;onReload:()=>void}){
 const panel=useRef<HTMLElement>(null),closeButton=useRef<HTMLButtonElement>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;closeButton.current?.focus();
  function keydown(event:KeyboardEvent){
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(!lock.current)onClose()}
   if(event.key!=='Tab')return;
   const controls=[...panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex="0"]')??[]];
   const first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }
  document.addEventListener('keydown',keydown,true);
  return()=>{document.removeEventListener('keydown',keydown,true);previous?.focus()};
 },[]);
 async function toggle(){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await setUnitSuspended(item.targetId,memory?.status!=='suspended');onReload();onClose()}
  catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить. Попробуйте ещё раз.')}
  finally{lock.current=false;setBusy(false)}
 }
 const fact=snapshot.bundle.facts.find(f=>f.id===item.factId);
 const mastery=currentMastery(memory),attempts=memory?.attempts??0,errors=Math.max(0,attempts-(memory?.correct??0));
 const confusionNames=new Map(canonicalTargets(snapshot.bundle).map(target=>[target.targetId,target.answer]));
 const confusions=Object.entries(memory?.confusions??{}).filter(([,count])=>count>0).sort((a,b)=>b[1]-a[1]);
 function confusionName(value:string){
  return snapshot.bundle.entities.find(e=>e.id===value)?.name??confusionNames.get(value)??snapshot.bundle.facts.find(f=>f.id===value)?.valueText??(/^(ku:|fact:|entity:)/.test(value)?'Другой ответ':value);
 }
 return createPortal(<div className="overlay nested unit-learning-overlay" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}>
  <section className="editor-panel unit-learning-detail" role="dialog" aria-modal="true" aria-labelledby="unit-learning-title" ref={panel} aria-busy={busy}>
   <div className="section-heading"><h2 id="unit-learning-title">{label}</h2><button ref={closeButton} type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Закрыть детали обучения">×</button></div>
   <p className="unit-learning-value">{fact&&!item.targetId.endsWith(':reverse')?textValue(fact,snapshot.bundle):item.answer}</p>
   <p className="entity-learning-state"><span aria-hidden="true">{marks[mastery.color]}</span> {mastery.label}</p>
   <dl className="unit-learning-metrics">
    <div><dt>Последнее повторение</dt><dd>{dateLabel(memory?.lastReviewAt??memory?.card.last_review,true)}</dd></div>
    <div><dt>Следующее повторение</dt><dd>{nextLabel(memory)}</dd></div>
    <div><dt>Устойчивость памяти</dt><dd>{memory?.firstSuccessAt?`${numeric.format(Number(memory.card.stability)||0)} дн.`:'Пока нет данных'}</dd></div>
    <div><dt>Вероятность вспомнить сейчас</dt><dd>{memory?.firstSuccessAt?`≈ ${Math.round(retention(memory)*100)}%`:'Нужна первая успешная проверка'}</dd></div>
    <div><dt>Попытки</dt><dd>{attempts}</dd></div>
    <div><dt>Ошибки</dt><dd>{errors}</dd></div>
   </dl>
   <div className="unit-learning-confusions"><h3>С чем путалось</h3>{confusions.length?<ul>{confusions.map(([value,count])=><li key={value}><span>{confusionName(value)}</span><span>{numeric.format(count)}</span></li>)}</ul>:<p className="muted">Путаницы пока нет.</p>}</div>
   <button type="button" className="button unit-learning-toggle" disabled={busy} onClick={()=>void toggle()}>{memory?.status==='suspended'?'Вернуть в обучение':'★ Не учить это свойство'}</button>
   {memory?.status==='suspended'&&<p className="muted">Свойство сохранено и исключено из обычных повторений. Его можно вернуть в любой момент.</p>}
   {error&&<p className="bad-text" role="alert">{error}</p>}
  </section>
 </div>,document.body);
}

```

### File: res://src/components/knowledge/EntityPage.tsx
```typescript
import type {Entity,Snapshot} from '../../lib/engi/types';
import {indexes} from '../../lib/engi/indexes';
import {textValue,trusted,entityTypes} from '../../lib/engi/knowledge/properties';
import {canonicalTargets} from '../../lib/engi/questions/recipe-factory';
import {EntityLearningPanel} from './EntityLearningPanel';
import {KnowledgeImage} from './KnowledgeImage';
import {saveKnowledge} from '../../services/knowledge-service';
export function EntityPage({entity,snapshot,onEdit,onClose,onOpen,onReload}:{entity:Entity;snapshot:Snapshot;onEdit:()=>void;onClose:()=>void;onOpen:(e:Entity)=>void;onReload:()=>void}){
 const b=snapshot.bundle,ix=indexes(b);const facts=ix.factsByEntity.get(entity.id)??[];const incoming=ix.incomingFactsByTarget.get(entity.id)??[];const media=ix.mediaByEntity.get(entity.id)??[];const readyFacts=new Set(canonicalTargets(b).map(i=>i.factId));
 return <div className="overlay"><section className="editor-panel" role="dialog" aria-modal="true" aria-label={entity.name}><div className="section-heading"><h2>{entity.name}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть">×</button></div>{media[0]&&<KnowledgeImage src={media[0].url} alt={entity.name} className="detail-image"/>}<p className="eyebrow">{entityTypes(b).find... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}


```

### File: res://src/components/knowledge/KnowledgeBrowser.tsx
```typescript
import {useMemo,useState} from 'react';
import type {Snapshot,Entity} from '../../lib/engi/types';
import {indexes} from '../../lib/engi/indexes';
import {KnowledgeImage} from './KnowledgeImage';
import {EntityEditor} from './EntityEditor';
import {EntityPage} from './EntityPage';
import {PropertyEditor} from './PropertyEditor';
import {properties,entityTypes} from '../../lib/engi/knowledge/properties';
import {saveTag,newId} from '../../services/knowledge-service';
import {ConflictResolver} from './ConflictResolver';
export function KnowledgeBrowser({snapshot,onReload,onStudy}:{snapshot:Snapshot;onReload:()=>Promise<void>;onStudy:(tag:string)=>void}){const [query,setQuery]=useState(''),[tag,setTag]=useState('all'),[type,setType]=useState('all'),[limit,setLimit]=useState(48),[detail,setDetail]=useState<Entity|null>(null),[edit,setEdit]=useState<Entity|null|undefined>(undefined),[field,setField]=useState<string|... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 return <><div className="page-heading"><div><p className="eyebrow">Своя база знаний</p><h1>Знания</h1></div><button className="button primary" onClick={()=>setEdit(null)}>+ Новый объект</button></div><div className="catalog-toolbar"><div className="search"><input placeholder="Название, тег, значение или связанный объект" value={query} onChange={e=>{setQuery(e.target.value);setLimit(48)}}/></div><... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}

```

### File: res://src/components/knowledge/KnowledgeImage.tsx
```typescript
import {useEffect,useState} from 'react';
import {useMediaUrl} from '../../media/use-media-url';
export function KnowledgeImage({src,alt='',className='',onFail,onReady}:{src?:string;alt?:string;className?:string;onFail?:()=>void;onReady?:()=>void}){const media=useMediaUrl(src),[failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[src]);useEffect(()=>{if(media.failed)onFail?.()},[media.failed]);return media.url&&!failed?<img className={className} src={media.url} alt={alt} onLoad={... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

```

### File: res://src/components/knowledge/PropertyEditor.tsx
```typescript
import {useState} from 'react';
import type {Bundle,PropertyDefinition} from '../../lib/engi/types';
import {entityTypes} from '../../lib/engi/knowledge/properties';
import {questionPrompt,reversePromptAvailable} from '../../lib/engi/questions/question-templates';
import {newId,saveProperty} from '../../services/knowledge-service';

export function PropertyEditor({bundle,initial,onSave,onClose}:{bundle:Bundle;initial?:PropertyDefinition;onSave:(p:PropertyDefinition)=>void;onClose:()=>void}){
 const [p,setP]=useState<PropertyDefinition>(initial??{id:newId(),name:'',valueKind:'entity',cardinality:'one',learnable:true,learning:{forward:true},origin:'user'});
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const types=entityTypes(bundle);
 const previewSubject=bundle.entities.find(e=>!e.archived&&(!p.subjectTypes?.length||p.subjectTypes.includes(e.type)))?.name??'Джон Кеннеди';
 const updateTemplate=(key:keyof NonNullable<PropertyDefinition['promptTemplates']>,value:string)=>setP({...p,promptTemplates:{...p.promptTemplates,[key]:value||undefined}});
 return <div className="overlay nested"><section className="editor-panel" role="dialog" aria-modal="true" aria-label="Поле">
  <div className="section-heading"><h2>{initial?'Настроить поле':'Новое поле'}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть">×</button></div>
  <label>Название<input value={p.name} onChange={e=>setP({...p,name:e.target.value})}/></label>
  <label>Тип значения<select value={p.valueKind} disabled={!!initial} onChange={e=>setP({...p,valueKind:e.target.value as PropertyDefinition['valueKind'],learnable:e.target.value!=='text'})}>{[['entity','Другой объект'],['date','Дата'],['number','Число'],['text','Текст'],['boolean','Да / нет']].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
  <label>Какие объекты могут иметь поле<select value={p.subjectTypes?.[0]??''} onChange={e=>setP({...p,subjectTypes:e.target.value?[e.target.value]:[]})}><option value="">Любые</option>{types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
  {p.valueKind==='entity'&&<label>На какие объекты указывает<select value={p.targetTypes?.[0]??''} onChange={e=>setP({...p,targetTypes:e.target.value?[e.target.value]:[]})}><option value="">Любые</option>{types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
  <label className="check-label"><input type="checkbox" checked={p.cardinality==='many'} onChange={e=>setP({...p,cardinality:e.target.checked?'many':'one'})}/>Может иметь несколько значений</label>
  <label className="check-label"><input type="checkbox" checked={p.learnable} onChange={e=>setP({...p,learnable:e.target.checked})}/>Участвует в обучении</label>
  {p.learnable&&<>
   <label>Как спрашивать?<textarea maxLength={1000} value={p.promptTemplates?.forward??''} placeholder={questionPrompt({...p,promptTemplates:undefined},'{subject}','choice')} onChange={e=>updateTemplate('forward',e.target.value)}/></label>
   <p className="muted">{'Вставьте {subject} на месте названия объекта. Пустое поле использует обычную формулировку.'}</p>
   <p aria-live="polite">Пример: {questionPrompt(p,previewSubject,'choice')}</p>
  </>}
  <label>Описание<textarea value={p.description??''} onChange={e=>setP({...p,description:e.target.value})}/></label>
  <details><summary>Настройки обучения</summary>
   {p.valueKind==='entity'&&<>
    <label className="check-label"><input type="checkbox" checked={p.learning?.reverse??!!p.inverse?.enabled} onChange={e=>setP({...p,inverse:{...p.inverse,enabled:e.target.checked},learning:{...p.learning,reverse:e.target.checked}})}/>Проверять обратную связь, если ответ единственный</label>
    <label>Название обратного вопроса<input value={p.inverse?.name??''} onChange={e=>setP({...p,inverse:{enabled:!!p.inverse?.enabled,name:e.target.value}})}/></label>
    {p.learnable&&<>
     <label>Как спрашивать в обратную сторону?<textarea maxLength={1000} value={p.promptTemplates?.reverse??''} placeholder="Какой фильм снял {subject}?" onChange={e=>updateTemplate('reverse',e.target.value)}/></label>
     <p className="muted">{'Здесь {subject} — название ответа. Обратные вопросы требуют своей формулировки и единственного правильного ответа.'}</p>
     {(p.learning?.reverse??p.inverse?.enabled)&&!reversePromptAvailable(p)&&<p role="status">Добавьте обратный вопрос, чтобы включить этот режим.</p>}
    </>}
   </>}
   {p.learnable&&p.valueKind==='date'&&<>
    <label>Как спрашивать на временной шкале?<textarea maxLength={1000} value={p.promptTemplates?.timeline??''} placeholder={questionPrompt({...p,promptTemplates:{forward:p.promptTemplates?.forward}},'{subject}','timeline')} onChange={e=>updateTemplate('timeline',e.target.value)}/></label>
    <p aria-live="polite">Пример: {questionPrompt(p,previewSubject,'timeline')}</p>
    <label>Как просить расставить объекты по порядку?<textarea maxLength={1000} value={p.promptTemplates?.sort??''} placeholder={questionPrompt({...p,promptTemplates:undefined},'{subject}','sort')} onChange={e=>updateTemplate('sort',e.target.value)}/></label>
    <p className="muted">Сформулируйте задание для нескольких объектов, от раннего к позднему.</p>
   </>}
   {(['choice','recallReveal','match','categorize','timeline','sort','missing'] as const).map((k,n)=><label key={k}>{['Выбор ответа','Вспомнить и открыть','Сопоставление','Категории','Временная шкала','Порядок','Пропуск'][n]}<select value={p.learning?.[k]??'auto'} onChange={e=>setP({...p,learning:{...p.learning,[k]:e.target.value as 'auto'|'on'|'off'}})}><option value="auto">Автоматически</option>... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
  </details>
  {error&&<p role="alert" className="bad-text">{error}</p>}
  <button className="button primary" disabled={busy||!p.name.trim()} onClick={async()=>{setBusy(true);try{const row={...p,name:p.name.trim(),updatedAt:new Date().toISOString()};await saveProperty(row);onSave(row)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>Сохранить поле</button>
 </section></div>
}

```

### File: res://src/components/knowledge/RelationPicker.tsx
```typescript
import {useMemo,useState} from 'react';
import type {Bundle,Entity} from '../../lib/engi/types';
import {entityTypes} from '../../lib/engi/knowledge/properties';
import {newId,saveKnowledge} from '../../services/knowledge-service';
export function RelationPicker({bundle,value,targetTypes,onChange,onCreated}:{bundle:Bundle;value?:string;targetTypes?:string[];onChange:(id:string)=>void;onCreated:(e:Entity)=>void}){
 const [search,setSearch]=useState(''),[create,setCreate]=useState(false),[type,setType]=useState(targetTypes?.[0]??'city'),[error,setError]=useState('');const normalize=(s:string)=>s.toLowerCase().replace(/ё/g,'е').trim();const rows=useMemo(()=>bundle.entities.filter(e=>!e.archived&&(!targetTypes?.length||targetTypes.includes(e.type))&&[e.name,...e.aliases].some(s=>normalize(s).includes(normalize... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 return <div className="relation-picker"><input placeholder="Найти объект по имени" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Связанный объект" value={value??''} onChange={e=>onChange(e.target.value)}><option value="">Выберите объект</option>{[...new Map([...rows,...bundle.entities.filter(e=>e.id===value)].map(e=>[e.id,e])).values()].map(e=><option key={e.id} valu... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}

```

### File: res://src/components/progress/ProgressDashboard.tsx
```typescript
import type {Snapshot} from '../../lib/engi/types';
import {progress} from '../../lib/engi/knowledge/progress';
import {todayLearning} from '../../lib/engi/knowledge/motivation';
import {canonicalTargets} from '../../lib/engi/questions/recipe-factory';
import {properties} from '../../lib/engi/knowledge/properties';
import {conflicts} from '../../services/knowledge-service';
import {saveBackup} from '../../services/backup-service';
import {ConflictResolver} from '../knowledge/ConflictResolver';

export function ProgressDashboard({snapshot,onStudy,onReload}:{snapshot:Snapshot;onStudy:()=>void;onReload:()=>Promise<void>}){
 const s=snapshot,p=progress(s),today=todayLearning(s),b=s.bundle,targets=canonicalTargets(b),problem=conflicts(b);
 const targetById=new Map(targets.map(t=>[t.targetId,t]));
 return <><div className="page-heading"><h1>Что остаётся в памяти?</h1><button className="button outline" onClick={()=>void saveBackup()}>Сохранить копию</button></div>
 <div className="stat-strip">{[['Охват',`${p.covered} / ${p.total}`],['Помню сейчас',p.retention===null?'—':p.retention+'%'],['Пора повторить',p.due],['Сегодня проверено',today.retrievals]].map(([label,n])=><div key={label}><span>{label}</span><strong key={String(n)}>{n}</strong></div>)}</div>
 <p>Активных знаний: {p.total} · Ещё не открыто: {p.new} · Отложено ★: {p.suspended}</p>
 <div className="stability-strip">{[[7,p.week],[30,p.month],[90,p.quarter]].map(([days,n])=><div key={days}><strong key={n}>{n}</strong><span>Закреплено ≥{days} дней</span></div>)}</div>
 {today.stability30Gains>0&&<p className="today-learning">Сегодня укреплено: +{today.stability30Gains} знаний ≥30 дней</p>}
 <div className="progress-layout"><section className="panel"><h2>По подборкам</h2>{b.tags.filter(t=>!t.archived).map(t=>{const v=progress(s,t.id);return <div className="category-row" key={t.id}><strong>{t.name}</strong><span>{v.covered} / {v.total}</span><span>Помню {v.retention??'—'}%</span></div>})}<small>Горизонт памяти — расчёт по вашим ответам. Проверки будут уточнять его.</small></section>
 <section className="panel"><h2>По полям</h2>{properties(b).filter(prop=>targets.some(i=>b.facts.find(f=>f.id===i.factId)?.key===prop.id)).map(prop=>{const ids=new Set(targets.filter(i=>b.facts.find(f=>f.id===i.factId)?.key===prop.id).map(i=>i.targetId));return <div className="review-row" key={prop.id}><strong>{prop.name}</strong><span>{s.memories.filter(m=>ids.has(m.id)&&m.status!=='suspended'&&m... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 <section className="panel"><h2>Что путается</h2>{s.memories.filter(m=>targetById.has(m.id)&&Object.values(m.confusions).some(n=>n>.1)).slice(0,20).map(m=>{const t=targetById.get(m.id)!;return <div className="review-row" key={m.id}><strong>{t.name}</strong><span>{Object.entries(m.confusions).filter(([,n])=>n>.1).map(([id])=>`${t.answer} ↔ ${b.entities.find(e=>e.id===id)?.name??id}`).join(' · ')}</... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 <ConflictResolver bundle={b} onReload={onReload}/>
 <section className="panel"><h2>Качество знаний</h2><p>{problem.length} фактов с неоднозначным ответом</p>{problem.slice(0,10).map(f=><p key={f.id}>{b.entities.find(e=>e.id===f.entityId)?.name} · {properties(b).find(p=>p.id===f.key)?.name}</p>)}<small>Неоднозначные факты исключены из вопросов с одним ответом.</small></section>
 <section className="panel"><h2>Последние проверки</h2>{s.events.filter(e=>e.payload.feedback).slice(0,20).map(e=><div className="history-row" key={e.id}><span>{e.payload.score===1?'✓':'✕'}</span><span>{e.payload.feedback.items?.[0]?.name??'Проверка'}</span><span>{e.payload.reason==='retry'?'Уточнение после ошибки':e.level==='direct'?'Воспоминание':'Связи'}{e.payload.metadata?.attemptCount>1?` · $... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}

```

### File: res://src/components/study/ChoiceCard.tsx
```typescript
import type {Task} from '../../lib/engi/types';
import {discreteAnswer} from '../../lib/engi/questions/timeline';
export function ChoiceCard({task,attempts,feedback,busy,onChoose}:{task:Task;attempts:string[];feedback:any;busy:boolean;onChoose:(id:string)=>void}){
 const correctId=discreteAnswer(task),completed=!!feedback;
 return <div className={`feed-options ${task.discrimination?'near-twin-options':''}`}>
  {task.options.map(o=>{const wrong=attempts.includes(o.id)&&o.id!==correctId,right=completed&&o.id===correctId;return <button key={o.id} className={`feed-option ${wrong?'answer-wrong':''} ${right?'answer-correct':''}`} disabled={busy||completed||wrong} onClick={()=>onChoose(o.id)}>
   <span>{o.name}</span><span aria-hidden="true">{right?'✓':wrong?'✕':''}</span><span className="sr-only">{wrong?' — неверный вариант':right?' — верно':''}</span>
  </button>})}
 </div>;
}

```

### File: res://src/components/study/learning22.css
```css
/* Nordic Soft-Craft Archetype */
.learning22-screen{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;height:100dvh;overflow:hidden;background:#F6F3EE;color:#292524;padding-top:env(safe-area-inset-top);box-sizing:border-box;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;touch-action:pan-y;-webkit-user-select:none;user-select:none}
.learning22-screen *{box-sizing:border-box}
.learning22-card-sheet{position:relative;display:flex;flex-direction:column;height:100%;width:100%;overflow:hidden;will-change:transform;transform-origin:center bottom}
.learning22-close{position:absolute;top:max(14px,env(safe-area-inset-top));left:16px;z-index:30;display:grid;place-items:center;width:38px;height:38px;border:1px solid #E5DFD7;border-radius:50%;background:rgba(255,255,255,.88);color:#44403C;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 3px 10px rgba(120,100,80,.08);font:inherit;font-size:15px;font-weight:700;cursor:poi... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
.learning22-close:hover{background:#fff;transform:scale(1.04)}
.learning22-close:active{transform:scale(.92)}
.learning22-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.learning22-content{max-width:540px;width:100%;margin:0 auto;padding:0 20px 32px;overflow-wrap:anywhere}
.learning22-content.no-hero{padding-top:max(56px,calc(env(safe-area-inset-top) + 20px))}

/* Hero Section: Tactile Squircle Card */
.learning22-hero-wrap{position:relative;margin:max(16px,env(safe-area-inset-top)) 0 18px;width:100%;display:flex;justify-content:center;background:transparent}
.learning22-portrait{display:block;max-width:100%;width:auto;height:auto;max-height:clamp(190px,36dvh,290px);margin:0 auto;object-fit:contain;border-radius:22px;box-shadow:0 10px 28px -6px rgba(120,100,80,.12),0 2px 6px -1px rgba(120,100,80,.04);border:1px solid rgba(215,205,195,.45);background:#fff}
.learning22-hero-badge{width:76px;height:76px;margin:max(16px,env(safe-area-inset-top)) 0 16px;border-radius:24px;background:#EFE9DF;color:#C2410C;display:grid;place-items:center;font-size:32px;font-weight:700;border:1px solid #E5DFD7;box-shadow:0 4px 14px rgba(120,100,80,.06)}

/* Header & Typography */
.learning22-header-block{margin-bottom:18px;text-align:left}
.learning22-badges-strip{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:10px}
.learning22-badge{display:inline-flex;align-items:center;padding:4px 12px;border-radius:9999px;background:#EFE9DF;color:#78716C;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;border:1px solid #E5DFD7;line-height:1.2}
.learning22-content h1{font-size:clamp(24px,4.8vw,32px);line-height:1.25;margin:0 0 8px;letter-spacing:-.02em;font-weight:700;color:#1C1917}
.learning22-summary{font-size:15px;line-height:1.55;color:#78716C;margin:0}

/* Sections */
.learning22-section{margin-bottom:20px}
.learning22-section-head{display:flex;align-items:center;justify-content:flex-end;margin-bottom:8px}
.learning22-section-title{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#A8A29E;margin:0}

/* Properties List: Soft Umbra Pill Cards */
.learning22-properties{display:flex;flex-direction:column;gap:10px}
.learning22-property{min-width:0;margin:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border:1px solid #E8E2D8;border-radius:20px;background:#fff;box-shadow:0 4px 16px -2px rgba(120,100,80,.05),0 1px 3px rgba(120,100,80,.03);transition:all .2s ease}
.learning22-property.is-suspended{opacity:.45;background:#EFEAE2;border-color:#E5DFD7;box-shadow:none}
.learning22-property.is-suspended .learning22-value{text-decoration:line-through;color:#78716C}
.learning22-prop-meta{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.learning22-prop-label{font-size:11px;font-weight:600;color:#A8A29E;letter-spacing:.04em;text-transform:uppercase}
.learning22-value{font-size:16px;line-height:1.35;font-weight:600;color:#292524;overflow-wrap:anywhere}

/* Gauge: Organic Tactile Stepper */
.learning22-controls{display:flex;align-items:center;gap:8px;flex-shrink:0}
.learning22-gauge{display:flex;align-items:flex-end;gap:5px;padding:6px 10px;background:#EFE9DF;border-radius:14px;border:1px solid #E5DFD7;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;transition:background .15s ease}
.learning22-gauge-bar{width:8px;border-radius:4px;border:0;background:#D6CEC4;cursor:pointer;padding:0;pointer-events:auto;transition:background .15s ease,transform .1s ease}
.learning22-gauge-bar:active{transform:scale(.9)}
.learning22-gauge-bar-1{height:10px}
.learning22-gauge-bar-2{height:14px}
.learning22-gauge-bar-3{height:18px}
.learning22-gauge-bar-4{height:22px}

/* Earthy Nordic Palette */
.learning22-gauge-red .learning22-gauge-bar.is-active{background:#C2410C}
.learning22-gauge-orange .learning22-gauge-bar.is-active{background:#EA580C}
.learning22-gauge-yellow .learning22-gauge-bar.is-active{background:#D97706}
.learning22-gauge-green .learning22-gauge-bar.is-active{background:#15803D}
.learning22-gauge-suspended .learning22-gauge-bar.is-active{background:#A8A29E}

.learning22-ctrl-div{width:1px;height:24px;background:#E5DFD7}
.learning22-suspend-btn{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;border:1px solid transparent;background:transparent;color:#A8A29E;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s ease}
.learning22-suspend-btn:hover{background:#EFE9DF;color:#292524}
.learning22-suspend-btn.is-active{background:#FEE2E2;color:#DC2626;border-color:#FECACA}

/* Dynamic Tactile Stamp Badges */
.learning22-content{position:relative}
.learning22-stamp{position:fixed;top:max(24px,calc(env(safe-area-inset-top) + 14px));z-index:60;padding:8px 22px;border-radius:14px;border:3px solid currentColor;font-size:17px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;pointer-events:none;box-shadow:0 8px 24px rgba(120,100,80,.16);transition:opacity .1s ease}
.learning22-stamp-know{right:20px;color:#15803D;background:rgba(238,248,242,.94);backdrop-filter:blur(8px)}
.learning22-stamp-plan{left:20px;color:#C2410C;background:rgba(254,242,238,.94);backdrop-filter:blur(8px)}

/* Context & Tag Chips: Linen Pebbles */
.learning22-context-block{padding-top:4px}
.learning22-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.learning22-chip{display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border-radius:9999px;border:1px solid #E5DFD7;background:#EFE9DF;font-size:13px;line-height:1.3;color:#44403C;font-weight:500}
.learning22-chip-tag{background:#fff;border-color:#E8E2D8;font-weight:600;color:#292524;box-shadow:0 1px 3px rgba(120,100,80,.04)}
.learning22-chip-muted{color:#78716C}

/* Sticky Floating Footer */
.learning22-footer{flex-shrink:0;position:sticky;bottom:0;z-index:10;width:100%;max-width:540px;margin:0 auto;padding:12px 20px max(14px,env(safe-area-inset-bottom));background:color-mix(in srgb,#F6F3EE 88%,transparent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid #E8E2D8}
.learning22-action{width:100%;min-height:50px;padding:12px 18px;border:1px solid transparent;border-radius:18px;font:inherit;font-size:16px;font-weight:600;line-height:1.4;cursor:pointer;transition:transform .1s ease,box-shadow .15s ease}
.learning22-action:active:not(:disabled){transform:scale(.98)}
.learning22-primary{background:#C2410C;color:#fff;border-color:#C2410C;box-shadow:0 4px 16px rgba(194,65,12,.22)}
.learning22-primary:hover{background:#9A3412;border-color:#9A3412}
.learning22-quiet{background:transparent;border-color:transparent;color:#78716C}
.learning22-screen button:disabled{opacity:.6;cursor:default}
.learning22-screen button:focus-visible{outline:3px solid #C2410C;outline-offset:3px}
.learning22-error{color:#DC2626;font-size:13px;line-height:1.4;margin:0 0 10px;text-align:center}
.learning22-status{display:block;min-height:16px;margin:6px 0 0;font-size:12px;line-height:1.4;color:#78716C;text-align:center}

/* Stop Session Screen */
.learning22-stop{padding-bottom:env(safe-area-inset-bottom);background:var(--muted,#f5f6fa)}
.learning22-stop-content{padding-top:clamp(40px,14dvh,140px);padding-bottom:30px;text-align:center}
.learning22-complete{display:grid;place-items:center;width:72px;height:72px;margin:0 auto 24px;border-radius:50%;background:#e2f5eb;color:#1b744f;font-size:40px}
.learning22-stop-actions{display:flex;flex-direction:column;gap:12px;margin:28px 0 20px}

@media(max-width:360px){
 .learning22-content,.learning22-footer{padding-left:14px;padding-right:14px}
 .learning22-pill{font-size:11px;padding:4px 1px}
}

```

### File: res://src/components/study/ObjectIntroCard.tsx
```typescript
import {useEffect,useRef,useState} from 'react';
import type {SessionRow} from '../../db/engi-db';
import type {Bundle,Familiarity,Fact} from '../../lib/engi/types';
import {questionPrompt} from '../../lib/engi/questions/question-templates';
import {canonicalTargets} from '../../lib/engi/questions/recipe-factory';
import {properties,textValue} from '../../lib/engi/knowledge/properties';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import './learning22.css';

const gaugeLevels:{color:Familiarity;label:string;text:string;step:number}[]=[
 {color:'red',label:'Не знаю',text:'В план',step:1},
 {color:'orange',label:'Знакомо, но не уверен',text:'Смутно',step:2},
 {color:'yellow',label:'Скорее знаю',text:'Знакомо',step:3},
 {color:'green',label:'Знаю хорошо',text:'Знаю',step:4},
];

function formatIntroValue(fact:Fact|undefined,fallback:string,bundle:Bundle):string{
 if(!fact)return fallback;
 if(fact.valueKind==='date'){
  const y1=fact.dateStart?.slice(0,4),y2=fact.dateEnd?.slice(0,4);
  const circa=fact.datePrecision==='circa'?'Около ':'';
  if(fact.datePrecision==='year'&&y1)return `${circa}${y1} год`;
  if(y1&&y2&&y1===y2)return `${circa}${y1} год`;
  if(y1&&y2)return `${circa}${y1} — ${y2} гг.`;
 }
 return textValue(fact,bundle);
}

function getIdentityInfo(type?:string):{label:string;text:string}{
 if(type==='person')return {label:'Портрет',text:'Портрет'};
 if(type==='artwork')return {label:'Узнать картину',text:'Узнать картину'};
 if(type==='building'||type==='landmark')return {label:'Узнать сооружение',text:'Узнать сооружение'};
 if(type==='event')return {label:'Узнать событие',text:'Узнать событие'};
 return {label:'Узнать по фото',text:'Узнать по фото'};
}

export type ObjectIntroCardProps={
 intro:NonNullable<SessionRow['intro']>;
 bundle:Bundle;
 onChoose:(unitId:string,color:Familiarity)=>Promise<void>;
 onChooseAll?:(selections:Record<string,Familiarity>)=>Promise<void>;
 onDone:()=>void;
 onExit:()=>void;
 busy?:boolean;
 error?:string;
};

export function ObjectIntroCard({intro,bundle,onChoose,onChooseAll,onDone,onExit,busy=false,error}:ObjectIntroCardProps){
 const [saving,setSaving]=useState(false),[saveError,setSaveError]=useState('');
 const [selections,setSelections]=useState(intro.selections);
 const writeLock=useRef(false),pendingChoice=useRef<{unitId:string;color:Familiarity}|null>(null),activeDrag=useRef<{unitId:string;color:Familiarity}|null>(null);
 useEffect(()=>{setSelections(intro.selections);setSwipeOffset(0);setSwiping(false)},[intro.entityId,intro.selections]);
 const entity=bundle.entities.find(e=>e.id===intro.entityId);
 const unitIds=new Set(intro.unitIds);
 const items=canonicalTargets(bundle).filter(i=>unitIds.has(i.targetId));
 const propertyById=new Map(properties(bundle).map(p=>[p.id,p]));
 const mediaList=bundle.media.filter(m=>m.entityId===intro.entityId&&!m.archived&&m.learningExemplar!==false&&['primary','portrait','photo','image','artwork','painting'].includes(m.role));
 const image=mediaList.find(m=>m.primary||m.role==='primary')??mediaList[0];
 const disabled=busy||saving;
 const displayError=error||saveError;
 const [swipeOffset,setSwipeOffset]=useState(0),[swiping,setSwiping]=useState(false);
 const swipeGesture=useRef<{x:number;y:number;time:number;width:number;dx:number;dy:number;pointerId:number;locked?:boolean}|null>(null);
 const tippedRef=useRef(false);

 function handlePointerDown(e:React.PointerEvent){
  if(disabled||!e.isPrimary)return;
  if((e.target as HTMLElement).closest('button,input,textarea,select,.learning22-gauge'))return;
  if(e.clientX<24||e.clientX>window.innerWidth-24)return;
  tippedRef.current=false;
  swipeGesture.current={x:e.clientX,y:e.clientY,time:Date.now(),width:e.currentTarget.getBoundingClientRect().width,dx:0,dy:0,pointerId:e.pointerId};
  try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
 }
 function handlePointerMove(e:React.PointerEvent){
  const g=swipeGesture.current;if(!g||g.pointerId!==e.pointerId)return;
  g.dx=e.clientX-g.x;g.dy=e.clientY-g.y;
  const absX=Math.abs(g.dx),absY=Math.abs(g.dy);
  if(!g.locked){
   if(absY>8&&absY>absX*1.1){
    swipeGesture.current=null;
    try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}
    setSwiping(false);setSwipeOffset(0);
    return;
   }
   if(absX>8&&absX>absY*1.1){g.locked=true;setSwiping(true)}
  }
  if(g.locked){
   setSwipeOffset(Math.max(-g.width*.35,Math.min(g.width*.35,g.dx)));
   const threshold=Math.min(100,g.width*.22);
   if(absX>=threshold&&!tippedRef.current){tippedRef.current=true;try{navigator.vibrate?.(8)}catch{}}
   else if(absX<threshold){tippedRef.current=false}
  }
 }
 function handlePointerUp(e:React.PointerEvent){
  const g=swipeGesture.current;swipeGesture.current=null;
  try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}
  if(!g||!g.locked){setSwiping(false);setSwipeOffset(0);return}
  const distance=Math.abs(g.dx),duration=Math.max(20,Date.now()-g.time),velocity=distance/duration;
  if(distance>=g.width*.22||(distance>=45&&velocity>=.45)){
   try{navigator.vibrate?.(12)}catch{}
   setSwiping(false);
   const exitOffset=g.dx>0?(window.innerWidth||400)*1.3:-(window.innerWidth||400)*1.3;
   setSwipeOffset(exitOffset);
   if(g.dx>0)void chooseAll('green',true);else void chooseAll('red',true);
  }else{
   setSwiping(false);
   setSwipeOffset(0);
  }
 }
 function handlePointerCancel(e:React.PointerEvent){
  swipeGesture.current=null;setSwiping(false);setSwipeOffset(0);
  try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}
 }

 const rotation=Math.max(-10,Math.min(10,swipeOffset/20));
 const stampOpacity=Math.min(1,Math.max(0,(Math.abs(swipeOffset)-15)/60));

 const learnableFactIds=new Set(items.map(i=>i.factId).filter((id):id is string=>Boolean(id)));
 const contextFacts=bundle.facts.filter(f=>f.entityId===intro.entityId&&!f.archived&&!learnableFactIds.has(f.id));
 const entityTags=bundle.entityTags.filter(t=>t.entityId===intro.entityId&&!t.archived);
 const tagById=new Map(bundle.tags.map(t=>[t.id,t]));
 const tags=entityTags.map(t=>tagById.get(t.tagId)?.name).filter((name):name is string=>Boolean(name));
 const entityType=bundle.entityTypes?.find(t=>t.id===entity?.type)?.name??entity?.type;

 async function choose(unitId:string,color:Familiarity){
  setSelections(prev=>({...prev,[unitId]:color}));
  if(busy)return;
  if(writeLock.current){pendingChoice.current={unitId,color};return}
  writeLock.current=true;setSaving(true);setSaveError('');
  try{
   await onChoose(unitId,color);
   while(pendingChoice.current){
    const next=pendingChoice.current;
    pendingChoice.current=null;
    await onChoose(next.unitId,next.color);
   }
  }catch{setSaveError('Не удалось сохранить выбор. Попробуйте ещё раз.')}
  finally{writeLock.current=false;setSaving(false)}
 }

 function stepFromPointer(clientX:number,target:HTMLElement):Familiarity{
  const rect=target.getBoundingClientRect();
  const ratio=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));
  if(ratio<0.28)return 'red';
  if(ratio<0.53)return 'orange';
  if(ratio<0.78)return 'yellow';
  return 'green';
 }
 function handleGaugePointerDown(e:React.PointerEvent<HTMLDivElement>,unitId:string,isSuspended:boolean){
  if(disabled||isSuspended)return;
  e.currentTarget.setPointerCapture(e.pointerId);
  const color=stepFromPointer(e.clientX,e.currentTarget);
  activeDrag.current={unitId,color};
  setSelections(prev=>({...prev,[unitId]:color}));
 }
 function handleGaugePointerMove(e:React.PointerEvent<HTMLDivElement>,unitId:string){
  if(!activeDrag.current||activeDrag.current.unitId!==unitId)return;
  const color=stepFromPointer(e.clientX,e.currentTarget);
  if(color!==activeDrag.current.color){
   activeDrag.current.color=color;
   setSelections(prev=>({...prev,[unitId]:color}));
   try{navigator.vibrate?.(5)}catch{}
  }
 }
 function handleGaugePointerUp(e:React.PointerEvent<HTMLDivElement>,unitId:string){
  if(!activeDrag.current||activeDrag.current.unitId!==unitId)return;
  const color=activeDrag.current.color;
  activeDrag.current=null;
  void choose(unitId,color);
 }

 async function chooseAll(color:Familiarity,autoDone=false){
  if(disabled||writeLock.current)return;
  const nextSelections:Record<string,Familiarity>={};
  for(const item of items)nextSelections[item.targetId]=color;
  setSelections(prev=>({...prev,...nextSelections}));
  writeLock.current=true;setSaving(true);setSaveError('');
  try{
   if(onChooseAll){
    await onChooseAll(nextSelections);
   }else{
    for(const item of items)await onChoose(item.targetId,color);
   }
   if(autoDone)onDone();
  }catch{
   setSwipeOffset(0);
   setSaveError('Не удалось сохранить выбор. Попробуйте ещё раз.');
  }finally{
   writeLock.current=false;setSaving(false);
  }
 }

 return <main
  className="learning22-screen"
  aria-labelledby="object-intro-heading"
  aria-busy={disabled}
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={handlePointerUp}
  onPointerCancel={handlePointerCancel}
 >
  <div
   className={`learning22-card-sheet ${swiping?'is-swiping':''}`}
   style={{
    transform:swipeOffset!==0?`translateX(${swipeOffset}px) rotate(${rotation}deg)`:undefined,
    transition:swiping?'none':'transform 260ms cubic-bezier(0.175, 0.885, 0.32, 1.15)',
   }}
  >
   <button type="button" className="learning22-close" onClick={onExit} disabled={disabled} aria-label="Закончить знакомство">✕</button>
   {swipeOffset>15&&<div className="learning22-stamp learning22-stamp-know" style={{opacity:stampOpacity,transform:`rotate(-10deg) scale(${0.85+stampOpacity*0.15})`}} aria-hidden="true">ЗНАЮ</div>}
   {swipeOffset<-15&&<div className="learning22-stamp learning22-stamp-plan" style={{opacity:stampOpacity,transform:`rotate(10deg) scale(${0.85+stampOpacity*0.15})`}} aria-hidden="true">В ПЛАН</div>}
   <div className="learning22-scroll">
    <section className={`learning22-content ${!image?'no-hero':''}`}>
    {image?(
     <div className="learning22-hero-wrap">
      <KnowledgeImage src={image.url} alt={entity?.name??'Изображение объекта'} className="learning22-portrait"/>
     </div>
    ):(
     <div className="learning22-hero-badge" aria-hidden="true">
      <span>{entity?.name?.trim()?.[0]?.toUpperCase()??'★'}</span>
     </div>
    )}

    <div className="learning22-header-block">
     <div className="learning22-badges-strip">
      {entityType&&<span className="learning22-badge">{entityType}</span>}
      {tags.map((tag,idx)=><span key={'t-'+idx} className="learning22-badge">{tag}</span>)}
     </div>
     <h1 id="object-intro-heading">{entity?.name??'Знакомство с объектом'}</h1>
     {entity?.summary&&<p className="learning22-summary">{entity.summary}</p>}
    </div>

    <div className="learning22-section">
     <div className="learning22-properties">
      {items.map(item=>{
       const fact=bundle.facts.find(f=>f.id===item.factId);
       const reverse=item.targetId.endsWith(':reverse');
       const isIdentity=!fact||item.targetId.includes(':visual_identity');
       const identityInfo=isIdentity?getIdentityInfo(entity?.type):undefined;
       const label=isIdentity?identityInfo!.label:reverse?questionPrompt(fact?propertyById.get(fact.key):undefined,item.name,'choice','reverse'):fact?propertyById.get(fact.key)?.name??fact.key:'Портрет';
       const selected=selections[item.targetId]??intro.selections[item.targetId]??'red';
       const isSuspended=selected==='suspended';
       const currentGauge=gaugeLevels.find(g=>g.color===selected)??gaugeLevels[0];
       const val=isIdentity?identityInfo!.text:formatIntroValue(fact,item.answer,bundle);
       return <div className={`learning22-property ${isSuspended?'is-suspended':''}`} key={item.targetId}>
        <div className="learning22-prop-meta">
         {!isIdentity&&<span className="learning22-prop-label">{label}</span>}
         <span className="learning22-value">{val}</span>
        </div>
        <div className="learning22-controls">
         <div
          className={`learning22-gauge learning22-gauge-${selected}`}
          role="group"
          aria-label={`Уровень для ${label}`}
          onPointerDown={e=>handleGaugePointerDown(e,item.targetId,isSuspended)}
          onPointerMove={e=>handleGaugePointerMove(e,item.targetId)}
          onPointerUp={e=>handleGaugePointerUp(e,item.targetId)}
          onPointerCancel={e=>handleGaugePointerUp(e,item.targetId)}
         >
          {gaugeLevels.map(level=>{
           const isActive=!isSuspended&&currentGauge.step>=level.step;
           const isTarget=selected===level.color;
           return <button type="button" key={level.color}
            className={`learning22-gauge-bar learning22-gauge-bar-${level.step} ${isActive?'is-active':''}`}
            aria-label={`${label}: ${level.label}`}
            aria-pressed={isTarget}
            disabled={disabled}
            onClick={e=>{e.stopPropagation();void choose(item.targetId,level.color)}}/>;
          })}
         </div>
         <div className="learning22-ctrl-div" aria-hidden="true"/>
         <button type="button"
          className={`learning22-suspend-btn ${isSuspended?'is-active':''}`}
          aria-label={`${label}: Не учить`}
          aria-pressed={isSuspended}
          disabled={disabled}
          onClick={()=>void choose(item.targetId,isSuspended?'red':'suspended')}>
          ✕
         </button>
        </div>
       </div>;
      })}
     </div>
    </div>

    {!intro.newProperty&&contextFacts.length>0&&(
     <div className="learning22-section learning22-context-block">
      <h2 className="learning22-section-title">Справочная информация</h2>
      <div className="learning22-chips">
       {contextFacts.map(fact=>{
        const p=propertyById.get(fact.key);
        const label=p?.name??fact.key;
        const val=formatIntroValue(fact,textValue(fact,bundle),bundle);
        return <span key={fact.id} className="learning22-chip">
         <span className="learning22-chip-muted">{label}:</span> {val}
        </span>;
       })}
      </div>
     </div>
    )}
   </section>
  </div>
   <footer className="learning22-footer">
    {displayError&&<p className="learning22-error" role="alert">{displayError}</p>}
    <button type="button" className="learning22-action learning22-primary" onClick={onDone} disabled={disabled||!!displayError}>Готово</button>
    <span className="learning22-status" role="status">{saving?'Сохраняем выбор…':''}</span>
   </footer>
  </div>
 </main>;
}

```

### File: res://src/components/study/RecallRevealCard.tsx
```typescript
import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {InteractionDraft} from '../../db/engi-db';
import type {Task} from '../../lib/engi/types';

export function RecallRevealCard({task,cue,draft,paused,busy,reducedMotion,accessible,onPersist,onSubmit}:{task:Task;cue:ReactNode;draft?:InteractionDraft;paused:boolean;busy:boolean;reducedMotion:boolean;accessible:boolean;onPersist:(delta:Partial<InteractionDraft>)=>Promise<void>;onSubmit:(v:boolean)=>void}){
 const elapsedRef=useRef(Math.min(5000,draft?.recallElapsedMs??0)),[elapsed,setElapsed]=useState(elapsedRef.current),[revealed,setRevealed]=useState(!!draft?.revealed),[offset,setOffset]=useState(0),[dragging,setDragging]=useState(false);
 const callbacks=useRef({onPersist,onSubmit});callbacks.current={onPersist,onSubmit};
 const gesture=useRef<{x:number;y:number;time:number;width:number;dx:number;dy:number}|null>(null);
 const lastPersist=useRef(elapsedRef.current);
 const pendingReveal=useRef<Partial<InteractionDraft>|null>(null),requestEarlyReveal=useRef<(()=>void)|null>(null);
 const [revealing,setRevealing]=useState(false);
 useEffect(()=>{
  if(revealed||paused)return;
  let last=Date.now(),visible=document.visibilityState==='visible',timer:ReturnType<typeof setTimeout>|undefined,disposed=false,inFlight=false;
  const accrue=()=>{const now=Date.now();if(visible&&!pendingReveal.current){elapsedRef.current=Math.min(5000,elapsedRef.current+Math.max(0,now-last));setElapsed(elapsedRef.current)}last=now};
  const persist=(force=false)=>{if(force||elapsedRef.current-lastPersist.current>=500){lastPersist.current=elapsedRef.current;void callbacks.current.onPersist({recallElapsedMs:elapsedRef.current}).catch(()=>{})}};
  const reveal=()=>{
   if(disposed||inFlight||!pendingReveal.current)return;inFlight=true;setRevealing(true);
   void callbacks.current.onPersist(pendingReveal.current).then(()=>{if(!disposed)setRevealed(true)}).catch(()=>{if(!disposed)timer=setTimeout(tick,500)}).finally(()=>{inFlight=false});
  };
  const tick=()=>{
   if(disposed)return;accrue();
   if(pendingReveal.current){reveal();return}
   if(elapsedRef.current>=5000){pendingReveal.current={recallElapsedMs:5000,revealed:true};reveal();return}
   persist();timer=setTimeout(tick,Math.min(100,5000-elapsedRef.current));
  };
  requestEarlyReveal.current=()=>{
   if(disposed||pendingReveal.current||document.visibilityState!=='visible')return;
   accrue();pendingReveal.current={revealed:true,earlyReveal:true,recallElapsedMs:elapsedRef.current};clearTimeout(timer);reveal();
  };
  const visibility=()=>{accrue();visible=document.visibilityState==='visible';if(!pendingReveal.current)persist(true)};
  document.addEventListener('visibilitychange',visibility);timer=setTimeout(tick,Math.min(100,5000-elapsedRef.current));
  return()=>{disposed=true;clearTimeout(timer);requestEarlyReveal.current=null;accrue();if(!pendingReveal.current)persist(true);document.removeEventListener('visibilitychange',visibility)};
 },[task.id,paused,revealed]);
 return <div className={`feed-question recall-swipe ${dragging?'is-dragging':''} ${offset>0?'remembering':offset<0?'missing-memory':''}`} style={reducedMotion?undefined:{transform:`translateX(${offset}px) rotate(${offset/35}deg)`}}
  onKeyDown={e=>{if(revealed&&!paused&&!busy&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();callbacks.current.onSubmit(e.key==='ArrowRight')}}}
  onPointerDown={e=>{
   if(!revealed||paused||busy||!e.isPrimary||(e.target as HTMLElement).closest('button,input,textarea')||e.clientX<24||e.clientX>window.innerWidth-24)return;
   gesture.current={x:e.clientX,y:e.clientY,time:Date.now(),width:e.currentTarget.getBoundingClientRect().width,dx:0,dy:0};e.currentTarget.setPointerCapture(e.pointerId);
  }}
  onPointerMove={e=>{const g=gesture.current;if(!g)return;g.dx=e.clientX-g.x;g.dy=e.clientY-g.y;if(Math.abs(g.dx)>8&&Math.abs(g.dx)>Math.abs(g.dy)*1.2){setDragging(true);setOffset(Math.max(-g.width*.8,Math.min(g.width*.8,g.dx)))}}}
  onPointerUp={()=>{const g=gesture.current;gesture.current=null;setDragging(false);setOffset(0);if(!g||!revealed||paused||busy)return;
   const distance=Math.abs(g.dx),horizontal=distance>Math.abs(g.dy)*1.2,velocity=distance/Math.max(20,Date.now()-g.time);
   if(horizontal&&(distance>=g.width*.27||(distance>=g.width*.15&&velocity>=.6)))callbacks.current.onSubmit(g.dx>0);
  }} onPointerCancel={()=>{gesture.current=null;setOffset(0);setDragging(false)}}>
  {cue}<div className="feed-actions"><h2>{task.recipe.prompt??task.recipe.label??'Вспомните ответ'}</h2>
   {!revealed?<div className="recall-thinking"><div className="recall-time-track" role="progressbar" aria-label="Время вспомнить" aria-valuemin={0} aria-valuemax={5} aria-valuenow={Math.ceil((5000-elapsed)/1000)}><span style={{width:`${(5000-elapsed)/50}%`}}/></div><span>{Math.ceil((5000-elapsed)/1000)}</span><button className="button outline" style={{gridColumn:'1 / -1',justifySelf:'center',fontS... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
    <><h3 className="revealed-answer" aria-live="polite">{task.items[0].answer}</h3><div className="recall-hints" aria-hidden="true"><span>← Не вспомнил</span><span>Вспомнил →</span></div>
     <div className={`recall-controls ${reducedMotion||accessible?'show-controls':''}`} aria-label="Оцените воспоминание"><button className="button outline" disabled={busy||paused} onClick={()=>onSubmit(false)}>Не вспомнил</button><button className="button outline" disabled={busy||paused} onClick={()=>onSubmit(true)}>Вспомнил</button></div>
     <span className="swipe-verdict" aria-hidden="true">{offset>20?'Вспомнил ✓':offset< -20?'Не вспомнил':''}</span></>}
  </div>
 </div>;
}




```

### File: res://src/components/study/SortChallengeCard.tsx
```typescript
import {useRef,useState} from 'react';
import type {Task} from '../../lib/engi/types';
export function SortChallengeCard({task,initialOrder,feedback,busy,onPersist,onSubmit,onNext}:{task:Task;initialOrder?:string[];feedback:any;busy:boolean;onPersist:(v:string[])=>void;onSubmit:(v:string[])=>void;onNext:()=>void}){
 const [order,setOrder]=useState(initialOrder??task.items.map(i=>i.entityId));const drag=useRef<string|null>(null),list=useRef<HTMLDivElement>(null);
 const move=(id:string,to:number)=>setOrder(old=>{const next=old.filter(x=>x!==id);next.splice(Math.max(0,Math.min(to,next.length)),0,id);onPersist(next);return next});
 return <><div ref={list} className="feed-sort">{order.map((id,n)=><div className="sort-row" data-item={id} key={id} onPointerDown={e=>{if(busy||feedback||(e.target as HTMLElement).closest('button'))return;drag.current=id;e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current!==id)return;const rows=[...list.current?.querySelectorAll('[data-item]')??[]],to=rows.findInde... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 {!feedback?<button className="button primary" disabled={busy} onClick={()=>onSubmit(order)}>Проверить порядок</button>:<div className="sort-result" role="status"><strong>{feedback.score===1?'Верный порядок ✓':'Посмотрите на последовательность'}</strong>{feedback.score!==1&&<ol>{[...task.items].sort((a,b)=>a.year!-b.year!).map(i=><li key={i.entityId}>{i.name} · {i.year}</li>)}</ol>}{feedback.score... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 </>;
}

```

### File: res://src/components/study/StopStudyCard.tsx
```typescript
import './learning22.css';

export type StopStudyCardProps={
 onMore:()=>void;
 onPractice:()=>void;
 onExit:()=>void;
 busy?:boolean;
 error?:string;
};

export function StopStudyCard({onMore,onPractice,onExit,busy=false,error}:StopStudyCardProps){
 return <main className="learning22-screen learning22-stop" aria-labelledby="stop-study-heading" aria-busy={busy}>
  <div className="learning22-scroll">
   <section className="learning22-content learning22-stop-content">
    <span className="learning22-complete" aria-hidden="true">✓</span>
    <h1 id="stop-study-heading">Готово на сейчас ✓</h1>
    <p className="learning22-summary">Сейчас нет вопросов, которые стоит задавать без нарушения интервалов.</p>
    <p className="learning22-help">Новые знания получат проверку после паузы. Можно спокойно закончить или продолжить, если хочется.</p>
    <div className="learning22-stop-actions">
     <button type="button" className="learning22-action learning22-primary" onClick={onMore} disabled={busy}>Открыть ещё 2 объекта</button>
     <button type="button" className="learning22-action" onClick={onPractice} disabled={busy}>Свободная практика</button>
     <button type="button" className="learning22-action learning22-quiet" onClick={onExit} disabled={busy}>Закончить</button>
    </div>
    {error&&<p className="learning22-error" role="alert">{error}</p>}
    <p className="learning22-status" role="status">{busy?'Подождите немного…':''}</p>
   </section>
  </div>
 </main>;
}

```

### File: res://src/components/study/study-feed.css
```css
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.feed-viewport{overflow-x:hidden}.feed-current{position:relative;min-height:100%}.recall-swipe{-webkit-user-select:none;user-select:none}.feed-option{display:flex;align-items:center;justify-content:space-between;gap:12px}.feed-option:focus-visible,.study-feed .button:focus-visible,.icon-button:focus-visible{outline:3px solid #4368ed;outline-offset:3px}
.feed-option.answer-wrong{animation:option-error 150ms ease-out}.feed-option.answer-correct{animation:option-success 160ms ease-out}.near-twin-options{display:grid;grid-template-columns:1fr 1fr}.near-twin-options .feed-option{min-height:72px}
.recall-swipe{touch-action:pan-y;position:relative;transition:transform 220ms cubic-bezier(.2,.8,.3,1);will-change:transform}.recall-swipe.is-dragging{transition:none}.recall-thinking{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;color:#738090;font-size:13px}.recall-thinking p{grid-column:1/-1;text-align:center;font-size:14px}.recall-time-track{height:3px;background:#e1e6... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
.feed-timeline{padding:12px 0;gap:12px}.feed-timeline output{font-size:36px;font-variant-numeric:tabular-nums}.feed-timeline .timeline-scale{display:block;position:relative}.feed-timeline .timeline-axis{display:flex;font-size:13px;color:#788594}.timeline-fact-marker{position:absolute;top:0;height:48px;border-left:3px solid #1b744f;pointer-events:none}.feed-timeline .timeline-result{display:flex;fl... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
.encoding-moment{position:absolute;left:16px;right:16px;bottom:12px;background:#fff;border:1px solid #cfdcf1;border-radius:20px;padding:20px;box-shadow:0 8px 30px #25375120;display:flex;flex-direction:column;gap:7px;animation:answer-reveal 220ms ease-out;z-index:4}.encoding-moment strong{font-size:20px}.encoding-moment span{color:#184be7;font-size:16px}.encoding-moment p{font-size:15px;line-height... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
.stability-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}.stability-strip>div{padding:20px;border:1px solid #dfe7ee;background:#fff;border-radius:16px}.stability-strip strong{display:block;font-size:30px;color:#184be7;animation:answer-reveal 200ms ease-out;font-variant-numeric:tabular-nums}.stability-strip span{font-size:14px;color:#70818f}.return-hook{display:flex;... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
@keyframes option-error{0%,100%{transform:translateX(0)}30%{transform:translateX(-3px)}65%{transform:translateX(3px)}}
@keyframes option-success{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
@keyframes answer-reveal{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes challenge-break{0%,85%{opacity:1}100%{opacity:0}}
@keyframes milestone-toast{0%,100%{opacity:0}12%,88%{opacity:1}}
@media(pointer:coarse){.recall-controls:not(.show-controls):not(:focus-within){position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0)}}
@media(max-width:760px){.stability-strip{gap:8px}.stability-strip>div{padding:16px 12px}.stability-strip strong{font-size:26px}.stability-strip span{font-size:12px}.conflict-comparison{grid-template-columns:1fr}.feed-option{min-height:58px}.recall-hints{font-size:13px}.feed-header span{font-size:12px}.feed-cue{max-height:30dvh}.return-hook{padding:18px}.feed-actions h2{overflow-wrap:anywhere}}
@media(prefers-reduced-motion:reduce){.recall-swipe,.is-dragging{transform:none!important;transition:none!important}.feed-option.answer-wrong,.feed-option.answer-correct,.revealed-answer,.encoding-moment,.repair-closure,.challenge-intro,.memory-milestone,.stability-strip strong{animation:none}.recall-time-track span{transition:none}.memory-milestone{display:block!important}.state-exiting .feed-cur... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]


```

### File: res://src/components/study/StudyFeed.tsx
```typescript
import {useEffect,useRef,useState} from 'react';
import type {SessionRow,InteractionDraft} from '../../db/engi-db';
import {trainerService} from '../../services/trainer-service';
import {isDiscrete,discreteAnswer} from '../../lib/engi/questions/timeline';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import {mediaStore} from '../../media/media-store';
import {ChoiceCard} from './ChoiceCard';
import {RecallRevealCard} from './RecallRevealCard';
import {TimelineCard} from './TimelineCard';
import {SortChallengeCard} from './SortChallengeCard';
import {playSuccess,useReducedMotion,useStudyPreferences} from './useStudyPreferences';
import './study-feed.css';
import {ObjectIntroCard} from './ObjectIntroCard';
import {StopStudyCard} from './StopStudyCard';
import {getBundle} from '../../db/repositories';
import {db} from '../../db/engi-db';
import type {Bundle,Familiarity} from '../../lib/engi/types';

const reasonLabel:Record<string,string>={due:'Пора повторить',new:'Новое знание',weak:'Закрепляем',confusion:'Различаем похожее',retry:'Уточняем связь',challenge:'Проверяем связи',calibration:'Проверяем воспоминание',practice:'Свободная практика'};
const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));

export function StudyFeed({initial,onExit}:{initial:SessionRow;onExit:()=>void}){
 const [introBundle,setIntroBundle]=useState<Bundle|null>(null);
 const [session,setSession]=useState(initial),[feedback,setFeedback]=useState<any>(null),[draft,setDraft]=useState<InteractionDraft|undefined>(initial.interaction);
 const [state,setState]=useState<'loading'|'ready'|'saving'|'feedback'|'exiting'>('loading'),[error,setError]=useState(''),[imageFailed,setImageFailed]=useState(false),[mediaReady,setMediaReady]=useState(false);
 const [details,setDetails]=useState(false),[reportText,setReportText]=useState(''),[notice,setNotice]=useState(''),[challengeIntro,setChallengeIntro]=useState(false);
 const {preferences}=useStudyPreferences(),reduced=useReducedMotion();
 const task=session.tasks[session.currentPosition],sessionRef=useRef(session),lock=useRef(false),advancing=useRef(false),alive=useRef(true),started=useRef(Date.now());
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),introTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),noticeTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),touch=useRef<number|null>(null);
 const writes=useRef<Promise<unknown>>(Promise.resolve());sessionRef.current=session;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current);clearTimeout(introTimer.current);clearTimeout(noticeTimer.current)}},[]);

 function showNotice(text:string){setNotice(text);clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(''),1600)}
 function scheduleNext(f:any){
  clearTimeout(timer.current);
  const auto=isDiscrete(task)||task.recipe.format==='recall_reveal'||f.score===1;
  if(!auto)return;
  const hold=f.encoding?1600:f.repairResolved?600:f.score===1?320:480;
  timer.current=setTimeout(()=>{void advance()},Math.max(0,hold-(reduced?0:180)));
 }
 useEffect(()=>{
  let valid=true;clearTimeout(timer.current);lock.current=false;advancing.current=false;started.current=Date.now();setState('loading');setFeedback(null);setError('');setImageFailed(false);setDetails(false);
  setDraft(session.interaction?.taskId===task?.id?session.interaction:undefined);
  setMediaReady(task?.recipe.cue!=='image'||!task.items[0]?.image);setChallengeIntro(!!task?.recipe.diagnostic);
  clearTimeout(introTimer.current);if(task?.recipe.diagnostic)introTimer.current=setTimeout(()=>setChallengeIntro(false),500);
  if(!task)setState('ready');if(session.intro)void getBundle(db).then(setIntroBundle).catch(e=>setError(e.message));
  if(task)trainerService.getFeedback(task.id).then(f=>{if(!valid)return;if(f){lock.current=true;setState('feedback');setFeedback(f);scheduleNext(f)}else setState('ready')}).catch(e=>{if(valid){setError(e.message);setState('ready')}});
  void trainerService.preloadMedia(session.id).then(urls=>mediaStore.prewarm(urls)).catch(()=>{});
  return()=>{valid=false;clearTimeout(timer.current);clearTimeout(introTimer.current)};
 },[task?.id,session.intro?.unitIds.join('|'),session.exhausted]);

 function persist(delta:Partial<InteractionDraft>):Promise<void>{
  const id=task.id,sid=session.id;
  const write=writes.current.catch(()=>{}).then(()=>trainerService.saveInteraction(sid,id,delta));writes.current=write;
  return write.then(next=>{if(alive.current&&sessionRef.current.tasks[sessionRef.current.currentPosition]?.id===id){setDraft(next);if(delta.revealed)setError('')}}).catch(e=>{if(alive.current&&sessionRef.current.tasks[sessionRef.current.currentPosition]?.id===id)setError(e.message);throw e});
 }
 async function advance(skip=false){
  if(advancing.current)return;advancing.current=true;clearTimeout(timer.current);setState('exiting');
  const current=sessionRef.current,currentTask=current.tasks[current.currentPosition];
  try{await writes.current.catch(()=>{});if(!reduced)await delay(180);const next=await trainerService.advanceFeed(current.id,skip,currentTask?.id);if(!alive.current)return;setSession(next);
   if(next.exhausted||next.intro)setState('ready');
  }catch(e){if(alive.current){setError((e as Error).message);setState(feedback?'feedback':'ready')}}finally{advancing.current=false}
 }
 async function submit(value:any){
  if(lock.current||!task||imageFailed||state!=='ready'||details||challengeIntro)return;
  lock.current=true;setState('saving');setError('');
  const previous=draft;
  if(isDiscrete(task)&&value!==discreteAnswer(task))setDraft({taskId:task.id,attemptSequence:[...new Set([...(draft?.attemptSequence??[]),value])]});
  try{await writes.current;const result=await trainerService.answer({sessionId:session.id,taskId:task.id,answer:value,latencyMs:Date.now()-started.current});if(!alive.current)return;
   if(result.pending){setDraft(result.interaction);setState('ready');lock.current=false;return}
   setFeedback(result.feedback);setState('feedback');
   if(result.feedback.score===1){playSuccess(preferences.sound);try{navigator.vibrate?.(10)}catch{}}
   if(result.milestone)showNotice(result.milestone);scheduleNext(result.feedback);
  }catch(e){if(alive.current){setDraft(previous);setError((e as Error).message);setState('ready');lock.current=false}}
 }
 async function exit(){if(state==='saving'||state==='exiting')return;clearTimeout(timer.current);setState('saving');try{await writes.current.catch(()=>{});onExit()}catch(e){setError((e as Error).message);setState('ready')}}

 const busy=state!=='ready'||challengeIntro||details;
 const cue=<div className="feed-cue">{task?.recipe.format==='missing'?<ol className="feed-sequence">{task.sequence?.map((i,n)=><li key={n}>{i?.name??'?'}</li>)}</ol>:task?.recipe.format==='sort'?<span className="challenge-mark" aria-hidden="true">↕</span>:task?.recipe.cue==='image'&&task.items[0].image?<KnowledgeImage src={task.items[0].image} alt="Изображение для вопроса" onReady={()=>setMediaRea... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 async function introChoose(id:string,color:Familiarity){setState('saving');try{setSession(await trainerService.saveIntroSelection(session.id,id,color))}finally{setState('ready')}}
 async function introBatch(selections:Record<string,Familiarity>){setState('saving');try{setSession(await trainerService.saveIntroSelections(session.id,selections))}finally{setState('ready')}}
 async function introDone(){setState('saving');setError('');try{setSession(await trainerService.completeIntro(session.id))}catch(e){setError((e as Error).message)}finally{setState('ready')}}
 async function more(practice=false){setState('saving');setError('');try{setSession(await trainerService.openMore(session.id,practice))}catch(e){setError((e as Error).message)}finally{setState('ready')}}
 if(session.intro)return introBundle?<ObjectIntroCard key={session.intro.entityId} intro={session.intro} bundle={introBundle} onChoose={introChoose} onChooseAll={introBatch} onDone={()=>void introDone()} onExit={()=>void exit()} busy={state==='saving'} error={error}/>:<main className="study-feed"><p>Готовим знакомство…</p></main>;
 if(session.exhausted)return <StopStudyCard onMore={()=>void more()} onPractice={()=>void more(true)} onExit={()=>void exit()} busy={state==='saving'} error={error}/>;
 const prompt=task?.recipe.prompt??task?.recipe.label??'Вспомните ответ';
 return <main className={`study-feed state-${state}`}><header className="feed-header"><button className="icon-button" aria-label="Выйти из практики" disabled={state==='saving'||state==='exiting'} onClick={()=>void exit()}>×</button><span>{reasonLabel[task?.reason]??'Практика'}</span><span>{session.completedCount??0} карточек</span><button className="icon-button" aria-label="Подробнее о вопросе" di... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 <div className="feed-viewport"><div className="feed-current" key={task?.id} data-task-id={task?.id}
  onPointerDown={e=>{if(!(e.target as HTMLElement).closest('button,input,.recall-swipe'))touch.current=e.clientY}}
  onPointerUp={e=>{if(touch.current!==null&&touch.current-e.clientY>65&&feedback&&task.recipe.diagnostic&&!['saving','exiting'].includes(state))void advance();touch.current=null}}>
  {task&&(task.recipe.format==='recall_reveal'?<RecallRevealCard task={task} cue={cue} draft={draft} paused={details||!mediaReady||imageFailed||state==='loading'} busy={state!=='ready'} reducedMotion={reduced} accessible={preferences.accessibleRecall} onPersist={persist} onSubmit={v=>void submit(v)}/>:
   <div className="feed-question">{cue}<div className="feed-actions"><h2>{prompt}</h2>{isDiscrete(task)?<ChoiceCard task={task} attempts={draft?.attemptSequence??[]} feedback={feedback} busy={busy} onChoose={v=>void submit(v)}/>:task.recipe.format==='timeline'?<TimelineCard task={task} initialValue={draft?.timelineValue} feedback={feedback} busy={state==='saving'||state==='exiting'||state==='loadi... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
  {feedback?.encoding&&<div className="encoding-moment" role="status"><strong>{task.items[0].name}</strong><span>{task.recipe.label} → {task.items[0].answer}</span>{task.items[0].summary&&<p>{task.items[0].summary.split(/(?<=[.!?])\s+/).slice(0,2).join(' ')}</p>}<small>Вернёмся к этому чуть позже</small></div>}
  {feedback?.repairResolved&&<div className="repair-closure" role="status">Разобрано ✓</div>}
  <span className="sr-only" role="status" aria-live="polite">{feedback?(feedback.score===1?'Верно':'Связь уточнена'):draft?.attemptSequence.length?'Этот вариант не подходит. Попробуйте другой.':''}</span>
  {challengeIntro&&<div className="challenge-intro" aria-live="polite"><span>Проверим связи</span><strong>{task.recipe.format==='sort'?'Порядок':task.recipe.format==='timeline'?'Хронология':'Последовательность'}</strong></div>}
  {error&&<p className="feed-error" role="alert">{error}</p>}
  {imageFailed&&!feedback&&<div className="feed-error"><p>Изображение недоступно. Ответ не засчитан.</p><button className="button outline" onClick={()=>void advance(true)}>Пропустить</button></div>}
 </div></div>
 {notice&&<div className="feed-nudge memory-milestone" role="status">{notice}</div>}
 <footer className="feed-footer">{task?.recipe.diagnostic?'Проверяем связи · точную дату не оцениваем':feedback?.encoding?'Новое знание. Следующая проверка будет позже.':task?.reason==='retry'?'Различаем то, что путалось':'Маленькая практика, долгая память.'}</footer>
 {details&&<div className="overlay"><section className="editor-panel" role="dialog" aria-modal="true" aria-label="Подробности вопроса"><div className="section-heading"><h2>О вопросе</h2><button className="icon-button" aria-label="Закрыть подробности" onClick={()=>{setDetails(false);if(feedback)scheduleNext(feedback)}}>×</button></div><p>{task.items[0].name}</p>{feedback&&task.items[0].summary&&<p>... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 </main>;
}

```

### File: res://src/components/study/TimelineCard.tsx
```typescript
import {useState} from 'react';
import type {Task} from '../../lib/engi/types';
export function TimelineCard({task,initialValue,feedback,busy,onPersist,onSubmit,onNext}:{task:Task;initialValue?:number;feedback:any;busy:boolean;onPersist:(value:number)=>void;onSubmit:(value:Record<string,number>)=>void;onNext:()=>void}){
 const i=task.items[0],scale=task.timeline??{min:1,max:2100,initial:1050},[value,setValue]=useState(initialValue??scale.initial);
 const pct=(year:number)=>(year-scale.min)/(scale.max-scale.min)*100;
 return <div className="feed-timeline"><output aria-live="off">{value}</output><div className="timeline-scale">
  <input type="range" aria-label="Выберите год" min={scale.min} max={scale.max} step={1} value={value} disabled={busy||!!feedback} onChange={e=>{const v=Number(e.target.value);setValue(v);onPersist(v)}}/>
  {feedback&&<span className="timeline-fact-marker" style={{left:`${pct(i.year!)}%`}} aria-hidden="true"/>}
 </div><div className="timeline-axis"><span>{scale.min}</span><span>{scale.max}</span></div>
 {!feedback?<><small>Приблизительный год. Можно поправить перед подтверждением.</small><button className="button primary" disabled={busy} onClick={()=>onSubmit({[i.entityId]:value})}>Подтвердить</button></>:
  <div className="timeline-result" role="status"><p><span>Ваш ответ: <strong>{value}</strong></span><span>Факт: <strong>{i.year}</strong></span></p><small>{feedback.score===1?'Близко ✓':'Посмотрите, где находится год на шкале.'}</small><button className="button outline" disabled={busy} onClick={onNext}>Далее →</button></div>}
 </div>;
}

```

### File: res://src/components/study/useStudyPreferences.ts
```typescript
import {useEffect,useState} from 'react';
import {db} from '../../db/engi-db';
export type StudyPreferences={sound:boolean;accessibleRecall:boolean};
export const DEFAULT_PREFERENCES:StudyPreferences={sound:false,accessibleRecall:false};
export function useStudyPreferences(){
 const [preferences,setPreferences]=useState(DEFAULT_PREFERENCES);
 useEffect(()=>{let alive=true;db.appMeta.get('studyPreferences').then(r=>{if(alive)setPreferences({...DEFAULT_PREFERENCES,...r?.value})});return()=>{alive=false}},[]);
 const save=async(next:StudyPreferences)=>{await db.appMeta.put({key:'studyPreferences',value:next});setPreferences(next)};
 return {preferences,save};
}
let audioContext:AudioContext|undefined;
/** Optional quiet success cue, initiated only by an explicit user action. */
export function playSuccess(enabled:boolean){
 if(!enabled)return;
 try{const Constructor=window.AudioContext??(window as any).webkitAudioContext;if(!Constructor)return;audioContext??=new Constructor();const c=audioContext!;void c.resume().catch(()=>{});
  const oscillator=c.createOscillator(),gain=c.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(660,c.currentTime);gain.gain.setValueAtTime(.025,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+.08);oscillator.connect(gain);gain.connect(c.destination);oscillator.start();oscillator.stop(c.currentTime+.08);
 }catch{/* Sound is progressive enhancement. */}
}
export function useReducedMotion(){const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change)},[]);return reduced}

```

### File: res://src/components/ui/button.tsx
```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

```

### File: res://src/components/ui/dialog.tsx
```typescript
"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

```

### File: res://src/components/ui/progress.tsx
```typescript
"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

```

### File: res://src/components/ui/select.tsx
```typescript
"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:las... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
        className
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

```

### File: res://src/components/ui/tabs.tsx
```typescript
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:rin... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/t... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }

```

### File: res://src/db/engi-db.ts
```typescript
import {mergeLegacyStates,type TargetMapping} from '../lib/engi/learning/knowledge-unit';
import Dexie,{type Table} from 'dexie';
import type {Bundle,Memory,Task,PropertyDefinition,EntityTypeDefinition} from '../lib/engi/types';
import {storesV1,storesV2,storesV3} from './migrations';
import {BUILTIN_PROPERTIES,BUILTIN_TYPES} from '../lib/engi/knowledge/properties';
export type ReviewEventRow={id:string;timestamp:string;recipe:string;level:string;payload:any;targetIds:string[]};
export type LearningRow={id:string;payload:Memory;dueAt:string;stability:number;covered:number};
export type PackRow={packId:string;packVersion:number;name:string;createdAt:string;files:{path:string;bytes:number;sha256:string;mime:string}[];entityIds:string[];factIds:string[];mediaIds:string[];tagIds:string[];entityTags:Bundle['entityTags'];installedAt:string};
export type LocalTask=Task&{sequence?:({name:string;entityId:string}|null)[];retryOf?:string};
export type InteractionDraft={taskId:string;attemptSequence:string[];recallElapsedMs?:number;revealed?:boolean;timelineValue?:number;sortOrder?:string[];earlyReveal?:boolean;firstAttemptLatencyMs?:number};
export type SessionRow={id:string;tasks:LocalTask[];currentPosition:number;results:number[];mode:string;createdAt:string;updatedAt:string;status:'active'|'completed';timeLeft:number;remainingMs?:number;feed?:boolean;tag?:string;format?:string;completedCount?:number;cooldown?:Task[];repairQueue?:Task[];interaction?:InteractionDraft;intro?:{entityId:string;unitIds:string[];selections:Record<string,i... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export class EngiDB extends Dexie {
 entities!:Table<Bundle['entities'][number],string>;facts!:Table<Bundle['facts'][number],string>;tags!:Table<Bundle['tags'][number],string>;entityTags!:Table<Bundle['entityTags'][number],[string,string]>;media!:Table<Bundle['media'][number]&{hash?:string},string>;
 learningState!:Table<LearningRow,string>;reviewEvents!:Table<ReviewEventRow,string>;installedPacks!:Table<PackRow,string>;activeSessions!:Table<SessionRow,string>;appMeta!:Table<{key:string;value:any},string>;
 targetMappings!:Table<TargetMapping,string>;propertyDefinitions!:Table<PropertyDefinition,string>;entityTypes!:Table<EntityTypeDefinition,string>;
 constructor(name='engi'){super(name);this.version(1).stores(storesV1);this.version(2).stores(storesV2).upgrade(async tx=>{await tx.table('propertyDefinitions').bulkPut(BUILTIN_PROPERTIES);await tx.table('entityTypes').bulkPut(BUILTIN_TYPES);const packs=await tx.table('installedPacks').toArray();for(const [table,key] of [['entities','entityIds'],['facts','factIds'],['media','mediaIds'],['tags','ta... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}
export const db=new EngiDB();



```

### File: res://src/db/learning-migration.ts
```typescript
import type {EngiDB} from './engi-db';
import {mergeLegacyStates} from '../lib/engi/learning/knowledge-unit';
import {learningRow,getBundle,contentTables} from './repositories';
export async function reconcileKnowledgeUnits(d:EngiDB){
 await d.transaction('rw',[...contentTables(d),d.learningState,d.targetMappings],async()=>{
  const rows=await d.learningState.toArray();if(!rows.some(r=>!r.payload.legacyOf&&!r.id.startsWith('ku:')))return;
  const merged=mergeLegacyStates(rows.map(r=>r.payload),await getBundle(d));
  for(const m of merged.states){const old=rows.find(r=>r.id===m.id);if(!old||JSON.stringify(old.payload)!==JSON.stringify(m))await d.learningState.put(learningRow(m))}
  if(merged.mappings.length)await d.targetMappings.bulkPut(merged.mappings);
 });
}

```

### File: res://src/db/migrations.ts
```typescript
export const APP_DB_VERSION=3;
export const storesV1={entities:'id,type',facts:'id,entityId,[entityId+key]',tags:'id',entityTags:'[entityId+tagId],entityId,tagId',media:'id,entityId,hash',learningState:'id,dueAt,stability,covered',reviewEvents:'id,timestamp,recipe,*targetIds',installedPacks:'packId',activeSessions:'id,updatedAt,status',appMeta:'key'};
export const storesV2={...storesV1,facts:'id,entityId,key,valueEntityId,[entityId+key]',propertyDefinitions:'id,valueKind',entityTypes:'id'};

export const storesV3={...storesV2,targetMappings:'legacyId,unitId'};


```

### File: res://src/db/repositories.ts
```typescript
import {reconcileKnowledgeUnits} from './learning-migration';
import type {EngiDB} from './engi-db';
import type {Bundle,Memory,Snapshot} from '../lib/engi/types';
import {BUILTIN_PROPERTIES,BUILTIN_TYPES} from '../lib/engi/knowledge/properties';
export const emptyBundle=():Bundle=>({entities:[],facts:[],tags:[],entityTags:[],media:[],properties:[],entityTypes:[],missing:[],unresolved:[]});
export const contentTables=(d:EngiDB)=>[d.entities,d.facts,d.tags,d.entityTags,d.media,d.installedPacks,d.propertyDefinitions,d.entityTypes];
export async function getBundle(d:EngiDB):Promise<Bundle>{const [entities,facts,tags,entityTags,media,properties,entityTypes]=await Promise.all([d.entities.toArray(),d.facts.toArray(),d.tags.toArray(),d.entityTags.toArray(),d.media.toArray(),d.propertyDefinitions.toArray(),d.entityTypes.toArray()]);return {entities,facts,tags,entityTags,media,properties:[...new Map([...BUILTIN_PROPERTIES,...proper... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export async function getSnapshot(d:EngiDB):Promise<Snapshot>{await reconcileKnowledgeUnits(d);const [bundle,rows,events,daily,newLearning]=await Promise.all([getBundle(d),d.learningState.toArray(),d.reviewEvents.orderBy('timestamp').reverse().limit(1000).toArray(),d.appMeta.get('dailyLearning'),d.appMeta.get('newLearning')]);return {bundle,memories:rows.filter(r=>!r.payload.legacyOf).map(r=>r.pay... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export async function putBundle(d:EngiDB,b:Bundle){await d.propertyDefinitions.bulkPut(b.properties??[]);await d.entityTypes.bulkPut(b.entityTypes??[]);await d.entities.bulkPut(b.entities);await d.facts.bulkPut(b.facts);await d.tags.bulkPut(b.tags);await d.entityTags.bulkPut(b.entityTags);await d.media.bulkPut(b.media.map(m=>({...m,hash:m.url.startsWith('engi-media://')?m.url.slice(13):undefined})... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export function learningRow(m:Memory){return {id:m.id,payload:m,dueAt:new Date(m.card.due).toISOString(),stability:m.card.stability,covered:Number(!!m.firstSuccessAt)}}
export async function historyPage(d:EngiDB,offset=0,limit=50){return d.reviewEvents.orderBy('timestamp').reverse().offset(offset).limit(Math.min(limit,1000)).toArray()}


```

### File: res://src/lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

```

### File: res://src/lib/engi/engine.ts
```typescript
import {BUILTIN_PROPERTIES} from './knowledge/properties';
export {recipes,eligible,canonicalTargets} from './questions/recipe-factory';
import {fsrs,createEmptyCard,Rating,type Card} from 'ts-fsrs';
import type {Memory,Task,Item,Format} from './types';
export const scheduler=fsrs({request_retention:0.9,enable_fuzz:false});
export const FACT_TYPES=Object.fromEntries(BUILTIN_PROPERTIES.map(p=>[p.id,{valueKind:p.valueKind,subject:p.subjectTypes??[],target:p.targetTypes}]));
export function shuffle<T>(a:T[]):T[]{const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
export function normalize(s:string){return s.toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]/gu,'')}
export function hydrate(m:Memory):Card{return {...m.card,due:new Date(m.card.due),last_review:m.card.last_review?new Date(m.card.last_review):undefined}}
export function retention(m:Memory){return m.firstSuccessAt?scheduler.get_retrievability(hydrate(m),new Date(),false):0}
export function preflight(t:Task){
 const a=t.items;if(!a.length)return false;
 if(t.recipe.format==='match'&&!t.recipe.feed&&(a.length<3||new Set(a.map(i=>i.answerId)).size!==a.length))return false;
 if(['sort','timeline','missing'].includes(t.recipe.format)&&!(t.recipe.feed&&t.recipe.format==='timeline'&&a.length===1)&&(a.length<3||new Set(a.map(i=>i.year)).size!==a.length))return false;
 if(['sort','timeline','missing'].includes(t.recipe.format)){if(a.some(i=>!Number.isFinite(i.year)))return false;const sorted=[...a].sort((x,y)=>x.year!-y.year!);for(let i=1;i<sorted.length;i++)if(sorted[i-1].year!>=sorted[i].year!)return false}
 if(t.recipe.format==='categorize'&&(t.recipe.feed?t.options.length<2:new Set(a.map(i=>i.answerId)).size<2))return false;
 if(t.recipe.format==='choice'&&(t.options.length<(t.discrimination?2:3)||t.options.filter(o=>o.id===a[0].answerId).length!==1))return false;
 if(new Set(t.options.map(o=>normalize(o.name))).size!==t.options.length||new Set(t.options.map(o=>o.id)).size!==t.options.length)return false;
 if(['choice','match','categorize'].includes(t.recipe.format)&&t.items.some(i=>t.options.some(o=>o.id!==i.answerId&&[i.answer,...i.aliases].some(a=>normalize(a)===normalize(o.name)))))return false;
 return true;
}
export function assess(t:Task,answer:any){
 const fmt=t.recipe.format,evidence:{item:Item;correct:boolean;chosen?:string;level:string}[]=[];
 if(fmt==='timeline'){
  if(!answer||typeof answer!=='object')throw Error('Укажите годы');
  const scores=t.items.map(i=>Math.abs(Number(answer[i.entityId])-i.year!)<=15?1:0);
  return {score:scores.reduce<number>((a,b)=>a+b,0)/scores.length,evidence:[],expected:t.items.map(i=>({id:i.entityId,answer:i.answer,year:i.year}))};
 }
 if(['sort','missing'].includes(fmt)){
  const expected=[...t.items].sort((a,b)=>a.year!-b.year!).map(i=>i.entityId);
  if(fmt==='missing')return {score:answer===expected[1]?1:0,evidence:[],expected};
  if(!Array.isArray(answer)||new Set(answer).size!==t.items.length||!expected.every(x=>answer.includes(x)))throw Error('Заполните все позиции');
  let correct=0,total=0;for(let i=0;i<answer.length;i++)for(let j=i+1;j<answer.length;j++){total++;if(expected.indexOf(answer[i])<expected.indexOf(answer[j]))correct++}
  return {score:correct/total,evidence:[],expected};
 }
 for(const item of t.items){const val=['match','categorize'].includes(fmt)?(typeof answer==='object'?answer?.[item.entityId]:answer):answer;const ok=fmt==='recall_reveal'?val===true:val===item.answerId;evidence.push({item,correct:ok,chosen:String(val??''),level:t.recipe.evidence?.level??'direct'})}
 return {score:evidence.filter(e=>e.correct).length/evidence.length,evidence,expected:t.items.map(i=>({id:i.entityId,answer:i.answer,year:i.year}))};
}
export function updateMemory(old:Memory|undefined,item:Item,correct:boolean,chosen:string|undefined,confidence='medium',fmt:Format='choice'){
 const now=new Date(),m=old??{id:item.targetId,card:createEmptyCard(now),attempts:0,correct:0,confusions:{}};
 if(!old&&!correct)return undefined;
 const next=scheduler.next(old?hydrate(old):createEmptyCard(now),now,correct?Rating.Good:Rating.Again).card;
 return {...m,card:next,attempts:m.attempts+1,correct:m.correct+Number(correct),firstSuccessAt:m.firstSuccessAt??(correct?now.toISOString():undefined),confusions:!correct&&chosen?{...m.confusions,[chosen]:(m.confusions[chosen]||0)+1}:{...m.confusions}};
}

```

### File: res://src/lib/engi/indexes.ts
```typescript
import type {Bundle,Entity,Fact,Media} from './types';
import {properties} from './knowledge/properties';
const contexts=new WeakMap<Bundle,ReturnType<typeof buildIndexes>>();
export function buildIndexes(b:Bundle){
 const entityById=new Map(b.entities.filter(e=>!e.archived).map(e=>[e.id,e]));const factsByEntity=new Map<string,Fact[]>(),factsByProperty=new Map<string,Fact[]>(),incomingFactsByTarget=new Map<string,Fact[]>();const factsByEntityAndKey=new Map<string,Map<string,Fact[]>>();const mediaByEntity=new Map<string,Media[]>();const tagsByEntity=new Map<string,Set<string>>();const entitiesByTag=new Map<str... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 const append=<T>(map:Map<string,T[]>,key:string,value:T)=>map.set(key,[...map.get(key)??[],value]);
 for(const e of entityById.values())append(entitiesByType,e.type,e);
 for(const f of b.facts.filter(f=>!f.archived)){append(factsByEntity,f.entityId,f);append(factsByProperty,f.key,f);if(f.valueEntityId)append(incomingFactsByTarget,f.valueEntityId,f);const keys=factsByEntityAndKey.get(f.entityId)??new Map<string,Fact[]>();append(keys,f.key,f);factsByEntityAndKey.set(f.entityId,keys)}
 for(const m of b.media.filter(m=>!m.archived)){append(mediaByEntity,m.entityId,m)}for(const list of mediaByEntity.values())list.sort((a,c)=>Number(!!c.primary)-Number(!!a.primary));
 const tagById=new Map(b.tags.filter(t=>!t.archived).map(t=>[t.id,t]));for(const t of b.entityTags.filter(t=>!t.archived)){const tags=tagsByEntity.get(t.entityId)??new Set<string>();let id:string|undefined=t.tagId;const seen=new Set<string>();while(id&&!seen.has(id)){seen.add(id);tags.add(id);id=tagById.get(id)?.parentId}tagsByEntity.set(t.entityId,tags)}
 for(const [id,tags] of tagsByEntity){const e=entityById.get(id);if(e)for(const tag of tags)append(entitiesByTag,tag,e)}
 const searchByEntity=new Map<string,string>();for(const e of entityById.values())searchByEntity.set(e.id,[e.name,...e.aliases,e.type,...[...tagsByEntity.get(e.id)??[]].map(id=>tagById.get(id)?.name??''),...(factsByEntity.get(e.id)??[]).map(f=>entityById.get(f.valueEntityId??'')?.name??f.valueText??f.valueNumber??'')].join(' ').toLowerCase().replace(/ё/g,'е'));
 return {entityById,factsByEntity,factsByEntityAndKey,factsByProperty,incomingFactsByTarget,mediaByEntity,tagsByEntity,entitiesByTag,entitiesByType,propertyById:new Map(properties(b).map(p=>[p.id,p])),searchByEntity};
}
export function indexes(b:Bundle){let context=contexts.get(b);if(!context){context=buildIndexes(b);contexts.set(b,context)}return context}

```

### File: res://src/lib/engi/types.ts
```typescript
export type Origin={origin?:'pack'|'user';originPackId?:string;originPackVersion?:number;userModified?:boolean;archived?:boolean;upstreamConflict?:boolean;upstreamValue?:unknown;upstreamAcknowledged?:string};
export type ValueKind='entity'|'text'|'number'|'date'|'boolean';
export type Entity=Origin&{id:string;type:string;name:string;aliases:string[];externalIds:Record<string,string>;summary?:string};
export type EntityTypeDefinition=Origin&{id:string;name:string;pluralName?:string;icon?:string;builtIn?:boolean};
export type PropertyDefinition=Origin&{id:string;name:string;shortName?:string;description?:string;valueKind:ValueKind;subjectTypes?:string[];targetTypes?:string[];cardinality:'one'|'many';learnable:boolean;promptTemplates?:{forward?:string;reverse?:string;timeline?:string;sort?:string};inverse?:{enabled:boolean;name?:string};learning?:{forward?:boolean;reverse?:boolean;choice?:'auto'|'on'|'off';r... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export type Fact=Origin&{id:string;entityId:string;key:string;valueKind:ValueKind;valueEntityId?:string;valueText?:string;valueNumber?:number;valueBoolean?:boolean;dateStart?:string;dateEnd?:string;datePrecision?:'year'|'day'|'month'|'circa'|'range';source:{kind?:'url'|'pack'|'manual';url?:string;name:string;locator?:string;family?:string};verification:'user_confirmed'|'direct'|'verified'|'unverif... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export type Media=Origin&{id:string;entityId:string;role:string;url:string;sourceUrl?:string;license:string;primary?:boolean;learningExemplar?:boolean};
export type Tag=Origin&{id:string;name:string;parentId?:string};
export type EntityTag=Origin&{entityId:string;tagId:string};
export type Bundle={entities:Entity[];facts:Fact[];media:Media[];tags:Tag[];entityTags:EntityTag[];properties?:PropertyDefinition[];entityTypes?:EntityTypeDefinition[];missing:unknown[];unresolved:unknown[]};
export type Format='choice'|'recall_reveal'|'match'|'sort'|'categorize'|'timeline'|'missing';
export type Recipe={id:string;format:Format;tag?:string;subjectType?:string;cue:'image'|'name';answerKey:string;memoryKey:string;diagnostic:boolean;direction?:'forward'|'reverse';label?:string;prompt?:string;mediaRoles?:string[];evidence?:{level:'direct'|'partial'|'diagnostic';fsrsEnabled:boolean;gradeCap:'good';selfReport?:boolean};countsTowardMastery?:boolean;feed?:{presentation:'atomic'|'rapid_... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export type Item={entityId:string;name:string;image?:string;mediaId?:string;targetId:string;answer:string;aliases:string[];answerId:string;year?:number;sourceUrl:string;factId?:string;answerEntityId?:string;summary?:string};
export type Task={id:string;recipe:Recipe;items:Item[];options:{id:string;name:string}[];reason:string;retryOf?:string;sequence?:({name:string;entityId:string}|null)[];retryAfter?:number;pretest?:boolean;timeline?:{min:number;max:number;initial:number};discrimination?:boolean;repairChoices?:string[];practice?:boolean;difficultyStage?:number};
export type Memory=LearningMetadata&{id:string;card:any;attempts:number;correct:number;firstSuccessAt?:string;confusions:Record<string,number>;selfReport?:{remembered:number;missed:number;objectiveSuccesses:number;objectiveFailures:number}};
export type Familiarity='red'|'orange'|'yellow'|'green'|'suspended';
export type LearningMetadata={suspendedFrom?:'triaged'|'learning'|'review';status?:'triaged'|'learning'|'review'|'suspended';initialFamiliarity?:Familiarity;triagedAt?:string;bootstrap?:{successes:number;probeAfterCards:number;sessionId?:string};objectiveReviews?:number;lastReviewAt?:string;lastOutcome?:boolean;lastFailureAt?:string;latencyEmaMs?:number;recentMediaIds?:string[];legacyOf?:string};
export type Snapshot={bundle:Bundle;memories:Memory[];events:{id:string;timestamp:string;recipe:string;level:string;payload:any}[];dailyLearning?:{day:string;retrievals:number;stability30Gains:number};newLearning?:{day:string;introducedEntityIds:string[];extraBudget:number}};


```

### File: res://src/lib/engi/validate.ts
```typescript
import {z} from 'zod';
import {properties,entityTypes} from './knowledge/properties';
import type {Bundle} from './types';
const id=z.string().min(1).max(150);
const url=z.string().url().refine(s=>s.startsWith('https://'),'Нужна HTTPS-ссылка');
const origin={origin:z.enum(['pack','user']).optional(),originPackId:id.optional(),originPackVersion:z.number().int().positive().optional(),userModified:z.boolean().optional(),archived:z.boolean().optional(),upstreamConflict:z.boolean().optional(),upstreamValue:z.unknown().optional(),upstreamAcknowledged:z.string().optional()};
const kind=z.enum(['entity','text','number','date','boolean']);
const flag=z.enum(['auto','on','off']);
const promptTemplate=z.string().min(1).max(1000).refine(s=>!!s.trim(),'Введите вопрос').refine(s=>!/[{}]/.test(s.replace(/\{subject\}/g,'')),'Используйте только подстановку {subject}').refine(s=>!/[<>]/.test(s),'Вопрос должен быть обычным текстом');
const promptTemplates=z.object({forward:promptTemplate.optional(),reverse:promptTemplate.optional(),timeline:promptTemplate.optional(),sort:promptTemplate.optional()}).strict();
export const propertySchema=z.object({...origin,id,name:z.string().min(1).max(200),shortName:z.string().optional(),description:z.string().optional(),valueKind:kind,subjectTypes:z.array(id).optional(),targetTypes:z.array(id).optional(),cardinality:z.enum(['one','many']),learnable:z.boolean(),promptTemplates:promptTemplates.optional(),inverse:z.object({enabled:z.boolean(),name:z.string().optional()}... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export const typeSchema=z.object({...origin,id,name:z.string().min(1).max(200),pluralName:z.string().optional(),icon:z.string().optional(),builtIn:z.boolean().optional()});
const entity=z.object({...origin,id,type:id,name:z.string().min(1).max(200),aliases:z.array(z.string()).default([]),externalIds:z.record(z.string()).default({}),summary:z.string().max(400).optional()});
const source=z.object({kind:z.enum(['url','pack','manual']).optional(),url:url.optional(),name:z.string().min(1),locator:z.string().optional(),family:z.string().optional()}).refine(s=>s.kind==='manual'||!!s.url,'Добавьте HTTPS-источник или отметьте личное знание');
const fact=z.object({...origin,id,entityId:id,key:id,valueKind:kind,valueEntityId:id.optional(),valueText:z.string().optional(),valueNumber:z.number().finite().optional(),valueBoolean:z.boolean().optional(),dateStart:z.string().optional(),dateEnd:z.string().optional(),datePrecision:z.enum(['year','day','month','circa','range']).optional(),source,verification:z.enum(['user_confirmed','direct','veri... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export const validDate=(s:string|undefined)=>{if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s};
const schema=z.object({entities:z.array(entity).max(50000),facts:z.array(fact).max(200000),media:z.array(z.object({...origin,id,entityId:id,role:z.string(),url:z.string().refine(s=>/^engi-media:\/\/[a-f0-9]{64}$/.test(s)||/^media\/[A-Za-z0-9._/-]+$/.test(s),'Нужно локальное изображение'),sourceUrl:url.optional(),license:z.string().min(1),primary:z.boolean().optional(),learningExemplar:z.boolean().... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export function validateImport(input:unknown,existing:Bundle,allowUpdate=false):Bundle{
 const b=schema.parse(input) as Bundle;const e=new Map([...existing.entities,...b.entities].map(e=>[e.id,e]));const tagMap=new Map([...existing.tags,...b.tags].map(t=>[t.id,t]));const defs=new Map(properties({...existing,properties:[...existing.properties??[],...b.properties??[]]}).map(p=>[p.id,p]));const types=new Set(entityTypes({...existing,entityTypes:[...existing.entityTypes??[],...b.entityTy... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 for(const name of ['entities','facts','media','tags','properties','entityTypes'] as const){const rows=b[name]??[];if(new Set(rows.map(x=>x.id)).size!==rows.length)throw Error(`Повторяющийся ID в ${name}`)}
 const assignments=b.entityTags.map(t=>JSON.stringify([t.entityId,t.tagId]));if(new Set(assignments).size!==assignments.length)throw Error('Повтор тега объекта');
 for(const p of b.properties??[]){const old=properties(existing).find(x=>x.id===p.id);if(old&&old.valueKind!==p.valueKind)throw Error('Тип существующего поля нельзя менять');for(const t of [...p.subjectTypes??[],...p.targetTypes??[]])if(!types.has(t))throw Error('Неизвестный тип поля')}
 for(const en of b.entities){if(!types.has(en.type))throw Error('Неизвестный тип объекта');for(const [key,value]of Object.entries(en.externalIds)){const duplicate=[...e.values()].find(x=>x.id!==en.id&&x.externalIds[key]===value);if(duplicate)throw Error(`Объект уже существует: ${duplicate.name}`)}}
 for(const f of b.facts){const def=defs.get(f.key);if(!def||def.valueKind!==f.valueKind||!e.has(f.entityId)||(def.subjectTypes?.length&&!def.subjectTypes.includes(e.get(f.entityId)!.type)))throw Error(`Недопустимый факт ${f.id}`);if(f.valueKind==='entity'&&(!e.has(f.valueEntityId||'')||(def.targetTypes?.length&&!def.targetTypes.includes(e.get(f.valueEntityId!)!.type))))throw Error('Не найден объек... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 for(const t of b.tags){let current:string|undefined=t.id;const seen=new Set<string>();while(current){if(seen.has(current))throw Error('Цикл в тегах');seen.add(current);const tag=tagMap.get(current);if(!tag)throw Error('Неизвестный родительский тег');current=tag.parentId}}
 for(const m of b.media)if(!e.has(m.entityId)||(!m.sourceUrl&&m.origin!=='user'))throw Error('Изображение без объекта или источника');for(const t of b.entityTags)if(!e.has(t.entityId)||!tagMap.has(t.tagId))throw Error('Неизвестный тег или объект');return b;
}

```

### File: res://src/lib/engi/knowledge/conflicts.ts
```typescript
import type {Bundle,Origin} from '../types';
export type ConflictTable='entities'|'facts'|'media'|'tags'|'properties'|'entityTypes';
export function upstreamFingerprint(value:any):string{
 const {origin,originPackId,originPackVersion,userModified,upstreamConflict,upstreamValue,upstreamAcknowledged,...content}=value;
 const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 return JSON.stringify(canonical(content));
}
export function packConflicts(b:Bundle){return (['entities','facts','media','tags','properties','entityTypes'] as const).flatMap(table=>(b[table]??[]).filter(row=>row.upstreamConflict&&row.upstreamValue).map(row=>({table,row:row as Origin&{id:string},upstream:row.upstreamValue as any})))}

```

### File: res://src/lib/engi/knowledge/decks.ts
```typescript
import type {Bundle, Entity, Snapshot} from '../types';
import {indexes} from '../indexes';
import {progress} from './progress';
import {canonicalTargets} from '../questions/recipe-factory';
import {retention} from '../engine';
import {entityTypes} from './properties';

export const UNTAGGED_TAG_ID = '__untagged__';

export type DeckStats = {
  total: number;
  available: number;
  new: number;
  suspended: number;
  covered: number;
  retention: number | null;
  due: number;
};

export type DeckCategory = 'in_progress' | 'completed' | 'unlearned';

export type DeckInfo = {
  id: string;
  name: string;
  isUntagged: boolean;
  parentId?: string;
  childTagIds: string[];
  entityCount: number;
  learnedEntityCount: number;
  startedEntityCount: number;
  category: DeckCategory;
  sampleImages: string[];
  stats: DeckStats;
};

export function getUntaggedEntities(bundle: Bundle): Entity[] {
  const activeTagIds = new Set(bundle.tags.filter(t => !t.archived).map(t => t.id));
  const taggedEntityIds = new Set(
    bundle.entityTags
      .filter(et => !et.archived && activeTagIds.has(et.tagId))
      .map(et => et.entityId)
  );
  return bundle.entities.filter(e => !e.archived && !taggedEntityIds.has(e.id));
}

export function getDeckSampleImages(bundle: Bundle, entityIds: string[], limit = 3): string[] {
  const ix = indexes(bundle);
  const images: string[] = [];
  for (const id of entityIds) {
    if (images.length >= limit) break;
    const list = ix.mediaByEntity.get(id) ?? [];
    const valid = list.find(m => !m.archived && m.learningExemplar !== false && m.url);
    if (valid && !images.includes(valid.url)) {
      images.push(valid.url);
    }
  }
  if (images.length < limit) {
    for (const id of entityIds) {
      if (images.length >= limit) break;
      const list = ix.mediaByEntity.get(id) ?? [];
      for (const m of list) {
        if (images.length >= limit) break;
        if (!m.archived && m.learningExemplar !== false && m.url && !images.includes(m.url)) {
          images.push(m.url);
        }
      }
    }
  }
  return images;
}

export function progressForEntities(s: Snapshot, entityIds: Set<string>): DeckStats {
  const allUnits = canonicalTargets(s.bundle, 'all');
  const units = allUnits.filter(u => entityIds.has(u.entityId));
  const ids = new Set(units.map(i => i.targetId));
  const all = s.memories.filter(m => !m.legacyOf && ids.has(m.id));
  const mem = all.filter(m => m.status !== 'suspended');
  const covered = mem.filter(m => m.attempts > 0);
  const known = new Set(all.map(m => m.id));
  return {
    total: mem.length,
    available: units.length,
    new: units.filter(i => !known.has(i.targetId)).length,
    suspended: all.filter(m => m.status === 'suspended').length,
    covered: covered.length,
    retention: covered.length ? Math.round(covered.reduce((n, m) => n + retention(m), 0) / covered.length * 100) : null,
    due: mem.filter(m => new Date(m.card.due).getTime() <= Date.now()).length,
  };
}

export function getDeckList(s: Snapshot): DeckInfo[] {
  const b = s.bundle;
  const ix = indexes(b);
  const activeTags = b.tags.filter(t => !t.archived);

  const childrenMap = new Map<string, string[]>();
  for (const t of activeTags) {
    if (t.parentId) {
      const arr = childrenMap.get(t.parentId) ?? [];
      arr.push(t.id);
      childrenMap.set(t.parentId, arr);
    }
  }

  const decks: DeckInfo[] = activeTags.map(tag => {
    const memberEntities = ix.entitiesByTag.get(tag.id) ?? [];
    const entityIds = memberEntities.map(e => e.id);
    const p = progress(s, tag.id);
    const counts = calculateDeckEntityCounts(entityIds, s);
    return {
      id: tag.id,
      name: tag.name,
      isUntagged: false,
      parentId: tag.parentId,
      childTagIds: childrenMap.get(tag.id) ?? [],
      entityCount: memberEntities.length,
      learnedEntityCount: counts.learnedCount,
      startedEntityCount: counts.startedCount,
      category: counts.category,
      sampleImages: getDeckSampleImages(b, entityIds, 3),
      stats: {
        total: p.total,
        available: p.available,
        new: p.new,
        suspended: p.suspended,
        covered: p.covered,
        retention: p.retention,
        due: p.due,
      },
    };
  });

  const untagged = getUntaggedEntities(b);
  if (untagged.length > 0) {
    const untaggedIds = untagged.map(e => e.id);
    const p = progressForEntities(s, new Set(untaggedIds));
    const counts = calculateDeckEntityCounts(untaggedIds, s);
    decks.push({
      id: UNTAGGED_TAG_ID,
      name: 'Неразобранное',
      isUntagged: true,
      childTagIds: [],
      entityCount: untagged.length,
      learnedEntityCount: counts.learnedCount,
      startedEntityCount: counts.startedCount,
      category: counts.category,
      sampleImages: getDeckSampleImages(b, untaggedIds, 3),
      stats: p,
    });
  }

  return decks;
}

export function getDeckEntities(bundle: Bundle, deckId: string): Entity[] {
  if (deckId === UNTAGGED_TAG_ID) {
    return getUntaggedEntities(bundle);
  }
  const ix = indexes(bundle);
  return ix.entitiesByTag.get(deckId) ?? [];
}

export function getDeckTypes(entities: Entity[], bundle: Bundle): { id: string; name: string }[] {
  const allTypes = entityTypes(bundle);
  const typeMap = new Map(allTypes.map(t => [t.id, t.name]));
  const seenTypes = new Set(entities.map(e => e.type));
  return [...seenTypes].map(id => ({
    id,
    name: typeMap.get(id) ?? id,
  }));
}

export function filterDeckEntities(
  entities: Entity[],
  bundle: Bundle,
  query: string,
  typeFilter = 'all'
): Entity[] {
  const ix = indexes(bundle);
  const q = query.trim().toLowerCase().replace(/ё/g, 'е');
  return entities.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (!q) return true;
    const searchString = ix.searchByEntity.get(e.id);
    if (searchString && searchString.includes(q)) return true;
    return [e.name, ...(e.aliases ?? [])].some(n =>
      n.toLowerCase().replace(/ё/g, 'е').includes(q)
    );
  });
}

export type EntityMasterySummary = {
  color: 'unseen' | 'red' | 'orange' | 'yellow' | 'green' | 'suspended';
  mark: string;
  label: string;
};

export function getEntityLearningStatus(entityId: string, snapshot: Snapshot): 'learned' | 'in_progress' | 'unlearned' {
  const b = snapshot.bundle;
  const entityFactIds = new Set(b.facts.filter(f => f.entityId === entityId && !f.archived).map(f => f.id));
  const memories = snapshot.memories.filter(m => {
    if (m.legacyOf) return false;
    if (m.id.startsWith(`ku:entity:${entityId}:`)) return true;
    for (const factId of entityFactIds) {
      if (m.id.startsWith(`ku:fact:${factId}:`)) return true;
    }
    return false;
  });

  if (memories.length === 0) return 'unlearned';

  const active = memories.filter(m => m.status !== 'suspended');
  if (active.length === 0) return 'unlearned';

  const allLearned = active.every(
    m => (m.attempts ?? 0) > 0 && !!m.firstSuccessAt && m.lastOutcome !== false && (m.card?.stability ?? 0) >= 7
  );
  if (allLearned) return 'learned';

  const anyStarted = active.some(
    m => (m.attempts ?? 0) > 0 || m.status === 'learning' || m.status === 'triaged' || m.lastOutcome !== undefined
  );
  if (anyStarted) return 'in_progress';

  return 'unlearned';
}

export function calculateDeckEntityCounts(entityIds: string[], snapshot: Snapshot): {
  learnedCount: number;
  startedCount: number;
  category: DeckCategory;
} {
  let learnedCount = 0;
  let startedCount = 0;
  for (const id of entityIds) {
    const status = getEntityLearningStatus(id, snapshot);
    if (status === 'learned') {
      learnedCount++;
      startedCount++;
    } else if (status === 'in_progress') {
      startedCount++;
    }
  }

  let category: DeckCategory = 'unlearned';
  if (entityIds.length > 0 && learnedCount === entityIds.length) {
    category = 'completed';
  } else if (startedCount > 0 || learnedCount > 0) {
    category = 'in_progress';
  } else {
    category = 'unlearned';
  }

  return {learnedCount, startedCount, category};
}

export function getEntityMasterySummary(entityId: string, snapshot: Snapshot): EntityMasterySummary {
  const b = snapshot.bundle;
  const entityFactIds = new Set(b.facts.filter(f => f.entityId === entityId && !f.archived).map(f => f.id));
  const memories = snapshot.memories.filter(m => {
    if (m.legacyOf) return false;
    if (m.id.startsWith(`ku:entity:${entityId}:`)) return true;
    for (const factId of entityFactIds) {
      if (m.id.startsWith(`ku:fact:${factId}:`)) return true;
    }
    return false;
  });

  if (memories.length === 0) return {color: 'unseen', mark: '⚪', label: 'Не начато'};
  if (memories.every(m => m.status === 'suspended')) return {color: 'suspended', mark: '★', label: '★ Не учу'};

  const active = memories.filter(m => m.status !== 'suspended');
  if (active.some(m => m.lastOutcome === false || (!m.firstSuccessAt && m.attempts > 0))) {
    return {color: 'red', mark: '🔴', label: 'Ошибки'};
  }
  const now = Date.now();
  if (active.some(m => new Date(m.card.due).getTime() <= now)) {
    return {color: 'orange', mark: '⏳', label: 'Пора повторить'};
  }
  if (active.every(m => m.card.stability >= 30)) {
    return {color: 'green', mark: '🟢', label: 'Закреплено'};
  }
  if (active.some(m => m.card.stability >= 7)) {
    return {color: 'yellow', mark: '🟡', label: 'Помню'};
  }
  return {color: 'orange', mark: '🟠', label: 'Учусь'};
}
```

### File: res://src/lib/engi/knowledge/motivation.ts
```typescript
import type {Snapshot} from '../types';
import {canonicalTargets} from '../questions/recipe-factory';
import {progress} from './progress';
export function localDay(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`}
export function todayLearning(s:Snapshot,now=new Date()){
 const day=localDay(now);if(s.dailyLearning?.day===day)return {retrievals:s.dailyLearning.retrievals,stability30Gains:s.dailyLearning.stability30Gains};
 const events=s.events.filter(e=>localDay(new Date(e.timestamp))===day&&e.level==='direct'&&typeof e.payload?.score==='number');
 const gains=new Set(events.flatMap(e=>(e.payload.metadata?.stabilityTransitions??[]).filter((t:any)=>t.before<30&&t.after>=30).map((t:any)=>t.targetId)));
 return {retrievals:events.length,stability30Gains:gains.size};
}
export type ReturnHook={kind:'due'|'confusion'|'new'|'collection';count:number;title:string;detail:string;action:string;tag:string;mode:string};
export function returnHook(s:Snapshot):ReturnHook|null{
 const p=progress(s);if(p.due)return {kind:'due',count:p.due,title:`${Math.min(6,p.due)} знаний особенно нуждаются в повторении`,detail:'Короткая практика поможет удержать уже знакомое.',action:'Повторить',tag:'all',mode:'daily'};
 const targets=canonicalTargets(s.bundle),known=new Set(s.memories.map(m=>m.id));
 for(const m of s.memories){const target=targets.find(t=>t.targetId===m.id),confusion=Object.entries(m.confusions).sort((a,b)=>b[1]-a[1]).find(([,n])=>n>=.2);if(!target||!confusion)continue;
  const wrong=s.bundle.entities.find(e=>e.id===confusion[0]&&!e.archived)?.name??confusion[0];return {kind:'confusion',count:1,title:`${target.answer} и ${wrong}`,detail:'Эта связь ещё путается. Попробуем различить похожее.',action:'Различить',tag:'all',mode:'practice'};
 }
 for(const tag of s.bundle.tags.filter(t=>!t.archived)){const q=progress(s,tag.id),left=q.total-q.covered;if(q.covered>0&&left>0&&left<=4)return {kind:'collection',count:left,title:`В «${tag.name}» осталось открыть ${left} знаний`,detail:`Уже знакомо ${q.covered} из ${q.total}.`,action:'Продолжить подборку',tag:tag.id,mode:'explore'}}
 const freshEntities=new Set(targets.filter(t=>!known.has(t.targetId)&&!targets.some(x=>x.entityId===t.entityId&&known.has(x.targetId))).map(t=>t.entityId));const daily=s.newLearning?.day===localDay()?s.newLearning:undefined;const budget=Math.max(0,3+(daily?.extraBudget??0)-(daily?.introducedEntityIds.length??0));const count=Math.min(budget,freshEntities.size);
 return count?{kind:'new',count,title:`${count} новых объектов готовы к открытию`,detail:'Сначала попробуйте вспомнить — затем познакомимся с новым.',action:'Открыть новое',tag:'all',mode:'explore'}:null;
}

```

### File: res://src/lib/engi/knowledge/progress.ts
```typescript
import type {Snapshot} from '../types';
import {canonicalTargets} from '../questions/recipe-factory';
import {retention} from '../engine';
export function progress(s:Snapshot,tag='all'){
 const units=canonicalTargets(s.bundle,tag),ids=new Set(units.map(i=>i.targetId)),all=s.memories.filter(m=>!m.legacyOf&&ids.has(m.id)),mem=all.filter(m=>m.status!=='suspended'),covered=mem.filter(m=>m.attempts>0),known=new Set(all.map(m=>m.id));
 return {total:mem.length,available:units.length,new:units.filter(i=>!known.has(i.targetId)).length,suspended:all.filter(m=>m.status==='suspended').length,covered:covered.length,retention:covered.length?Math.round(covered.reduce((n,m)=>n+retention(m),0)/covered.length*100):null,week:covered.filter(m=>m.card.stability>=7).length,month:covered.filter(m=>m.card.stability>=30).length,quarter:covered.f... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}

```

### File: res://src/lib/engi/knowledge/properties.ts
```typescript
import type {Bundle,PropertyDefinition,EntityTypeDefinition,Fact} from '../types';
const specs:[string,string,PropertyDefinition['valueKind'],string[],string[]?][]=[['created_by','Автор','entity',['artwork'],['person']],['creation_date','Дата создания','date',['artwork']],['presidency_start','Начало президентства','date',['person']],['presidency_end','Конец президентства','date',['person']],['party','Партия','entity',['person'],['organization']],['movement','Направление','entity... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export const BUILTIN_PROPERTIES:PropertyDefinition[]=specs.map(([id,name,valueKind,subjectTypes,targetTypes])=>({id,name,valueKind,subjectTypes,targetTypes,cardinality:'one',learnable:valueKind!=='text',builtIn:true,inverse:{enabled:false},learning:{forward:true}}));
export const BUILTIN_TYPES:EntityTypeDefinition[]=[['person','Человек'],['artwork','Картина'],['country','Страна'],['city','Город'],['organization','Организация'],['movement','Направление'],['event','Событие'],['invention','Изобретение'],['concept','Понятие'],['film','Фильм'],['book','Книга'],['game','Игра']].map(([id,name])=>({id,name,builtIn:true}));
export function properties(b:Bundle){return [...new Map([...BUILTIN_PROPERTIES,...b.properties??[]].map(p=>[p.id,p])).values()].filter(p=>!p.archived)}
export function entityTypes(b:Bundle){return [...new Map([...b.entities.map(e=>({id:e.type,name:e.type})),...BUILTIN_TYPES,...b.entityTypes??[]].map(p=>[p.id,p])).values()]}
export const trusted=(f:Fact)=>!f.archived&&['direct','verified','user_confirmed'].includes(f.verification);
export const factValue=(f:Fact)=>JSON.stringify([f.valueKind,f.valueEntityId,f.valueText,f.valueNumber,f.valueBoolean,f.dateStart,f.dateEnd,f.datePrecision]);
export const textValue=(f:Fact,b:Bundle)=>f.valueKind==='entity'?b.entities.find(e=>e.id===f.valueEntityId)?.name??'Объект недоступен':f.valueKind==='date'?`${f.datePrecision==='circa'?'Около ':''}${f.dateStart}${f.dateStart!==f.dateEnd?' — '+f.dateEnd:''}`:f.valueKind==='boolean'?(f.valueBoolean?'Да':'Нет'):String(f.valueText??f.valueNumber??'');

```

### File: res://src/lib/engi/learning/bootstrap.ts
```typescript
import {createEmptyCard,type Card,Rating} from 'ts-fsrs';
import {scheduler,hydrate} from '../engine';
import type {Familiarity,Memory,Item} from '../types';
export const DAY=86400000;
export const BOOTSTRAP={red:{delay:3,days:[1,1,1]},orange:{delay:5,days:[2,3]},yellow:{delay:5,days:[3,7]},green:{delay:8,days:[7]}} as const;
export function triagedMemory(item:Item,color:Familiarity,sessionId:string,completed:number,now=new Date()):Memory{
 const card=createEmptyCard<Card>(now);card.due=new Date(now.getTime()+DAY);
 return {id:item.targetId,card,attempts:0,correct:0,confusions:{},status:color==='suspended'?'suspended':'triaged',initialFamiliarity:color,triagedAt:now.toISOString(),objectiveReviews:0,bootstrap:{successes:0,sessionId,probeAfterCards:completed+(color==='suspended'?0:BOOTSTRAP[color].delay)}};
}
export function reviewLearning(old:Memory,item:Item,correct:boolean,objective:boolean,repair:boolean,practice:boolean,latency:number,now=new Date()){
 const m=structuredClone(old),unscheduled=repair||practice;
 if(Number.isFinite(latency))m.latencyEmaMs=m.latencyEmaMs===undefined?latency:m.latencyEmaMs*.7+latency*.3;
 if(unscheduled)return {memory:m,fsrsUpdated:false};
 m.attempts++;m.correct+=Number(correct);m.objectiveReviews=(m.objectiveReviews??0)+Number(objective);m.lastReviewAt=now.toISOString();m.lastOutcome=correct;if(!correct)m.lastFailureAt=now.toISOString();
 m.firstSuccessAt??=correct?now.toISOString():undefined;
 if(m.status==='review'||!m.status){m.card=scheduler.next(hydrate(m),now,correct?Rating.Good:Rating.Again).card;m.status='review';return {memory:m,fsrsUpdated:true}}
 const plan=m.lastFailureAt?'red':m.initialFamiliarity==='suspended'?'red':m.initialFamiliarity??'red';
 const successes=correct&&objective?(m.bootstrap?.successes??0)+1:correct?(m.bootstrap?.successes??0):0;
 let fsrsUpdated=false;
 // Initial failed exposure is a probe, not a lapse of established memory.
 if(correct&&objective||m.card.reps>0){m.card=scheduler.next(hydrate(m),now,correct?Rating.Good:Rating.Again).card;fsrsUpdated=true}
 const intervals=BOOTSTRAP[plan].days,days=correct&&objective?intervals[Math.min(Math.max(0,successes-1),intervals.length-1)]:1;
 m.card.due=new Date(now.getTime()+days*DAY);m.card.scheduled_days=days;m.bootstrap={successes,probeAfterCards:0};m.status=correct&&objective&&successes>=intervals.length?'review':'learning';
 return {memory:m,fsrsUpdated};
}
export function unitDue(m:Memory,sessionId:string,completed:number,now=Date.now()){
 if(m.legacyOf||m.status==='suspended')return false;
 if(m.status==='triaged'&&m.bootstrap?.sessionId===sessionId&&completed>=m.bootstrap.probeAfterCards)return true;
 return new Date(m.card.due).getTime()<=now;
}

```

### File: res://src/lib/engi/learning/knowledge-unit.ts
```typescript
import type {Bundle,Memory,Item} from '../types';
export type KnowledgeUnit={id:string;entityId:string;propertyId:string;factId?:string;direction:'forward'|'reverse';skill:'association'|'visual';item:Item};
export type TargetMapping={legacyId:string;unitId:string};
export function knowledgeUnitId(b:Bundle,entityId:string,factId:string|undefined,direction='forward',cue='name',property='identity'){
 if(!factId)return `ku:entity:${entityId}:visual_identity`;
 return `ku:fact:${factId}:${direction}`;
}
export function legacyUnitId(id:string,b:Bundle):string|undefined{
 if(id.startsWith('ku:')){if(id.endsWith(':visual'))return id.slice(0,-7);return id;}
 const identity=/^entity:(.+):image_to_name$/.exec(id);if(identity)return `ku:entity:${identity[1]}:visual_identity`;
 const f=b.facts.find(f=>id.startsWith(`fact:${f.id}:`));if(!f)return;
 const suffix=id.slice(`fact:${f.id}:`.length),direction=suffix.includes(':reverse')?'reverse':'forward',cue=suffix.includes('image')?'image':'name';
 return knowledgeUnitId(b,f.entityId,f.id,direction,cue,f.key);
}
/** Original rows remain archived and events are never rewritten. */
export function mergeLegacyStates(input:Memory[],b:Bundle){
 const states=input.map(m=>structuredClone(m)),groups=new Map<string,Memory[]>(),mappings:TargetMapping[]=[];
 for(const m of states){const id=m.legacyOf??legacyUnitId(m.id,b);if(id&&id!==m.id)mappings.push({legacyId:m.id,unitId:id});if(!id||id===m.id||m.legacyOf)continue;groups.set(id,[...groups.get(id)??[],m]);m.legacyOf=id}
 for(const [id,legacy] of groups){const existing=states.find(m=>m.id===id),rows=[...legacy,...existing?[existing]:[]],weak=[...rows].sort((a,c)=>a.card.stability-c.card.stability)[0],merged:Memory={...structuredClone(weak),id,legacyOf:undefined,status:'review',objectiveReviews:Math.max(...rows.map(m=>m.objectiveReviews??m.card.reps??0)),attempts:Math.max(...rows.map(m=>m.attempts)),correct:Math.mi... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
  for(const m of rows)for(const [wrong,count] of Object.entries(m.confusions))merged.confusions[wrong]=(merged.confusions[wrong]??0)+count;
  const first=rows.map(m=>m.firstSuccessAt).filter((d):d is string=>!!d).sort();merged.firstSuccessAt=first[0];merged.lastReviewAt=rows.map(m=>m.lastReviewAt??m.card.last_review).filter(Boolean).map(d=>new Date(d).toISOString()).sort().at(-1);
  if(existing)states.splice(states.indexOf(existing),1,merged);else states.push(merged);
 }
 return {states,mappings};
}

```

### File: res://src/lib/engi/learning/mastery.ts
```typescript
import type {Memory} from '../types';
import {retention} from '../engine';
export function difficultyStage(m?:Memory):1|2|3|4{
 if(!m||m.status==='triaged'||m.status==='learning'||m.lastOutcome===false)return 1;
 const r=retention(m),s=m.card.stability;
 if(s<7||r<.7)return 1;
 if(s<30||r<.85||Number(m.latencyEmaMs??0)>6000)return 2;
 return s>=90&&r>=.9&&Number(m.latencyEmaMs??0)<=4000?4:3;
}
export function currentMastery(m?:Memory){
 if(m?.status==='suspended')return {color:'suspended',label:'★ Не учу'};
 if(!m||!m.attempts)return {color:m?.initialFamiliarity??'red',label:'Нужна первая проверка'};
 if(m.lastOutcome===false||!m.firstSuccessAt)return {color:'red',label:'Нужно укрепить'};
 if(m.status==='learning'||m.card.stability<7)return {color:'orange',label:'Учусь'};
 if(m.card.stability<30||retention(m)<.85)return {color:'yellow',label:'Помню'};
 return {color:'green',label:m.card.stability>=180?'Закреплено':`Закреплено ${m.card.stability>=90?'90':m.card.stability>=30?'30':'7'}д+`};
}

```

### File: res://src/lib/engi/questions/distractors.ts
```typescript
import {difficultyStage} from '../learning/mastery';
import type {Bundle,Item,Memory,Task} from '../types';
import {indexes} from '../indexes';
import {normalize,shuffle} from '../engine';
export function distractors(b:Bundle,target:Item,pool:Item[],memory:Memory|undefined,recent:Task[]){const ix=indexes(b);const labels=new Set([target.answer,...target.aliases].map(normalize));const tags=ix.tagsByEntity.get(target.entityId)??new Set();const exposure=new Map<string,number>();for(const t of recent.slice(-4))for(const o of t.options)exposure.set(o.id,(exposure.get(o.id)??0)+1);
 const unique=new Map<string,Item>();for(const i of pool){if(i.answerId===target.answerId||[i.answer,...i.aliases].some(x=>labels.has(normalize(x))))continue;if(ix.entityById.get(i.answerId)&&ix.entityById.get(target.answerId)&&ix.entityById.get(i.answerId)!.type!==ix.entityById.get(target.answerId)!.type)continue;if(!unique.has(normalize(i.answer)))unique.set(normalize(i.answer),i)}
 const stage=difficultyStage(memory);const score=(i:Item)=>{const overlap=[...ix.tagsByEntity.get(i.entityId)??[]].filter(t=>tags.has(t)).length;return (memory?.confusions[i.answerId]??0)*4+(stage>=3?overlap*3:stage===2?overlap: -overlap*2)-(exposure.get(i.answerId)??0)*2};return shuffle([...unique.values()]).sort((a,c)=>score(c)-score(a)).slice(0,3).map(i=>({id:i.answerId,name:i.answer}));
}


```

### File: res://src/lib/engi/questions/exemplar-selector.ts
```typescript
import type {Bundle,Recipe,Memory} from '../types';
export function allowedMedia(b:Bundle,entityId:string,r:Recipe){
 const roles=r.mediaRoles??(b.entities.find(e=>e.id===entityId)?.type==='artwork'?['primary','artwork','painting','image']:['primary','portrait','photo','image']);
 return b.media.filter(m=>m.entityId===entityId&&!m.archived&&m.learningExemplar!==false&&roles.includes(m.role));
}
export function selectExemplar(b:Bundle,entityId:string,r:Recipe,m?:Memory){const pool=allowedMedia(b,entityId,r);return pool.find(x=>!m?.recentMediaIds?.slice(-3).includes(x.id))??pool.find(x=>x.id!==m?.recentMediaIds?.at(-1))??pool[0]}

```

### File: res://src/lib/engi/questions/question-templates.ts
```typescript
import type {Format,PropertyDefinition} from '../types';

type Templates=NonNullable<PropertyDefinition['promptTemplates']>;
export const QUESTION_TEMPLATES:Readonly<Record<string,Templates>>={
 birth_date:{forward:'Когда родился {subject}?',timeline:'Когда родился {subject}?',sort:'Расположите людей по дате рождения: от ранней к поздней.'},
 presidency_start:{forward:'Когда {subject} стал президентом?',timeline:'Когда {subject} стал президентом?',sort:'Расположите президентов по началу президентства: от раннего к позднему.'},
 presidency_end:{forward:'Когда закончилось президентство {subject}?',timeline:'Когда закончилось президентство {subject}?',sort:'Расположите президентов по окончанию президентства: от раннего к позднему.'},
 party:{forward:'К какой партии принадлежал {subject}?'},
 created_by:{forward:'Кто автор «{subject}»?'},
 birth_place:{forward:'Где родился {subject}?'},
 creation_date:{forward:'Когда была создана работа «{subject}»?',timeline:'Когда была создана работа «{subject}»?',sort:'Расположите работы по дате создания: от ранней к поздней.'},
 capital:{forward:'Какой город является столицей {subject}?'},
 invented_by:{forward:'Кто изобрёл «{subject}»?'},
 event_start:{forward:'Когда началось событие «{subject}»?',timeline:'Когда началось событие «{subject}»?',sort:'Расположите события по дате начала: от ранней к поздней.'},
 movement:{forward:'К какому направлению относится «{subject}»?'},
 definition:{forward:'Что означает «{subject}»?'},
};

const present=(template:string|undefined)=>template?.trim()||undefined;
const defaults=(property:PropertyDefinition|undefined)=>property?QUESTION_TEMPLATES[property.id]:undefined;

/** An explicit setting and a real reverse template are both required. */
export function reversePromptAvailable(property:PropertyDefinition|undefined):boolean{
 if(!property)return false;
 const enabled=property.learning?.reverse??property.inverse?.enabled??false;
 return enabled&&!!present(property.promptTemplates?.reverse??defaults(property)?.reverse);
}

/** Templates are interpolated as text; replacement callbacks preserve literal dollar signs. */
export function questionPrompt(property:PropertyDefinition|undefined,subject:string,format:Format,direction:'forward'|'reverse'='forward'):string{
 const custom=property?.promptTemplates,builtin=defaults(property),label=property?.name.trim()||'Ответ';
 let template:string|undefined;
 if(direction==='reverse')template=present(custom?.reverse)??present(builtin?.reverse);
 else if(format==='missing')template=`Какой объект пропущен в последовательности по полю «${label}»?`;
 else if(format==='sort')template=present(custom?.sort)??present(builtin?.sort)??`Расположите объекты по полю «${label}»: от раннего к позднему.`;
 else if(format==='timeline')template=present(custom?.timeline)??present(custom?.forward)??present(builtin?.timeline)??present(builtin?.forward);
 else template=present(custom?.forward)??present(builtin?.forward);
 if(!template)template=direction==='reverse'?`Обратный вопрос для поля «${label}» не настроен.`:`Укажите «${label}» для «{subject}».`;
 return template.replace(/\{subject\}/g,()=>subject);
}

```

### File: res://src/lib/engi/questions/recipe-factory.ts
```typescript
import {reversePromptAvailable} from './question-templates';
import {allowedMedia} from './exemplar-selector';
import {knowledgeUnitId} from '../learning/knowledge-unit';
import {indexes} from '../indexes';
import {properties,trusted,factValue} from '../knowledge/properties';
import type {Bundle,Recipe,Item,Format,PropertyDefinition} from '../types';
const builtinKey=(p:PropertyDefinition,cue:string)=>p.builtIn?(p.valueKind==='date'?`${p.id}_to_year`:`${cue}_to_${p.id}`):`property:${p.id}:forward:${cue}`;
function recipe(tag:string|undefined,type:string,key:string,cue:Recipe['cue'],memoryKey:string,format:Format,label:string,direction:'forward'|'reverse'='forward'):Recipe{const diagnostic=['sort','timeline','missing'].includes(format);return {id:`${tag??'all'}:${type}:${key}:${direction}:${format}`,tag,subjectType:type,answerKey:key,cue,memoryKey,format,label,direction,diagnostic,evidence:{level:di... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export function eligible(b:Bundle,r:Recipe):Item[]{const ix=indexes(b);const members=r.tag?ix.entitiesByTag.get(r.tag)??[]:[...ix.entityById.values()];return members.filter(e=>!r.subjectType||e.type===r.subjectType).flatMap((e):Item[]=>{
 const media=allowedMedia(b,e.id,r)[0];const image=media?.url;if(r.cue==='image'&&!image)return [];
 if(r.answerKey==='identity')return [{entityId:e.id,name:e.name,image,mediaId:media?.id,targetId:knowledgeUnitId(b,e.id,undefined),answer:e.name,aliases:e.aliases,answerId:e.id,answerEntityId:e.id,sourceUrl:media?.sourceUrl??'',summary:e.summary}];
 const def=ix.propertyById.get(r.answerKey);if(!def||!def.learnable||def.archived)return [];
 const all=ix.factsByEntityAndKey.get(e.id)?.get(r.answerKey)??[];const values=all.filter(trusted);if(!values.length||all.some(f=>!trusted(f)))return [];
 if(new Set(values.map(factValue)).size!==1)return [];const f=values[0];const obj=ix.entityById.get(f.valueEntityId??'');if(f.valueKind==='entity'&&!obj)return [];
 const year=f.valueKind==='date'?Number(f.dateStart?.slice(0,4)):f.valueKind==='number'?f.valueNumber:undefined;
 if(f.valueKind==='date'&&(!year||!Number.isFinite(year)))return [];
 if(r.direction==='reverse'){
  if(!obj)return [];const related=(ix.incomingFactsByTarget.get(obj.id)??[]).filter(x=>x.key===f.key&&trusted(x));if(new Set(related.map(x=>x.entityId)).size!==1)return [];
  return [{entityId:obj.id,name:obj.name,image:ix.mediaByEntity.get(obj.id)?.[0]?.url,targetId:knowledgeUnitId(b,e.id,f.id,r.direction,r.cue,f.key),answer:e.name,aliases:e.aliases,answerId:e.id,answerEntityId:e.id,factId:f.id,sourceUrl:f.source.url??''}];
 }
 const dateAnswer=f.valueKind==='date'?(f.datePrecision==='circa'?`Около ${year}`:f.datePrecision==='range'&&f.dateEnd?.slice(0,4)!==String(year)?`${year}–${f.dateEnd?.slice(0,4)}`:String(year)):undefined;
 const answer=obj?.name??f.valueText??(f.valueKind==='boolean'?(f.valueBoolean?'Да':'Нет'):dateAnswer??String(f.valueNumber??year??''));if(!answer)return [];
 return [{entityId:e.id,name:e.name,image,mediaId:media?.id,targetId:knowledgeUnitId(b,e.id,f.id,r.direction,r.cue,f.key),answer,aliases:obj?.aliases??[],answerId:obj?.id??answer,answerEntityId:obj?.id,year,factId:f.id,sourceUrl:f.source.url??'',summary:e.summary}];
})}
export function recipes(b:Bundle):Recipe[]{const ix=indexes(b);const result:Recipe[]=[];const scopes:[string|undefined,typeof b.entities][]=[[undefined,[...ix.entityById.values()]],...b.tags.filter(t=>!t.archived).map(t=>[t.id,ix.entitiesByTag.get(t.id)??[]] as [string,typeof b.entities])];
 for(const [tag,members] of scopes)for(const type of new Set(members.map(e=>e.type))){const typed=members.filter(e=>e.type===type);const image=typed.some(e=>ix.mediaByEntity.has(e.id));
 if(image){const base=recipe(tag,type,'identity','image','image_to_name','choice','Кто или что на изображении?');const pool=eligible(b,base);if(pool.length){result.push({...base,format:'recall_reveal',id:base.id.replace(/choice$/,'recall_reveal'),evidence:{...base.evidence!,selfReport:true}});if(new Set(pool.map(i=>i.answerId)).size>=3){result.push(base);if(pool.length>=3)result.push({...base,id:b... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 for(const p of properties(b).filter(p=>p.learnable&&(!p.subjectTypes?.length||p.subjectTypes.includes(type)))){
  const cues:Recipe['cue'][]=p.valueKind==='date'||p.valueKind==='number'||!image?['name']:['image','name'];
  for(const cue of cues)for(const direction of ['forward','reverse'] as const){if(direction==='reverse'&&cue!==cues[0])continue;if(direction==='forward'&&p.learning?.forward===false)continue;if(direction==='reverse'&&(!p.inverse?.enabled||p.learning?.reverse!==true||!reversePromptAvailable(p)||p.valueKind!=='entity'))continue;
   const base=recipe(tag,type,p.id,direction==='reverse'?'name':cue,direction==='reverse'?`property:${p.id}:reverse`:builtinKey(p,cue),'choice',direction==='reverse'?p.inverse?.name??`${p.name}: какой объект?`:p.name,direction);const pool=eligible(b,base);if(!pool.length)continue;const unique=new Set(pool.map(i=>i.answerId));const repeated=pool.length>unique.size;
   const enabled=(f:Format)=>{const field=f==='recall_reveal'?'recallReveal':f as keyof NonNullable<PropertyDefinition['learning']>;const value=p.learning?.[field];return value!=='off'&&(p.valueKind!=='text'||value==='on')};
   const formats:Format[]=[];if(enabled('recall_reveal'))formats.push('recall_reveal');if(unique.size>=3&&enabled('choice'))formats.push('choice');if(unique.size>=3&&pool.length>=3&&p.valueKind==='entity'&&enabled('match'))formats.push('match');if(unique.size>=2&&repeated&&p.valueKind==='entity'&&enabled('categorize'))formats.push('categorize');
   if(['date','number'].includes(p.valueKind)&&direction==='forward'&&new Set(pool.map(i=>i.year)).size>=3){if(enabled('sort'))formats.push('sort');if(p.valueKind==='date'&&enabled('timeline'))formats.push('timeline');if(p.valueKind==='date'&&enabled('missing'))formats.push('missing')}
   for(const f of formats){const next=recipe(tag,type,p.id,base.cue,base.memoryKey,f,base.label!,direction);if(cue!==cues[0])next.id=next.id.replace(`:${f}`,`:${cue}:${f}`);result.push(next)}
  }
 }
 }return result;
}
export function canonicalTargets(b:Bundle,tag='all'){const out=new Map<string,Item>();for(const r of recipes(b).filter(r=>r.countsTowardMastery&&(tag==='all'?r.tag===undefined:r.tag===tag)))for(const i of eligible(b,r))out.set(i.targetId,i);return [...out.values()]}




```

### File: res://src/lib/engi/questions/timeline.ts
```typescript
import type {Item,Task} from '../types';

/** One scale per complete property/category pool, never per selected answer. */
export function timelineContext(pool:Item[]):NonNullable<Task['timeline']> {
 const values=pool.map(i=>i.year).filter((v):v is number=>Number.isFinite(v));
 if(!values.length)return {min:1,max:2100,initial:1050};
 const low=Math.min(...values),high=Math.max(...values);
 const span=Math.max(100,high-low),margin=Math.max(25,span*.15);
 const unit=span>1000?100:span>300?50:25;
 const min=Math.max(1,Math.floor((low-margin)/unit)*unit),max=Math.ceil((high+margin)/unit)*unit;
 const midpoint=Math.round((min+max)/2),hits=(value:number)=>values.filter(year=>Math.abs(year-value)<=15).length;
 // A tightly clustered chronology must still require an intentional estimate.
 // Select from this shared scale, never from the currently displayed item.
 const initial=hits(midpoint)<values.length/2?midpoint:hits(min)<=hits(max)?min:max;
 return {min,max,initial};
}
export function isDiscrete(task:Task){return ['choice','match','categorize','missing'].includes(task.recipe.format)}
export function discreteAnswer(task:Task){return task.recipe.format==='missing'?[...task.items].sort((a,b)=>a.year!-b.year!)[1]?.entityId:task.items[0].answerId}

```

### File: res://src/lib/engi/session/candidate-pool.ts
```typescript
import type {Bundle,Memory,Snapshot,Task} from '../types';
import type {SessionRow} from '../../../db/engi-db';
import {canonicalTargets} from '../questions/recipe-factory';
import {composeUnit,composeFeed} from './composer';
import {unitDue} from '../learning/bootstrap';
import {localDay} from '../knowledge/motivation';

export function dailyNewState(value:any):NonNullable<Snapshot['newLearning']>{return value?.day===localDay()?value:{day:localDay(),introducedEntityIds:[],extraBudget:0}}
export function pickFeed(b:Bundle,memories:Memory[],s:SessionRow,newState:NonNullable<Snapshot['newLearning']>,introduced:string[]=[]){
 const units=canonicalTargets(b,s.tag??'all'),unitIds=new Set(units.map(i=>i.targetId)),mem=new Map(memories.filter(m=>!m.legacyOf).map(m=>[m.id,m])),history=s.cooldown??[],completed=s.completedCount??0;
 s.repairQueue=(s.repairQueue??[]).filter(t=>t.items.every(i=>unitIds.has(i.targetId)&&mem.get(i.targetId)?.status!=='suspended'));
 const repair=s.repairQueue.find(t=>(t.retryAfter??0)<=completed&&!history.slice(-3).some(h=>h.items.some(i=>i.entityId===t.items[0].entityId)));
 if(repair){s.repairQueue=s.repairQueue!.filter(t=>t.id!==repair.id);return {task:repair}}
 const ordinary=history.filter(t=>!t.recipe.diagnostic&&!t.retryOf&&t.reason!=='intro'),blockSize=(s.ordinaryCount??0)%15,block=blockSize?ordinary.slice(-blockSize):[];
 const sameEntity=(id:string)=>history.slice(-6).some(t=>t.items.some(i=>i.entityId===id));
 const due=units.filter(i=>{const m=mem.get(i.targetId);return m&&unitDue(m,s.id,completed)});
 const known=units.filter(i=>mem.has(i.targetId)&&mem.get(i.targetId)!.status!=='suspended');
 let candidates=(s.mode==='practice'?known:due).filter(i=>!sameEntity(i.entityId));
 const unused=candidates.filter(i=>!block.some(t=>t.items.some(x=>x.entityId===i.entityId)));if(unused.length)candidates=unused;
 if(!candidates.length&&s.mode==='practice')candidates=known;
 const narrowTags=(entityId:string)=>b.entityTags.filter(t=>t.entityId===entityId&&!t.archived&&b.entityTags.filter(a=>a.tagId===t.tagId&&!a.archived).length<Math.max(8,b.entities.length*.6)).map(t=>t.tagId);
 const recentTags=ordinary.slice(-4).flatMap(t=>t.items.flatMap(i=>narrowTags(i.entityId)));
 candidates.sort((a,c)=>{const rank=(i:typeof a)=>{const m=mem.get(i.targetId)!,overdue=Math.max(0,Date.now()-new Date(m.card.due).getTime())/86400000,tagPenalty=narrowTags(i.entityId).some(id=>recentTags.filter(t=>t===id).length>=2)?10:0;return (m.status==='triaged'||m.status==='learning'?-4:0)-Math.min(overdue,20)+tagPenalty};return rank(a)-rank(c)});
 const diagnosticFormat=['timeline','sort','missing'].includes(s.format??'');
 if(!diagnosticFormat)for(const i of candidates){const m=mem.get(i.targetId)!,task=composeUnit(b,m,s.tag,s.format,history);if(task){task.practice=s.mode==='practice'&&!unitDue(m,s.id,completed);task.reason=task.practice?'practice':m.status==='triaged'||m.status==='learning'?'bootstrap':'due';return {task}}}
 const entityOf=(i:typeof units[number])=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId??i.entityId:i.entityId;
 const seenEntities=new Set([...introduced,...units.filter(i=>mem.has(i.targetId)).map(entityOf)]),newUnits=units.filter(i=>!mem.has(i.targetId));
 const budget=Math.max(0,(due.length>=20?1:3)+newState.extraBudget-newState.introducedEntityIds.length);
 const ownerKnown=(i:typeof units[number])=>seenEntities.has(entityOf(i));
 const first=newUnits.find(ownerKnown)??(budget>0?newUnits.find(i=>!sameEntity(entityOf(i))):undefined);
 if(first){const targetId=entityOf(first),newProperty=ownerKnown(first),items=newUnits.filter(i=>entityOf(i)===targetId);return {intro:{entityId:targetId,unitIds:items.map(i=>i.targetId),selections:Object.fromEntries(items.map(i=>[i.targetId,'red' as const])),newProperty}}}
 if(diagnosticFormat||(s.ordinaryCount??0)>=8&&ordinary.slice(-8).every(t=>!t.recipe.diagnostic)){
  const activeIds=new Set(known.map(i=>i.factId)),db={...b,facts:b.facts.filter(f=>activeIds.has(f.id))};
  for(const format of diagnosticFormat?[s.format!]:['timeline','sort','missing']){
   const task=composeFeed(db,memories,s.tag,format,'daily',history,1).find(t=>!(s.diagnosticSeen??[]).includes(t.recipe.id)&&!history.slice(-2).some(h=>h.items.some(i=>t.items.some(x=>x.entityId===i.entityId))));if(task)return {task};
  }
 }
 return {exhausted:true as const};
}

```

### File: res://src/lib/engi/session/composer.ts
```typescript
import {properties} from '../knowledge/properties';
import type {Bundle,Memory,Task,Item,Recipe} from '../types';
import {recipes,eligible} from '../questions/recipe-factory';
import {distractors} from '../questions/distractors';
import {timelineContext} from '../questions/timeline';
import {shuffle,preflight} from '../engine';
import {difficultyStage} from '../learning/mastery';
import {selectExemplar} from '../questions/exemplar-selector';
import {questionPrompt} from '../questions/question-templates';
export function cooled(i:Item,recent:Task[]){return !recent.slice(-3).some(t=>t.items.some(x=>x.targetId===i.targetId||x.entityId===i.entityId||!!i.answerEntityId&&x.answerEntityId===i.answerEntityId))}
export function composeUnit(b:Bundle,m:Memory,tag='all',format='mixed',history:Task[]=[]):Task|undefined{
 const candidates=recipes(b).filter(r=>!r.diagnostic&&(tag==='all'?r.tag===undefined:r.tag===tag)&&(format==='mixed'||r.format===format)).flatMap(r=>eligible(b,r).filter(i=>i.targetId===m.id).map(i=>({r,i})));
 const stage=difficultyStage(m),objective=m.status==='triaged'||m.status==='learning'||!!m.selfReport&&(m.selfReport.remembered>m.selfReport.objectiveSuccesses*3+2||m.selfReport.objectiveFailures>m.selfReport.objectiveSuccesses);
 const recallEligible=!objective&&stage>=3&&!history.slice(-4).some(t=>t.recipe.format==='recall_reveal');
 const rank=(r:Recipe)=>r.format==='recall_reveal'?(recallEligible?0:5):r.format==='choice'?1:r.format==='categorize'?2:3;
 for(const {r,i} of shuffle(candidates).sort((a,c)=>rank(a.r)-rank(c.r))){
  const item={...i},recipe={...r},pool=eligible(b,r),exemplar=selectExemplar(b,i.entityId,r,m);if(r.cue==='image'){if(!exemplar)continue;item.image=exemplar.url;item.mediaId=exemplar.id}
  const wrong=distractors(b,item,pool,m,history),twin=r.format==='choice'&&stage>=3&&wrong.some(o=>(m.confusions[o.id]??0)>=1);
  const options=shuffle([{id:item.answerId,name:item.answer},...(twin?wrong.slice(0,1):wrong)]);
  const p=properties(b).find(p=>p.id===r.answerKey);recipe.prompt=questionPrompt(p??{id:r.answerKey,name:r.label??'Имя',learnable:true,valueKind:'text',cardinality:'one'},item.name,r.format,r.direction);
  if(r.answerKey==='created_by'&&r.cue==='image'&&!p?.promptTemplates?.forward)recipe.prompt='Кто автор этой работы?';
  if(r.answerKey==='identity')recipe.prompt='Кто или что на изображении?';
  const t:Task={id:crypto.randomUUID(),recipe,items:[item],options,reason:objective?'calibration':'due',pretest:m.attempts===0,discrimination:twin,difficultyStage:stage};
  if(preflight(t))return t;
 }
}
/** Bounded builder: main mode never creates non-due filler or duplicates. */
export function composeFeed(b:Bundle,memories:Memory[],tag='all',format='mixed',mode='daily',recent:Task[]=[],count=12):Task[]{
 const main=mode!=='practice',out:Task[]=[];
 if(['timeline','sort','missing'].includes(format)){
  for(const r of recipes(b).filter(r=>r.format===format&&(tag==='all'?r.tag===undefined:r.tag===tag))){const pool=eligible(b,r),seen=new Set<number>(),items=shuffle(pool).filter(i=>{if(i.year===undefined||seen.has(i.year))return false;seen.add(i.year);return true}).slice(0,4);if(format==='timeline'?items.length<1:items.length<3)continue;
   const t:Task={id:crypto.randomUUID(),recipe:{...r,prompt:questionPrompt(properties(b).find(p=>p.id===r.answerKey),items[0].name,r.format,r.direction)},items:format==='timeline'?[items[0]]:items,options:shuffle(items.map(i=>({id:i.entityId,name:i.name}))),reason:'challenge'};
   if(format==='timeline')t.timeline=timelineContext(pool);if(format==='missing')t.sequence=[...items].sort((a,c)=>a.year!-c.year!).map((i,n)=>n===1?null:{name:i.name,entityId:i.entityId});if(preflight(t))out.push(t);if(out.length>=count)break;
  }return out;
 }
 for(const m of shuffle(memories.filter(m=>!m.legacyOf&&m.status!=='suspended'&&(!main||new Date(m.card.due).getTime()<=Date.now())))){
  if(out.length>=count)break;if(recent.some(t=>t.items.some(i=>i.targetId===m.id)))continue;
  const t=composeUnit(b,m,tag,format,[...recent,...out]);if(t){t.practice=mode==='practice'&&new Date(m.card.due).getTime()>Date.now();out.push(t)}
 }return out;
}
export function repairTask(original:Task,index:number,wrongChoices:string[]=[]):Task{
 const item=original.items[index]??original.items[0],wrong=original.options.filter(o=>wrongChoices.includes(o.id)&&o.id!==item.answerId),discrimination=wrong.length>0&&original.recipe.format!=='recall_reveal';
 const format=discrimination?'choice':original.recipe.format==='recall_reveal'&&original.options.length>=3?'choice':'recall_reveal';
 return {...original,id:crypto.randomUUID(),retryOf:original.id,reason:'retry',items:[item],repairChoices:wrongChoices,discrimination,pretest:false,practice:false,options:discrimination?shuffle([{id:item.answerId,name:item.answer},wrong[0]]):original.options,recipe:{...original.recipe,id:original.recipe.id+':repair',format,diagnostic:false,evidence:{level:'direct',fsrsEnabled:true,gradeCap:'good',... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}


```

### File: res://src/media/media-store.ts
```typescript
export const MEDIA_CACHE='engi-media-v1';
export const hashFromUrl=(url:string)=>/^engi-media:\/\/([a-f0-9]{64})$/.exec(url)?.[1];
export const mediaKey=(hash:string)=>new URL(`/__engi_media__/${hash}`,globalThis.location?.origin??'https://engi.invalid').href;
export const mediaStore={
 async has(hash:string){return !!(await (await caches.open(MEDIA_CACHE)).match(mediaKey(hash)))},
 async put(hash:string,blob:Blob){await (await caches.open(MEDIA_CACHE)).put(mediaKey(hash),new Response(blob,{headers:{'Content-Type':blob.type,'Content-Length':String(blob.size)}}))},
 async getBlob(hash:string){const response=await (await caches.open(MEDIA_CACHE)).match(mediaKey(hash));if(!response)throw Error('Локальное изображение отсутствует. Импортируйте пакет ещё раз.');return response.blob()},
 async createObjectUrl(hash:string){return URL.createObjectURL(await this.getBlob(hash))},
 async remove(hash:string){await (await caches.open(MEDIA_CACHE)).delete(mediaKey(hash))},
 async prewarm(urls:string[]){await Promise.allSettled([...new Set(urls.map(hashFromUrl).filter(Boolean))].map(async hash=>{const url=await this.createObjectUrl(hash!);const img=new Image();img.src=url;try{await img.decode()}finally{URL.revokeObjectURL(url)}}))}
};

```

### File: res://src/media/use-media-url.ts
```typescript
import {useEffect,useState} from 'react';
import {hashFromUrl,mediaStore} from './media-store';
export function useMediaUrl(source?:string){const [state,setState]=useState<{source?:string;url?:string;failed:boolean}>({failed:false});useEffect(()=>{let cancelled=false;let objectUrl:string|undefined;setState({source,failed:false});const hash=source?hashFromUrl(source):undefined;if(!hash){if(source&&(source.startsWith('http://')||source.startsWith('https://')||source.startsWith('blob:')||source... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

```

### File: res://src/pwa/update-manager.ts
```typescript
import {registerSW} from 'virtual:pwa-register';
let update:((reload?:boolean)=>Promise<void>)|undefined;
let registration:ServiceWorkerRegistration|undefined;
export async function checkUpdates(){if(registration&&navigator.onLine)await registration.update()}
export function registerUpdates(onUpdate:()=>void,onOfflineReady:()=>void){update=registerSW({onNeedRefresh:onUpdate,onOfflineReady,onRegisteredSW:(_url,r)=>{registration=r;if(r)checkUpdates().catch(()=>{})},onRegisterError:e=>console.warn('Offline shell registration:',e)});const check=()=>{if(document.visibilityState==='visible')checkUpdates().catch(()=>{})};document.addEventListener('visibilityc... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export async function applyUpdate(){await update?.(true)}

```

### File: res://src/services/backup-service.ts
```typescript
import {reconcileKnowledgeUnits} from '../db/learning-migration';
import {z} from 'zod';
import {db,type EngiDB} from '../db/engi-db';
import {APP_DB_VERSION} from '../db/migrations';
import {getBundle,putBundle,contentTables,emptyBundle} from '../db/repositories';
import {validateImport} from '../lib/engi/validate';
import type {Bundle} from '../lib/engi/types';
import {mediaStore,hashFromUrl} from '../media/media-store';
import {sha256,checkImage,MAX_MEDIA_BYTES} from './pack-format';
import {learningRow} from '../db/repositories';
import {manifestSchema} from './pack-format';
const date=z.union([z.string(),z.date()]).refine(x=>Number.isFinite(new Date(x).getTime()));
const count=z.number().int().nonnegative();
export const memorySchema=z.object({id:z.string().min(1).max(500),card:z.object({due:date,stability:z.number().finite().nonnegative(),difficulty:z.number().finite().min(0).max(10),elapsed_days:z.number().finite().nonnegative(),scheduled_days:z.number().finite().nonnegative(),reps:count,lapses:count,state:z.number().int().min(0).max(3),learning_steps:count,last_review:date.optional()}).passthrough(... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
const eventSchema=z.object({id:z.string().min(1).max(500),timestamp:z.string().refine(x=>Number.isFinite(new Date(x).getTime())),recipe:z.string(),level:z.string(),targetIds:z.array(z.string()).default([]),payload:z.unknown()});
const backupSchema=z.object({format:z.literal('engi-backup'),schemaVersion:z.union([z.literal(1),z.literal(2)]),appDbVersion:z.number().int().min(1).max(APP_DB_VERSION),exportedAt:z.string().datetime({offset:true}),learningState:z.array(z.object({id:z.string(),payload:memorySchema})),reviewEvents:z.array(eventSchema),installedPacks:z.array(manifestSchema.passthrough()),settings:z.record(z.unknown(... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
const userRow=(row:{origin?:string;userModified?:boolean})=>row.origin==='user'||row.userModified;
function encode(bytes:Uint8Array){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.slice(i,i+32768));return btoa(s)}
export async function exportBackup(d:EngiDB=db){
 await reconcileKnowledgeUnits(d);const data=await d.transaction('r',[...contentTables(d),d.learningState,d.reviewEvents,d.appMeta,d.targetMappings],async()=>{const b=await getBundle(d);const user:Bundle={...emptyBundle(),entities:b.entities.filter(userRow),facts:b.facts.filter(userRow),media:b.media.filter(userRow),tags:b.tags.filter(userRow),entityTags:b.entityTags.filter(userRow),properties:(b.... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 // Include reference dependencies so personal relations survive even before packs are reinstalled.
 const ids=new Set([...user.entities.map(e=>e.id),...user.facts.flatMap(f=>[f.entityId,f.valueEntityId??'']),...user.media.map(m=>m.entityId),...user.entityTags.map(t=>t.entityId)]);user.entities=b.entities.filter(e=>ids.has(e.id));const propertyIds=new Set(user.facts.map(f=>f.key));user.properties=(b.properties??[]).filter(p=>userRow(p)||propertyIds.has(p.id));const typeIds=new Set([...user.entit... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 return {format:'engi-backup' as const,schemaVersion:2,appDbVersion:APP_DB_VERSION,exportedAt:new Date().toISOString(),learningState:await d.learningState.toArray(),reviewEvents:await d.reviewEvents.orderBy('timestamp').toArray(),installedPacks:await d.installedPacks.toArray(),settings:Object.fromEntries((await d.appMeta.toArray()).map(r=>[r.key,r.value])),targetMappings:await d.targetMappings.toA... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 const userMedia:{hash:string;mime:string;data:string}[]=[];for(const m of data.userKnowledge.media){if(m.origin!=='user')continue;const hash=hashFromUrl(m.url);if(!hash||userMedia.some(x=>x.hash===hash))continue;const blob=await mediaStore.getBlob(hash);userMedia.push({hash,mime:blob.type,data:encode(new Uint8Array(await blob.arrayBuffer()))})}return {...data,userMedia};
}
export async function restoreBackup(input:unknown,d:EngiDB=db){const backup=backupSchema.parse(input);if(new Set(backup.learningState.map(r=>r.id)).size!==backup.learningState.length||new Set(backup.reviewEvents.map(e=>e.id)).size!==backup.reviewEvents.length)throw Error('Повтор ID в копии');for(const r of backup.learningState)if(r.id!==r.payload.id)throw Error('ID состояния не совпадает');
 const current=await getBundle(d);const knowledge=backup.schemaVersion===2&&backup.userKnowledge?validateImport(backup.userKnowledge,current,true):undefined;const restoredMedia=[];for(const m of backup.userMedia){if(m.data.length>Math.ceil(MAX_MEDIA_BYTES/3)*4+4)throw Error('Изображение в копии слишком большое');const blob=new Blob([Uint8Array.from(atob(m.data),c=>c.charCodeAt(0))],{type:m.mime});... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 await d.transaction('rw',[...contentTables(d),d.learningState,d.reviewEvents,d.appMeta,d.activeSessions,d.targetMappings],async()=>{if(knowledge)await putBundle(d,knowledge);if(backup.targetMappings.length)await d.targetMappings.bulkPut(backup.targetMappings);for(const r of backup.learningState)await d.learningState.put(learningRow(r.payload as any));for(const e of backup.reviewEvents){const old=... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export async function saveBackup(){const data=await exportBackup();const name=`engi-backup-${new Date().toISOString().slice(0,10)}.engi-backup`;const file=new File([JSON.stringify(data)],name,{type:'application/json'});let shared=false;if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'Резервная копия Энги'});shared=true}catch(e){if((e as Error).name==='AbortEr... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 if(!shared){const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}await db.appMeta.bulkPut([{key:'lastBackupAt',value:new Date().toISOString()},{key:'reviewsSinceBackup',value:0}])}


```

### File: res://src/services/knowledge-service.ts
```typescript
import {db,type EngiDB} from '../db/engi-db';
import {contentTables,getBundle,putBundle} from '../db/repositories';
import {validateImport,propertySchema,typeSchema} from '../lib/engi/validate';
import {factValue,trusted} from '../lib/engi/knowledge/properties';
import type {Bundle,Entity,Fact,PropertyDefinition,EntityTypeDefinition,Tag,Media} from '../lib/engi/types';
import {sha256,checkImage,MAX_MEDIA_BYTES} from './pack-format';
import {mediaStore} from '../media/media-store';
import {upstreamFingerprint,type ConflictTable} from '../lib/engi/knowledge/conflicts';
export const newId=()=>`user.${crypto.randomUUID()}`;
const owned=<T extends object>(row:T)=>({...row,userModified:true,origin:('origin' in row?(row as any).origin:undefined)??'user'});
export async function saveKnowledge(delta:Partial<Bundle>,d:EngiDB=db){
 return d.transaction('rw',[...contentTables(d),d.learningState,d.activeSessions],async()=>{
  const current=await getBundle(d);const input={entities:[],facts:[],media:[],tags:[],entityTags:[],properties:[],entityTypes:[],missing:[],unresolved:[],...delta};
  for(const key of ['entities','facts','media','tags','entityTags','properties','entityTypes'] as const)(input as any)[key]=(input[key]??[]).map(owned);
  const clean=validateImport(input,current,true);
  // Validate final graph as well: changing object type may invalidate existing relations.
  const final={...current};for(const key of ['entities','facts','media','tags','properties','entityTypes'] as const)(final as any)[key]=[...new Map([...(current[key]??[]),...(clean[key]??[])].map(row=>[row.id,row])).values()];
  validateImport(final,{entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]},true);
  for(const f of clean.facts){const old=current.facts.find(x=>x.id===f.id);if(old&&factValue(old)!==factValue(f)){const rows=await d.learningState.filter(r=>(r.id.startsWith(`fact:${f.id}:`)||r.id.startsWith(`ku:fact:${f.id}:`))).primaryKeys();await d.learningState.bulkDelete(rows)}}
  for(const p of clean.properties??[]){const old=current.properties?.find(x=>x.id===p.id);if(old&&old.cardinality!==p.cardinality){/* Semantics change affects generation, historical states remain. */}}
  await putBundle(d,clean);const active=await d.activeSessions.where('status').equals('active').toArray();for(const s of active)await d.activeSessions.update(s.id,{status:'completed'});return clean;
 });
}
export async function saveEntity(entity:Entity,facts:Fact[],tagIds:string[],d:EngiDB=db){const existing=await getBundle(d);const assignments=existing.entityTags.filter(t=>t.entityId===entity.id);const entityTags=[...assignments.filter(t=>!tagIds.includes(t.tagId)).map(t=>({...t,archived:true})),...tagIds.map(tagId=>({...assignments.find(t=>t.tagId===tagId),entityId:entity.id,tagId,archived:false})... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export async function archiveEntity(id:string,d:EngiDB=db){const b=await getBundle(d);const e=b.entities.find(e=>e.id===id);if(!e)throw Error('Объект не найден');return saveKnowledge({entities:[{...e,archived:true}],facts:b.facts.filter(f=>f.entityId===id).map(f=>({...f,archived:true}))},d)}
export const saveProperty=(p:PropertyDefinition,d:EngiDB=db)=>saveKnowledge({properties:[propertySchema.parse(p)]},d);
export const saveEntityType=(t:EntityTypeDefinition,d:EngiDB=db)=>saveKnowledge({entityTypes:[typeSchema.parse(t)]},d);
export const saveTag=(t:Tag,d:EngiDB=db)=>saveKnowledge({tags:[t]},d);
export async function uploadImage(entityId:string,file:Blob,role='primary',d:EngiDB=db){if(file.size>MAX_MEDIA_BYTES)throw Error('Изображение больше 16 МБ');const mime=file.type;if(!['image/webp','image/jpeg','image/png'].includes(mime))throw Error('Выберите PNG, JPEG или WebP');await checkImage(file,mime);const hash=await sha256(file);await mediaStore.put(hash,file);const row:Media={id:newId(),en... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export function conflicts(b:Bundle){const groups=new Map<string,Fact[]>();for(const f of b.facts.filter(trusted)){const key=JSON.stringify([f.entityId,f.key]);groups.set(key,[...groups.get(key)??[],f])}return [...groups.values()].filter(g=>b.properties?.find(p=>p.id===g[0].key)?.cardinality!=='many'&&new Set(g.map(factValue)).size>1).flat()}

export async function resolvePackConflict(table:ConflictTable,id:string,choice:'mine'|'pack',d:EngiDB=db){
 return d.transaction('rw',[...contentTables(d),d.learningState,d.activeSessions],async()=>{
  const b=await getBundle(d),tables={entities:d.entities,facts:d.facts,media:d.media,tags:d.tags,properties:d.propertyDefinitions,entityTypes:d.entityTypes},store=tables[table];
  if(!store||!['mine','pack'].includes(choice))throw Error('Выберите версию для сохранения');
  const old=(await store.get(id)) as any;if(!old?.upstreamConflict||!old.upstreamValue)throw Error('Расхождение уже разрешено');
  const upstream=old.upstreamValue;if(upstream.id!==id)throw Error('Версия пакета относится к другому объекту');
  const pack=old.originPackId?await d.installedPacks.get(old.originPackId):undefined;
  const next=choice==='mine'?{...old,upstreamConflict:false,upstreamValue:undefined,upstreamAcknowledged:upstreamFingerprint(upstream),userModified:true}:
   {...upstream,origin:'pack',originPackId:old.originPackId,originPackVersion:pack?.packVersion??old.originPackVersion,userModified:false,upstreamConflict:false,upstreamValue:undefined,upstreamAcknowledged:undefined};
  const clean=validateImport({entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],[table]:[next]},b,true);
  const final={...b,[table]:[...(b[table]??[]).filter((row:any)=>row.id!==id),...(clean[table]??[])]};
  validateImport(final,{entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]},true);
  if(table==='facts'&&factValue(old)!==factValue(next))await d.learningState.bulkDelete(await d.learningState.filter(r=>(r.id.startsWith(`fact:${id}:`)||r.id.startsWith(`ku:fact:${id}:`))).primaryKeys());
  await putBundle(d,clean);await d.activeSessions.where('status').equals('active').modify({status:'completed'});return next;
 });
}

export async function archiveTag(id:string,d:EngiDB=db){const b=await getBundle(d);const t=b.tags.find(x=>x.id===id);if(!t)throw Error('Колода не найдена');return saveKnowledge({tags:[{...t,archived:true}]},d)}
export async function attachEntityTag(entityId:string,tagId:string,d:EngiDB=db){return saveKnowledge({entityTags:[{entityId,tagId,archived:false}]},d)}
export async function detachEntityTag(entityId:string,tagId:string,d:EngiDB=db){return saveKnowledge({entityTags:[{entityId,tagId,archived:true}]},d)}


```

### File: res://src/services/learning-service.ts
```typescript
import {db,type EngiDB} from '../db/engi-db';
import {getBundle,learningRow,contentTables} from '../db/repositories';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {triagedMemory} from '../lib/engi/learning/bootstrap';
export async function setUnitSuspended(id:string,suspend:boolean,d:EngiDB=db){
 await d.transaction('rw',[...contentTables(d),d.learningState,d.activeSessions],async()=>{
  const item=canonicalTargets(await getBundle(d)).find(i=>i.targetId===id);if(!item)throw Error('Знание больше не доступно');
  const old=await d.learningState.get(id),m=old?.payload??triagedMemory(item,'red','',0);
  if(suspend){if(m.status!=='suspended')m.suspendedFrom=m.status??'review';m.status='suspended'}else {m.status=m.suspendedFrom??(m.attempts>0?(m.bootstrap?'learning':'review'):'triaged');delete m.suspendedFrom}
  if(!suspend)m.card.due=new Date();await d.learningState.put(learningRow(m));
  await d.activeSessions.where('status').equals('active').modify({status:'completed'});
 });
}
export async function resetLearningProgress(d:EngiDB=db){
 await d.transaction('rw',[d.learningState,d.reviewEvents,d.activeSessions,d.targetMappings,d.appMeta],async()=>{
  await d.learningState.clear();
  await d.reviewEvents.clear();
  await d.activeSessions.clear();
  await d.targetMappings.clear();
  await d.appMeta.bulkDelete(['dailyLearning','newLearning','introducedEntities','reviewsSinceBackup']);
 });
}

```

### File: res://src/services/pack-format.ts
```typescript
import {z} from 'zod';
export const MAX_PACK_BYTES=512*1024*1024;
export const MAX_MEDIA_BYTES=16*1024*1024;
export const allowedMimes=['image/webp','image/jpeg','image/png'] as const;
export function safePath(path:string){return path.length<=200&&!path.startsWith('/')&&!path.includes('\\')&&!path.includes(':')&&!path.split('/').some(s=>!s||s==='.'||s==='..')&&/^[A-Za-z0-9._/-]+$/.test(path)}
export const manifestSchema=z.object({format:z.literal('engi-pack'),schemaVersion:z.union([z.literal(1),z.literal(2)]),packId:z.string().regex(/^[A-Za-z0-9._-]{1,150}$/),packVersion:z.number().int().positive(),name:z.string().min(1).max(200),createdAt:z.string().datetime({offset:true}),files:z.array(z.object({path:z.string().refine(p=>safePath(p)&&p.startsWith('media/')),bytes:z.number().int().pos... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export async function sha256(blob:Blob){const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}
export async function checkImage(blob:Blob,mime:string){const bytes=new Uint8Array(await blob.slice(0,16).arrayBuffer());const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

```

### File: res://src/services/pack-service.ts
```typescript
import {ZipReader,BlobReader,BlobWriter,TextWriter,configure,type Entry} from '@zip.js/zip.js';
import {db,type EngiDB,type PackRow} from '../db/engi-db';
import {factValue} from '../lib/engi/knowledge/properties';
import {upstreamFingerprint} from '../lib/engi/knowledge/conflicts';
import {getBundle,putBundle,contentTables} from '../db/repositories';
import {validateImport} from '../lib/engi/validate';
import {mediaStore} from '../media/media-store';
import {manifestSchema,safePath,sha256,checkImage,MAX_PACK_BYTES,MAX_MEDIA_BYTES} from './pack-format';
configure({useWebWorkers:typeof Worker!=='undefined'});
const jsonEntry=async(e:Entry|undefined)=>{if(!e||e.directory||e.uncompressedSize>16*1024*1024)throw Error('Нет JSON или он слишком большой');return JSON.parse(await e.getData!(new TextWriter(),{checkSignature:true}))};
export async function importPackDirect(file:Blob,onProgress:(s:string)=>void=()=>{},d:EngiDB=db){
 if(file.size>MAX_PACK_BYTES)throw Error('Пакет больше 512 МБ. Разделите его на несколько.');const reader=new ZipReader(new BlobReader(file));
 try{onProgress('Проверяем структуру пакета…');const entries=await reader.getEntries();const byPath=new Map<string,Entry>();let total=0;if(entries.length>50010)throw Error('Слишком много файлов');
 for(const e of entries){const path=e.directory?e.filename.replace(/\/$/,''):e.filename;if(!safePath(path)||byPath.has(e.filename)||e.encrypted)throw Error('Недопустимый ZIP path, дубль или шифрование');byPath.set(e.filename,e);if(!e.directory){total+=e.uncompressedSize;if(total>MAX_PACK_BYTES||e.uncompressedSize>16*1024*1024||e.uncompressedSize/Math.max(e.compressedSize,1)>100)throw Error('Превыш... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 const manifest=manifestSchema.parse(await jsonEntry(byPath.get('manifest.json')));const raw=await jsonEntry(byPath.get('bundle.json'));const files=new Map(manifest.files.map(f=>[f.path,f]));if(files.size!==manifest.files.length)throw Error('Повтор пути в manifest');for(const e of entries)if(!e.directory&&!['manifest.json','bundle.json'].includes(e.filename)&&!files.has(e.filename))throw Error('Не... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 if(manifest.schemaVersion===1&&((raw.properties?.length??0)||(raw.entityTypes?.length??0)))throw Error('Новые поля требуют schemaVersion 2');const current=await getBundle(d);const bundle=validateImport(raw,current,true);for(const f of bundle.facts)if(!f.source.url)throw Error('Факты в пакете должны иметь HTTPS-источник');for(const m of bundle.media){const f=files.get(m.url);if(!f)throw Error('Каж... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 let n=0;for(const f of manifest.files){const e=byPath.get(f.path);if(!e||e.directory||e.uncompressedSize!==f.bytes||f.bytes>MAX_MEDIA_BYTES)throw Error('Размер файла не совпадает с manifest');onProgress(`Проверяем изображения ${++n} / ${manifest.files.length}`);const blob=await e.getData!(new BlobWriter(f.mime),{checkSignature:true});if(blob.size!==f.bytes||await sha256(blob)!==f.sha256)throw Err... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 const estimate=await globalThis.navigator?.storage?.estimate?.();const missing=[];for(const f of manifest.files)if(!await mediaStore.has(f.sha256))missing.push(f);const needed=missing.reduce((v,f)=>v+f.bytes,0);if(estimate?.quota&&estimate.quota-(estimate.usage??0)<needed*1.15+1024*1024)throw Error('Недостаточно места. Освободите память или импортируйте меньший пакет.');
 n=0;for(const f of missing){onProgress(`Сохраняем изображения ${++n} / ${missing.length}`);const entry=byPath.get(f.path)!;if(entry.directory)throw Error('Изображение не файл');const blob=await entry.getData!(new BlobWriter(f.mime),{checkSignature:true});await mediaStore.put(f.sha256,blob);}
 onProgress('Сохраняем набор…');await d.transaction('rw',[...contentTables(d),d.activeSessions,d.learningState],async()=>{const existing=await getBundle(d);validateImport(bundle,existing,true);const prior=await d.installedPacks.get(manifest.packId);if(prior&&manifest.packVersion<prior.packVersion)throw Error('Пакет старее установленной версии');const others=(await d.installedPacks.toArray()).filte... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 // A shared released ID has one meaning across packs; never silently reassign it.
 for(const f of bundle.facts)if(others.some(p=>p.factIds.includes(f.id))){const old=existing.facts.find(x=>x.id===f.id);if(old&&!old.userModified&&factValue(old)!==factValue(f))throw Error('Общий факт конфликтует с другим пакетом')}
 // Preserve user overlays and tombstones; removed upstream rows are archived, never erase history.
 const merge=(rows:any[],oldRows:any[])=>rows.map(row=>{const old=oldRows.find(o=>o.id===row.id);if(old?.userModified||old?.origin==='user'){const incoming=upstreamFingerprint(row),differs=upstreamFingerprint(old)!==incoming,conflict=differs&&old.upstreamAcknowledged!==incoming;return {...old,upstreamConflict:conflict,upstreamValue:conflict?row:undefined}}return {...row,origin:'pack',originPackId:... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 const merged={...bundle};for(const key of ['entities','facts','media','tags','properties','entityTypes'] as const)(merged as any)[key]=merge(bundle[key]??[],existing[key]??[]);
 merged.entityTags=bundle.entityTags.map(row=>{const old=existing.entityTags.find(o=>o.entityId===row.entityId&&o.tagId===row.tagId);return old?.userModified?old:{...row,origin:'pack',originPackId:manifest.packId,originPackVersion:manifest.packVersion}});
 if(prior){for(const [key,table] of [['entityIds',d.entities],['factIds',d.facts],['mediaIds',d.media],['tagIds',d.tags]] as const){const nextIds=new Set((key==='entityIds'?bundle.entities:key==='factIds'?bundle.facts:key==='mediaIds'?bundle.media:bundle.tags).map(x=>x.id));for(const id of prior[key].filter(id=>!nextIds.has(id)&&!others.some(p=>p[key].includes(id)))){const old=await table.get(id);... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 for(const f of merged.facts){const old=existing.facts.find(x=>x.id===f.id);if(old&&factValue(old)!==factValue(f)){const keys=await d.learningState.filter(r=>(r.id.startsWith(`fact:${f.id}:`)||r.id.startsWith(`ku:fact:${f.id}:`))).primaryKeys();await d.learningState.bulkDelete(keys)}}await putBundle(d,merged);const row:PackRow={...manifest,entityIds:bundle.entities.map(x=>x.id),factIds:bundle.fact... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 }finally{await reader.close()}
}

export async function importPack(file:Blob,onProgress:(s:string)=>void=()=>{},d:EngiDB=db,signal?:AbortSignal){
 if(d!==db||typeof Worker==='undefined')return importPackDirect(file,onProgress,d);
 return new Promise<Awaited<ReturnType<typeof importPackDirect>>>((resolve,reject)=>{const worker=new Worker(new URL('./pack-worker.ts',import.meta.url),{type:'module'});let committing=false;const done=()=>{worker.terminate();signal?.removeEventListener('abort',abort)};const abort=()=>{if(committing){onProgress('Завершаем сохранение набора…');return}done();reject(new DOMException('Импорт отменён',... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}


```

### File: res://src/services/pack-worker.ts
```typescript
import {importPackDirect} from './pack-service';
self.onmessage=async(e:MessageEvent<Blob>)=>{try{const result=await importPackDirect(e.data,progress=>self.postMessage({progress}));self.postMessage({result})}catch(e){self.postMessage({error:(e as Error).message})}};

```

### File: res://src/services/review-commit.ts
```typescript
import {reviewLearning} from '../lib/engi/learning/bootstrap';
import type {EngiDB,SessionRow,ReviewEventRow} from '../db/engi-db';
import {learningRow} from '../db/repositories';
import {assess} from '../lib/engi/engine';
import {repairTask} from '../lib/engi/session/composer';
import {isDiscrete} from '../lib/engi/questions/timeline';
import type {Task,Memory} from '../lib/engi/types';
import {localDay} from '../lib/engi/knowledge/motivation';

export type AnswerInput={sessionId:string;taskId:string;answer:unknown;confidence?:string;latencyMs?:number};
function calibrate(m:Memory,t:Task,correct:boolean){
 const c=m.selfReport??{remembered:0,missed:0,objectiveSuccesses:0,objectiveFailures:0};
 if(t.recipe.format==='recall_reveal')correct?c.remembered++:c.missed++;
 else if(isDiscrete(t))correct?c.objectiveSuccesses++:c.objectiveFailures++;
 m.selfReport=c;
}
/** Called inside the answer transaction; failed correction taps never enter here. */
export async function commitReview(d:EngiDB,session:SessionRow,task:Task,input:AnswerInput,attemptSequence:string[]){
 const discrete=isDiscrete(task),first=discrete?attemptSequence[0]:input.answer;
 const result=assess(task,first),wrongChoices=discrete?[...new Set(attemptSequence.slice(0,-1))]:[];
 const changes=[];const fsrsUpdated=new Set<string>();const stabilityTransitions:{targetId:string;before:number;after:number}[]=[];
 let isNewFailure=false;
 for(const evidence of result.evidence.filter(e=>e.level==='direct')){
  const old=await d.learningState.get(evidence.item.targetId);
  if(!old)continue;
  if(!old.payload.attempts&&!evidence.correct)isNewFailure=true;
  const latency=session.interaction?.firstAttemptLatencyMs??input.latencyMs??0;
  const applied=reviewLearning(old.payload,evidence.item,evidence.correct,task.recipe.format!=='recall_reveal',!!task.retryOf,!!task.practice,latency);
  const m=applied.memory;if(applied.fsrsUpdated)fsrsUpdated.add(m.id);
  if(evidence.item.mediaId)m.recentMediaIds=[...m.recentMediaIds??[],evidence.item.mediaId].slice(-3);
  const wrong=discrete?wrongChoices:(!evidence.correct&&task.recipe.format!=='recall_reveal'&&evidence.chosen?[evidence.chosen]:[]);
  for(const id of wrong)m.confusions[id]=(m.confusions[id]??0)+1;
  // Forced-correct completion is not a successful objective discrimination.
  if(evidence.correct&&discrete)for(const o of task.options)if(o.id!==evidence.item.answerId&&m.confusions[o.id]){const v=m.confusions[o.id]*.85;m.confusions[o.id]=v<.1?0:v}
  calibrate(m,task,evidence.correct);stabilityTransitions.push({targetId:m.id,before:old?.payload.card.stability??0,after:m.card.stability});
  const row=learningRow(m);await d.learningState.put(row);changes.push(row);
 }
 const confidence=['low','medium','high'].includes(input.confidence??'')?input.confidence!:'medium';
 const encoding=isNewFailure&&!task.retryOf&&!task.recipe.diagnostic;
 const feedback={...result,chosen:input.answer,items:task.items,nextReview:changes[0]?.payload.card.due,correctionComplete:discrete,encoding,repairResolved:!!task.retryOf&&result.score===1};
 const metadata={firstAttemptLatencyMs:session.interaction?.firstAttemptLatencyMs??input.latencyMs??0,earlyReveal:!!session.interaction?.earlyReveal,revealElapsedMs:session.interaction?.recallElapsedMs,difficultyStage:task.difficultyStage,practice:!!task.practice,repair:!!task.retryOf,attemptSequence,wrongChoices,attemptCount:discrete?attemptSequence.length:1,firstTryCorrect:result.score===1,stabi... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 const event:ReviewEventRow={id:task.id,timestamp:new Date().toISOString(),recipe:task.recipe.id,level:task.retryOf?'repair':task.practice?'practice':task.recipe.diagnostic?'diagnostic':task.recipe.evidence?.level??'direct',targetIds:task.items.map(i=>i.targetId),payload:{score:result.score,reason:task.reason,pretest:isNewFailure,selfReport:task.recipe.format==='recall_reveal',fsrsEnabled:fsrsUpda... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 if(session.feed&&!task.recipe.diagnostic&&!task.practice&&result.score<1&&!task.retryOf){const repair=repairTask(task,Math.max(0,result.evidence.findIndex(e=>!e.correct)),wrongChoices);
  repair.retryAfter=(session.completedCount??0)+4;session.repairQueue=[...(session.repairQueue??[]).filter(t=>t.items[0].targetId!==repair.items[0].targetId),repair].slice(-12);
 }
 await d.reviewEvents.add(event);session.results=[...session.results,result.score].slice(-100);session.updatedAt=event.timestamp;session.interaction=undefined;session.tasks=[task];session.currentPosition=0;await d.activeSessions.put(session);
 const counter=await d.appMeta.get('reviewsSinceBackup');await d.appMeta.put({key:'reviewsSinceBackup',value:(counter?.value??0)+1});
 let milestone:string|undefined;
 if(!task.recipe.diagnostic&&!task.practice&&!task.retryOf){const prior=(await d.appMeta.get('dailyLearning'))?.value,day=localDay(),daily=prior?.day===day?prior:{day,retrievals:0,stability30Gains:0};daily.retrievals++;
  const knownGains=new Set<string>(daily.gainTargetIds??[]),gainIds=stabilityTransitions.filter(t=>t.before<30&&t.after>=30&&!knownGains.has(t.targetId)).map(t=>t.targetId),gains=gainIds.length;
  daily.stability30Gains+=gains;daily.gainTargetIds=[...knownGains,...gainIds];
  if(daily.retrievals===15)milestone='Цель на сегодня выполнена ✓';else if(gains)milestone=`Ещё ${gains} знание закреплено на 30 дней`;
  await d.appMeta.put({key:'dailyLearning',value:daily});
 }
 return {pending:false as const,feedback,memories:changes,event,results:session.results,interaction:undefined,milestone};
}


```

### File: res://src/services/storage-health.ts
```typescript
import {db} from '../db/engi-db';
export async function storageHealth(){const [estimate,persisted,packs,reviews,last,counter]=await Promise.all([navigator.storage?.estimate?.(),navigator.storage?.persisted?.(),db.installedPacks.count(),db.reviewEvents.count(),db.appMeta.get('lastBackupAt'),db.appMeta.get('reviewsSinceBackup')]);return {usage:estimate?.usage??0,quota:estimate?.quota??0,persisted:!!persisted,packs,reviews,lastBackup... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
export async function protectStorage(){const result=await navigator.storage?.persist?.()??false;await db.appMeta.put({key:'persistentStorage',value:result});return result}

```

### File: res://src/services/trainer-service.ts
```typescript
import {db,type EngiDB,type SessionRow,type InteractionDraft} from '../db/engi-db';
import type {Familiarity} from '../lib/engi/types';
import {getSnapshot,getBundle,putBundle,contentTables,learningRow} from '../db/repositories';
import {saveEntity} from './knowledge-service';
import {validateImport} from '../lib/engi/validate';
import {commitReview,type AnswerInput} from './review-commit';
import {isDiscrete,discreteAnswer} from '../lib/engi/questions/timeline';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {pickFeed,dailyNewState} from '../lib/engi/session/candidate-pool';
import {triagedMemory,unitDue} from '../lib/engi/learning/bootstrap';

async function selectNext(d:EngiDB,s:SessionRow){
 const b=await getBundle(d),memories=(await d.learningState.toArray()).filter(r=>!r.payload.legacyOf).map(r=>r.payload),daily=dailyNewState((await d.appMeta.get('newLearning'))?.value),introduced=(await d.appMeta.get('introducedEntities'))?.value??[];
 const next=pickFeed(b,memories,s,daily,introduced);s.tasks=next.task?[next.task]:[];s.currentPosition=0;s.intro=next.intro;s.exhausted=!!next.exhausted;s.interaction=undefined;s.updatedAt=new Date().toISOString();await d.activeSessions.put(s);return s;
}
const sessionTables=(d:EngiDB)=>[...contentTables(d),d.learningState,d.activeSessions,d.reviewEvents,d.appMeta];
export function createTrainerService(d:EngiDB){return {
 getSnapshot:()=>getSnapshot(d),
 async preloadMedia(id:string){const s=await d.activeSessions.get(id);if(!s)return [];const b=await getBundle(d),rows=await d.learningState.toArray(),ids=canonicalTargets(b,s.tag).filter(i=>rows.some(r=>r.id===i.targetId&&unitDue(r.payload,s.id,s.completedCount??0))).slice(0,4).map(i=>i.entityId);return b.media.filter(m=>ids.includes(m.entityId)&&!m.archived&&m.learningExemplar!==false).slice(0,4)... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 async startFeed(tag='all',format='mixed',mode='daily'){
  if(!['mixed','choice','recall_reveal','match','categorize','timeline','sort','missing'].includes(format))throw Error('Выберите доступный формат без ввода текста');
  await getSnapshot(d);const now=new Date().toISOString(),s:SessionRow={id:crypto.randomUUID(),tasks:[],currentPosition:0,results:[],mode,createdAt:now,updatedAt:now,status:'active',timeLeft:90,feed:true,tag,format,completedCount:0,ordinaryCount:0,cooldown:[],repairQueue:[],diagnosticSeen:[]};
  return d.transaction('rw',sessionTables(d),async()=>{await d.activeSessions.where('status').equals('active').modify({status:'completed'});return selectNext(d,s)});
 },
 async advanceFeed(id:string,skip=false,expectedTaskId?:string){return d.transaction('rw',sessionTables(d),async()=>{
  const s=await d.activeSessions.get(id);if(!s?.feed||s.status!=='active')throw Error('Лента не найдена');const task=s.tasks[s.currentPosition];if(expectedTaskId&&task?.id!==expectedTaskId)return s;
  if(s.intro)throw Error('Сначала завершите знакомство');
  if(task){if(!skip&&!await d.reviewEvents.get(task.id))throw Error('Сначала завершите карточку');s.cooldown=[...s.cooldown??[],task].slice(-30);s.completedCount=(s.completedCount??0)+1;if(!skip&&!task.recipe.diagnostic&&!task.retryOf)s.ordinaryCount=(s.ordinaryCount??0)+1;if(task.recipe.diagnostic)s.diagnosticSeen=[...s.diagnosticSeen??[],task.recipe.id]}
  return selectNext(d,s);
 })},
 async openMore(id:string,practice=false){return d.transaction('rw',sessionTables(d),async()=>{const s=await d.activeSessions.get(id);if(!s||s.status!=='active'||!s.exhausted)throw Error('Сначала завершите текущую практику');if(practice){s.mode='practice';s.format='mixed'}else{const daily=dailyNewState((await d.appMeta.get('newLearning'))?.value);daily.extraBudget+=2;await d.appMeta.put({key:'newL... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 async saveIntroSelection(id:string,unitId:string,color:Familiarity){return d.transaction('rw',d.activeSessions,async()=>{const s=await d.activeSessions.get(id);if(!s?.intro||!s.intro.unitIds.includes(unitId)||!['red','orange','yellow','green','suspended'].includes(color))throw Error('Свойство больше не доступно');s.intro.selections[unitId]=color;await d.activeSessions.put(s);return s})},
 async saveIntroSelections(id:string,selections:Record<string,Familiarity>){return d.transaction('rw',d.activeSessions,async()=>{const s=await d.activeSessions.get(id);if(!s?.intro)throw Error('Знакомство уже завершено');for(const [unitId,color] of Object.entries(selections)){if(s.intro.unitIds.includes(unitId)&&['red','orange','yellow','green','suspended'].includes(color))s.intro.selections[unitI... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 async completeIntro(id:string){return d.transaction('rw',sessionTables(d),async()=>{
  const s=await d.activeSessions.get(id);if(!s?.intro||s.status!=='active')throw Error('Знакомство уже завершено');const intro=s.intro,b=await getBundle(d),units=canonicalTargets(b).filter(i=>intro.unitIds.includes(i.targetId));
  for(const i of units)if(!await d.learningState.get(i.targetId))await d.learningState.put(learningRow(triagedMemory(i,intro.selections[i.targetId]??'red',s.id,(s.completedCount??0)+1)));
  const introduced=new Set<string>((await d.appMeta.get('introducedEntities'))?.value??[]);introduced.add(intro.entityId);await d.appMeta.put({key:'introducedEntities',value:[...introduced]});
  if(!intro.newProperty){const daily=dailyNewState((await d.appMeta.get('newLearning'))?.value);daily.introducedEntityIds=[...new Set([...daily.introducedEntityIds,intro.entityId])];await d.appMeta.put({key:'newLearning',value:daily})}
  const item=units[0];if(item)s.cooldown=[...s.cooldown??[],{id:'intro:'+crypto.randomUUID(),items:[item],options:[],reason:'intro',recipe:{id:'intro',format:'choice' as const,cue:'name' as const,answerKey:'identity',memoryKey:'intro',diagnostic:false}}].slice(-30);
  s.completedCount=(s.completedCount??0)+1;s.intro=undefined;return selectNext(d,s);
 })},
 async getResumableSession(){const s=(await d.activeSessions.where('status').equals('active').sortBy('updatedAt')).at(-1);if(!s)return;if(!s.feed){await d.activeSessions.update(s.id,{status:'completed'});return}return s},
 async getFeedback(taskId:string){return (await d.reviewEvents.get(taskId))?.payload.feedback??null},
 async saveInteraction(sessionId:string,taskId:string,delta:Partial<Omit<InteractionDraft,'taskId'|'attemptSequence'>>){return d.transaction('rw',d.activeSessions,d.reviewEvents,async()=>{
  const s=await d.activeSessions.get(sessionId),t=s?.tasks[s.currentPosition];if(!s||s.status!=='active'||!t||t.id!==taskId)throw Error('Карточка уже сменилась');if(await d.reviewEvents.get(taskId))return s.interaction;
  const draft:InteractionDraft=s.interaction?.taskId===taskId?{...s.interaction}:{taskId,attemptSequence:[]};
  if(delta.recallElapsedMs!==undefined){if(!Number.isFinite(delta.recallElapsedMs))throw Error('Некорректное время');draft.recallElapsedMs=Math.min(5000,Math.max(draft.recallElapsedMs??0,delta.recallElapsedMs))}
  if(delta.revealed){if(t.recipe.format!=='recall_reveal'||(draft.recallElapsedMs??0)<5000&&!delta.earlyReveal)throw Error('Ещё есть время вспомнить');draft.revealed=true;draft.earlyReveal=!!delta.earlyReveal}
  if(delta.timelineValue!==undefined){const scale=t.timeline;if(!scale||!Number.isInteger(delta.timelineValue)||delta.timelineValue<scale.min||delta.timelineValue>scale.max)throw Error('Значение вне шкалы');draft.timelineValue=delta.timelineValue}
  if(delta.sortOrder){if(delta.sortOrder.length!==t.items.length||new Set(delta.sortOrder).size!==t.items.length||!t.items.every(i=>delta.sortOrder!.includes(i.entityId)))throw Error('Некорректный порядок');draft.sortOrder=delta.sortOrder}
  s.interaction=draft;s.updatedAt=new Date().toISOString();await d.activeSessions.put(s);return draft;
 })},
 async answer(input:AnswerInput){return d.transaction('rw',sessionTables(d),async()=>{
  const duplicate=await d.reviewEvents.get(input.taskId);if(duplicate)return {pending:false as const,feedback:duplicate.payload.feedback,memories:await d.learningState.bulkGet(duplicate.targetIds),event:duplicate,results:(await d.activeSessions.get(input.sessionId))?.results??[],interaction:undefined,milestone:undefined};
  const session=await d.activeSessions.get(input.sessionId),task=session?.tasks[session.currentPosition];if(!task||!session||session.status!=='active'||task.id!==input.taskId)throw Error('Текущая карточка не найдена');
  if(!task.recipe.diagnostic){const old=await d.learningState.get(task.items[0].targetId);if(!old||old.payload.status==='suspended')throw Error('Это знание не участвует в практике');const due=unitDue(old.payload,session.id,session.completedCount??0);if(!due&&!task.retryOf&&session.mode!=='practice')throw Error('Пока не пора повторять это знание');task.practice=session.mode==='practice'&&!due&&!tas... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
  let attempts:string[]=[];
  if(isDiscrete(task)){
   if(typeof input.answer!=='string'||!task.options.some(o=>o.id===input.answer))throw Error('Выберите один из вариантов');
   const draft=session.interaction?.taskId===task.id?session.interaction:{taskId:task.id,attemptSequence:[]};draft.firstAttemptLatencyMs??=Math.min(3600000,Math.max(0,input.latencyMs??0));if(!draft.attemptSequence.includes(input.answer))draft.attemptSequence.push(input.answer);attempts=draft.attemptSequence;
   session.interaction=draft;
   if(input.answer!==discreteAnswer(task)){session.updatedAt=new Date().toISOString();await d.activeSessions.put(session);return {pending:true as const,feedback:null,memories:[],event:undefined,results:session.results,interaction:draft,milestone:undefined}}
  }
  if(task.recipe.format==='recall_reveal'&&(typeof input.answer!=='boolean'||!session.interaction?.revealed))throw Error('Сначала откройте ответ');
  if(task.recipe.format==='timeline'){const scale=task.timeline,value=(input.answer as Record<string,unknown>)?.[task.items[0].entityId];if(!scale||!Number.isInteger(value)||Number(value)<scale.min||Number(value)>scale.max)throw Error('Подтвердите значение на шкале')}
  return commitReview(d,session,task,input,attempts);
 })},
 async importBundle(input:unknown){return d.transaction('rw',contentTables(d),async()=>{const b=validateImport(input,await getBundle(d));if(b.media.some(m=>!m.url.startsWith('engi-media://')))throw Error('Изображения нужны внутри пакета .engi');await putBundle(d,b);return {entities:b.entities.length,facts:b.facts.length,excluded:b.facts.filter(f=>!['direct','verified','user_confirmed'].includes(f.... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 async editEntity(input:{entityId:string;name:string;facts:any[]}){const b=await getBundle(d),e=b.entities.find(e=>e.id===input.entityId);if(!e)throw Error('Объект не найден');const facts=input.facts.map(change=>{const f=b.facts.find(x=>x.id===change.id);if(!f)throw Error('Факт не найден');const next={...f,...change};if(f.valueKind==='date'&&change.year!==undefined&&String(change.year)!==f.dateSta... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 async reportQuestion(taskId:string,reason:string){if(!reason.trim())throw Error('Укажите причину');await d.reviewEvents.add({id:crypto.randomUUID(),timestamp:new Date().toISOString(),recipe:'report',level:'report',targetIds:[],payload:{taskId,reason:reason.slice(0,1000)}})},
 async resolveReport(reportId:string){return d.transaction('rw',d.reviewEvents,async()=>{if(!(await d.reviewEvents.get(reportId)))throw Error('Сообщение не найдено');if(!(await d.reviewEvents.get('resolved:'+reportId)))await d.reviewEvents.add({id:'resolved:'+reportId,timestamp:new Date().toISOString(),recipe:'report_resolved',level:'report',targetIds:[],payload:{reportId}})})}
}}
export const trainerService=createTrainerService(db);


```

### File: res://tests/adaptive22.test.ts
```typescript
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createEmptyCard,Rating,State,type Card} from 'ts-fsrs';
import type {Bundle,Memory,Recipe,Snapshot} from '../src/lib/engi/types';
import {allowedMedia,selectExemplar} from '../src/lib/engi/questions/exemplar-selector';
import {difficultyStage} from '../src/lib/engi/learning/mastery';
import {DAY,triagedMemory,reviewLearning} from '../src/lib/engi/learning/bootstrap';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {hydrate,scheduler} from '../src/lib/engi/engine';
import {progress} from '../src/lib/engi/knowledge/progress';
import {todayLearning} from '../src/lib/engi/knowledge/motivation';
import {EngiDB} from '../src/db/engi-db';
import {learningRow} from '../src/db/repositories';
import {saveKnowledge} from '../src/services/knowledge-service';
import {setUnitSuspended} from '../src/services/learning-service';

function fixture():Bundle{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 for(let i=0;i<4;i++){
  b.entities.push({id:'p'+i,type:'person',name:'Человек '+i,aliases:[],externalIds:{}},{id:'a'+i,type:'organization',name:'Партия '+i,aliases:[],externalIds:{}});
  b.facts.push({id:'f'+i,entityId:'p'+i,key:'party',valueKind:'entity',valueEntityId:'a'+i,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}});
 }
 return b;
}
const recipe:Recipe={id:'image-choice',format:'choice',cue:'image',answerKey:'party',memoryKey:'party',diagnostic:false};
const media=(id:string,extra:Partial<Bundle['media'][number]>={})=>({id,entityId:'p0',role:'portrait',url:'engi-media://'+'a'.repeat(64),license:'Личное изображение',...extra});
function mature(id:string,stability=100,now=new Date()):Memory{
 return {id,status:'review',card:{...createEmptyCard<Card>(now),state:State.Review,stability,difficulty:5,reps:8,last_review:now,due:new Date(now.getTime()+DAY)},attempts:8,correct:8,confusions:{},firstSuccessAt:now.toISOString(),lastOutcome:true,latencyEmaMs:1000};
}

test('exemplar rotation avoids each of the last three views when a fourth is available',()=>{
 const b=fixture();b.media=['a','b','c','d'].map(id=>media(id));const m=mature('visual');m.recentMediaIds=['a','b','c'];
 for(let n=0;n<8;n++){const recent=m.recentMediaIds.slice(-3),selected=selectExemplar(b,'p0',recipe,m)!;assert(selected);assert(!recent.includes(selected.id));m.recentMediaIds.push(selected.id)}
 assert.equal(m.recentMediaIds[3],'d');assert.equal(new Set(m.recentMediaIds.slice(3,7)).size,4);
});

test('learning images exclude memes, archived images, opted-out exemplars and wrong entity roles',()=>{
 const b=fixture();b.media=[media('meme',{role:'meme'}),media('archived',{archived:true}),media('disabled',{learningExemplar:false}),media('other',{entityId:'p1'}),media('wrong-role',{role:'artwork'}),media('valid')];
 assert.deepEqual(allowedMedia(b,'p0',recipe).map(m=>m.id),['valid']);assert.equal(selectExemplar(b,'p0',recipe)!.id,'valid');
 b.entities[0].type='artwork';b.media.push(media('painting',{role:'painting'}));assert.deepEqual(allowedMedia(b,'p0',recipe).map(m=>m.id),['wrong-role','painting']);
});

test('small exemplar pools fall back safely without immediate repetition whenever possible',()=>{
 const b=fixture(),m=mature('visual');b.media=[media('a'),media('b')];m.recentMediaIds=['a','b','a'];assert.equal(selectExemplar(b,'p0',recipe,m)!.id,'b');
 b.media=[media('a')];assert.equal(selectExemplar(b,'p0',recipe,m)!.id,'a');b.media=[];assert.equal(selectExemplar(b,'p0',recipe,m),undefined);
});

test('presentation stages grow with stable recall and fall after failure or slow retrieval',()=>{
 for(const [stability,expected] of [[3,1],[14,2],[45,3],[100,4]] as const)assert.equal(difficultyStage(mature('m',stability)),expected);
 const strong=mature('m'),before=structuredClone(strong);assert.equal(difficultyStage({...strong,lastOutcome:false}),1);assert.equal(difficultyStage({...strong,status:'learning'}),1);assert.equal(difficultyStage({...strong,latencyEmaMs:7000}),2);
 const faded={...strong,card:{...strong.card,last_review:new Date(Date.now()-2000*DAY)}};assert.equal(difficultyStage(faded),1);assert.deepEqual(strong,before);
});

test('response latency changes presentation difficulty without multiplying FSRS scheduling',()=>{
 const item=canonicalTargets(fixture())[0],now=new Date('2026-10-06T12:00:00Z'),old=mature(item.targetId,100,new Date(now.getTime()-DAY));delete old.latencyEmaMs;
 const fast=reviewLearning(old,item,true,true,false,false,1000,now),slow=reviewLearning(old,item,true,true,false,false,20000,now);
 assert.equal(fast.fsrsUpdated,true);assert.equal(slow.fsrsUpdated,true);assert.deepEqual(slow.memory.card,fast.memory.card);assert.equal(fast.memory.attempts,slow.memory.attempts);assert.equal(fast.memory.latencyEmaMs,1000);assert.equal(slow.memory.latencyEmaMs,20000);assert(difficultyStage(fast.memory)>difficultyStage(slow.memory));
});

test('progress counts active known units separately from unseen, suspended and actual retrievals',()=>{
 const b=fixture(),units=canonicalTargets(b),now=new Date(),review=mature(units[0].targetId);review.card.due=new Date(now.getTime()-1000);
 const triaged=triagedMemory(units[1],'green','',0),suspended={...mature(units[2].targetId),status:'suspended' as const},legacy={...review,id:'old-cue',legacyOf:review.id},orphan=mature('removed-target');
 const snapshot:Snapshot={bundle:b,memories:[review,triaged,suspended,legacy,orphan],events:['direct','diagnostic','repair','practice','direct'].map((level,i)=>({id:'e'+i,timestamp:now.toISOString(),recipe:'test',level,payload:{score:1,metadata:{stabilityTransitions:[{targetId:review.id,before:10,after:35}]}}}))};
 const p=progress(snapshot);assert.equal(p.available,4);assert.equal(p.total,2);assert.equal(p.new,1);assert.equal(p.suspended,1);assert.equal(p.covered,1);assert.equal(p.due,1);assert.equal(p.quarter,1);assert.deepEqual(todayLearning(snapshot,now),{retrievals:2,stability30Gains:1});
});

test('each completed familiarity bootstrap hands its next review to the unmodified FSRS scheduler',()=>{
 const item=canonicalTargets(fixture())[0];
 for(const [color,probes] of [['red',3],['orange',2],['yellow',2],['green',1]] as const){
  let now=new Date('2026-10-06T12:00:00Z'),m=triagedMemory(item,color,'',0,now);
  for(let n=0;n<probes;n++){m=reviewLearning(m,item,true,true,false,false,1000,now).memory;assert.equal(m.status,n+1===probes?'review':'learning');assert.equal(m.bootstrap!.successes,n+1);now=new Date(m.card.due)}
  const expected=scheduler.next(hydrate(m),now,Rating.Good).card,result=reviewLearning(m,item,true,true,false,false,1000,now);
  assert.equal(result.fsrsUpdated,true);assert.equal(result.memory.status,'review');assert.deepEqual(result.memory.card,expected);assert(result.memory.card.scheduled_days>1,`${color} must leave the bootstrap interval`);
 }
});

test('repeated suspension and resume preserve mature review status and all prior evidence',async()=>{
 const d=new EngiDB('adaptive22-'+crypto.randomUUID());try{
  const b=fixture();await saveKnowledge(b,d);const item=canonicalTargets(b)[0],m=mature(item.targetId);m.bootstrap={successes:3,probeAfterCards:0};m.confusions={a1:2};await d.learningState.put(learningRow(m));
  await setUnitSuspended(m.id,true,d);await setUnitSuspended(m.id,true,d);const suspended=(await d.learningState.get(m.id))!.payload;assert.equal(suspended.status,'suspended');assert.equal(suspended.suspendedFrom,'review');assert.deepEqual(suspended.card,m.card);
  await setUnitSuspended(m.id,false,d);const resumed=(await d.learningState.get(m.id))!.payload;assert.equal(resumed.status,'review');assert.equal(resumed.suspendedFrom,undefined);assert.equal(resumed.attempts,m.attempts);assert.equal(resumed.firstSuccessAt,m.firstSuccessAt);assert.deepEqual(resumed.confusions,m.confusions);assert.deepEqual({...resumed.card,due:m.card.due},m.card);assert(new Date(... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 }finally{d.close();await d.delete()}
});

```

### File: res://tests/browser.mjs
```
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});let passed=0,failed=0;
const scenarios=[];
const check=(name,run)=>scenarios.push({name,run});
async function seed(page){
 await page.goto(url);await page.waitForSelector('.feed-home');
 await page.evaluate(async()=>{
  const {saveKnowledge}=await import('/engi/src/services/knowledge-service.ts');
  const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'sample',name:'Объект'},{id:'author',name:'Автор'}],properties:[{id:'author-link',name:'Автор',valueKind:'entity',subjectTypes:['sample'],targetTypes:['author'],cardinality:'one',learnable:true},{id:'date',name:'Дата',valueKind:'date',subjectTypes:['sample'],cardinality:'one',learnable:true}]};
  for(let i=0;i<24;i++){b.entities.push({id:'s'+i,type:'sample',name:'Объект '+i,summary:'Короткий факт об объекте.',aliases:[],externalIds:{}},{id:'a'+i,type:'author',name:'Автор '+i,aliases:[],externalIds:{}});b.facts.push({id:'f'+i,entityId:'s'+i,key:'author-link',valueKind:'entity',valueEntityId:'a'+i,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}},{id:'d'+i,entityId... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
  await saveKnowledge(b);const {canonicalTargets}=await import('/engi/src/lib/engi/questions/recipe-factory.ts');const {triagedMemory}=await import('/engi/src/lib/engi/learning/bootstrap.ts');const {db}=await import('/engi/src/db/engi-db.ts');const {learningRow}=await import('/engi/src/db/repositories.ts');for(const item of canonicalTargets(b)){const m=triagedMemory(item,'red','',0);m.card.due=new... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 });await page.reload();await page.waitForSelector('.feed-home');
}
async function start(page,format){await page.getByLabel('Формат',{exact:true}).selectOption(format);await page.getByRole('button',{name:'Начать',exact:true}).click();await page.waitForSelector('.feed-question');await page.waitForSelector('.study-feed.state-ready')}
async function current(page){return page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const s=(await db.activeSessions.where('status').equals('active').toArray()).at(-1);return {session:s,task:s.tasks[s.currentPosition],events:await db.reviewEvents.toArray()}})}
async function drag(page,dx){const box=await page.locator('.recall-swipe').boundingBox();assert(box);const x=box.x+box.width*.5,y=box.y+box.height*.45;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:12});await page.mouse.up()}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function freezeClock(page){const time=new Date('2026-10-06T12:00:00Z');await page.clock.install({time});await page.clock.pauseAt(new Date(time.getTime()+1000))}

check('Choice wrong stays local; resume preserves disabled red options; final result is one event',async page=>{
 await start(page,'choice');const {task}=await current(page),correct=task.options.find(o=>o.id===task.items[0].answerId),wrongs=task.options.filter(o=>o.id!==correct.id);
 await page.getByRole('button',{name:wrongs[0].name,exact:true}).click();await sleep(200);
 assert.equal((await current(page)).events.length,0);
 assert.equal(await page.locator('.answer-correct').count(),0);
 assert(await page.getByRole('button',{name:correct.name,exact:true}).isEnabled());
 assert.equal(await page.locator('.feed-feedback').count(),0);
 await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места'}).click();await page.waitForSelector('.feed-question');
 assert.equal(await page.locator('.answer-wrong').count(),1);
 await page.getByRole('button',{name:wrongs[1].name,exact:true}).click();await sleep(150);
 await page.getByRole('button',{name:correct.name,exact:true}).click();
 await page.locator('.encoding-moment').waitFor();
 const result=(await current(page)).events[0];assert.equal(result.payload.score,0);assert.equal(result.payload.metadata.attemptCount,3);assert.equal(result.payload.feedback.encoding,true);
});

check('Twenty first-try answers auto-advance with twenty taps and goal does not stop feed',async page=>{
 await start(page,'choice');for(let i=0;i<20;i++){const {task}=await current(page);await page.locator(`[data-task-id="${task.id}"]`).waitFor();const correct=task.options.find(o=>o.id===task.items[0].answerId);await page.getByRole('button',{name:correct.name,exact:true}).click();await page.waitForFunction(id=>document.querySelector('.feed-current')?.getAttribute('data-task-id')!==id,task.id)}
 assert.equal((await current(page)).events.length,20);assert.equal(await page.locator('.study-feed').count(),1);assert.equal(await page.locator('.study-feed input[type="text"]').count(),0);
});

check('Timeline pointer release and arrows do not submit; Confirm submits one diagnostic event',async page=>{
 await start(page,'timeline');const slider=page.getByRole('slider');await slider.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
 const box=await slider.boundingBox();await page.mouse.click(box.x+box.width*.2,box.y+box.height*.5);await sleep(150);
 assert.equal((await current(page)).events.length,0);await page.getByRole('button',{name:'Подтвердить',exact:true}).click();await sleep(150);
 const events=(await current(page)).events;assert.equal(events.length,1);assert.equal(events[0].payload.fsrsEnabled,false);assert.equal(await page.locator('.timeline-result').count(),1);
});

check('Recall stays hidden until 5000ms; pre-reveal gesture ignored; short drag springs back',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');const id=(await current(page)).task.id;
 await drag(page,140);assert.equal((await current(page)).events.length,0);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.clock.runFor(4999);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.clock.runFor(1);await page.waitForSelector('.revealed-answer');
 await drag(page,20);assert.equal((await current(page)).events.length,0);await page.clock.runFor(240);
 await drag(page,150);await sleep(150);const events=(await current(page)).events;assert.equal(events.length,1);assert.equal(events[0].id,id);assert.equal(events[0].payload.score,1);
});

check('Recall miss after reveal is one failed pretest and no keyboard answer',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');await page.clock.runFor(5000);await page.waitForSelector('.revealed-answer');await drag(page,-150);await sleep(150);
 const events=(await current(page)).events;assert.equal(events.length,1);assert.equal(events[0].payload.score,0);assert.equal(events[0].payload.fsrsEnabled,false);assert.equal(await page.locator('.study-feed input:not([type=range])').count(),0);
});

check('Reduced motion offers compact accessible Recall controls after reveal',async page=>{
 await page.emulateMedia({reducedMotion:'reduce'});await freezeClock(page);await start(page,'recall_reveal');assert.equal(await page.getByRole('button',{name:'Вспомнил',exact:true}).count(),0);
 await page.clock.runFor(5000);await page.getByRole('button',{name:'Вспомнил',exact:true}).click();await sleep(150);assert.equal((await current(page)).events.length,1);
});

check('Recall pauses while details are open and resumes with thinking time intact',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');await page.clock.runFor(2000);await page.getByRole('button',{name:'Подробнее о вопросе'}).click();await page.clock.runFor(10000);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.getByRole('button',{name:'Закрыть подробности'}).click();await page.clock.runFor(2999);assert.equal(await page.locator('.revealed-answer').count(),0);await page.clock.runFor(1);await page.waitForSelector('.revealed-answer');
});

check('All seven feed formats have no typed answer and fit phone width',async page=>{
 for(const fmt of ['choice','recall_reveal','match','categorize','missing','timeline','sort']){
  if(fmt==='categorize')await page.evaluate(async()=>{const {saveKnowledge}=await import('/engi/src/services/knowledge-service.ts');const {db}=await import('/engi/src/db/engi-db.ts');const facts=await db.facts.where('key').equals('author-link').toArray();await saveKnowledge({facts:facts.map((f,i)=>({...f,valueEntityId:'a'+(i%3)}))});const {getBundle,learningRow}=await import('/engi/src/db/reposito... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
  if(await page.locator('.study-feed').count()){await page.getByRole('button',{name:'Выйти из практики'}).click();await page.waitForSelector('.feed-home')}
  await start(page,fmt);assert.equal(await page.locator('.study-feed input[type=text],.study-feed input:not([type])').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 if(process.env.ENGI_SCREENSHOTS){await mkdir(process.env.ENGI_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.ENGI_SCREENSHOTS+'/sort-phone.png'})}
});

check('Recall reload restores active thinking time rather than starting over',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');await page.clock.runFor(2000);
 const before=await current(page);assert.equal(before.session.interaction.recallElapsedMs,2000);
 await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места'}).click();await page.waitForSelector('.study-feed.state-ready');
 assert.equal((await current(page)).task.id,before.task.id);await page.clock.runFor(2999);assert.equal(await page.locator('.revealed-answer').count(),0);await page.clock.runFor(1);await page.waitForSelector('.revealed-answer');
});

check('Recall ignores time spent in a hidden document',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');await page.clock.runFor(2000);
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))});
 await page.clock.runFor(10000);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});
 await page.clock.runFor(2999);assert.equal(await page.locator('.revealed-answer').count(),0);await page.clock.runFor(1);await page.waitForSelector('.revealed-answer');
});

check('Recall recovers from a failed reveal write without another thinking interval',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');
 await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const fail=mods=>{if(mods.interaction?.revealed||mods['interaction.revealed']){window.__revealWriteFailed=true;db.activeSessions.hook('updating').unsubscribe(fail);throw Error('Temporary reveal write failure')}};db.activeSessions.hook('updating',fail)});
 await page.clock.runFor(5000);await page.locator('.feed-error').waitFor();assert(await page.evaluate(()=>window.__revealWriteFailed));assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.clock.runFor(500);await page.waitForSelector('.revealed-answer');assert.equal((await current(page)).session.interaction.recallElapsedMs,5000);
});

check('Recall early reveal persists actual active time without a review; only grading completes the card',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');const id=(await current(page)).task.id;
 await page.clock.runFor(1234);await page.getByRole('button',{name:'Показать сейчас',exact:true}).click();await page.locator('.revealed-answer').waitFor();
 const before=await current(page);assert.equal(before.session.interaction.recallElapsedMs,1234);assert.equal(before.session.interaction.earlyReveal,true);assert.equal(before.events.length,0);
 await page.clock.runFor(9000);const after=await current(page);assert.equal(after.session.interaction.recallElapsedMs,1234);assert.equal(after.events.length,0);
 await drag(page,-150);await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.reviewEvents.count())===1});
 const result=(await current(page)).events[0];assert.equal(result.id,id);assert.equal(result.payload.score,0);
});

check('Object Intro autosaves colors across reload, spends three entities, and More opens exactly two',async page=>{
 await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');await db.learningState.clear();await db.appMeta.delete('newLearning');await db.appMeta.delete('introducedEntities')});await page.reload();await page.locator('.feed-home').waitFor();
 await page.getByRole('button',{name:'Начать',exact:true}).click();await page.locator('#object-intro-heading').waitFor();const initial=await current(page),intro=initial.session.intro;
 assert(intro);assert.equal(await page.locator('.learning22-property').count(),2);
 await page.getByRole('button',{name:'Автор: Знаю хорошо',exact:true}).click();await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const s=(await db.activeSessions.where('status').equals('active').toArray()).at(-1);return Object.values(s.intro.selections).includes('green')});
 await page.getByRole('button',{name:'Дата: Не учить',exact:true}).click();await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const s=(await db.activeSessions.where('status').equals('active').toArray()).at(-1);return Object.values(s.intro.selections).includes('suspended')});
 assert.equal((await current(page)).events.length,0);await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места'}).click();await page.locator('#object-intro-heading').waitFor();
 assert.equal((await current(page)).session.intro.entityId,intro.entityId);assert.equal(await page.getByRole('button',{name:'Автор: Знаю хорошо',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.getByRole('button',{name:'Дата: Не учить',exact:true}).getAttribute('aria-pressed'),'true');
 for(let n=0;n<3;n++){await page.locator('#object-intro-heading').waitFor();const previous=await page.locator('#object-intro-heading').textContent();await page.getByRole('button',{name:'Готово',exact:true}).click();if(n<2)await page.waitForFunction(previous=>document.querySelector('#object-intro-heading')?.textContent!==previous,previous)}
 await page.locator('#stop-study-heading').waitFor();const stopped=await current(page);assert.equal(stopped.session.exhausted,true);assert.equal(stopped.events.length,0);
 const status=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return {budget:(await db.appMeta.get('newLearning')).value,rows:await db.learningState.toArray()}});assert.equal(status.budget.introducedEntityIds.length,3);assert(status.rows.every(r=>r.payload.card.reps===0&&!r.payload.firstSuccessAt));assert.equal(status.rows.find(r=>r.id===intro.unitIds.find(id=>id.i... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 await page.getByRole('button',{name:'Открыть ещё 2 объекта',exact:true}).click();
 for(let n=0;n<2;n++){await page.locator('#object-intro-heading').waitFor();await page.getByRole('button',{name:'Готово',exact:true}).click()}
 await page.locator('#stop-study-heading').waitFor();assert.equal((await current(page)).events.length,0);assert.equal(await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.appMeta.get('newLearning')).value.introducedEntityIds.length}),5);
});

check('Property details suspend only that unit; resume preserves memory and makes it due',async page=>{
 const before=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.learningState.get('ku:fact:f0:forward')).payload});
 await page.getByRole('button',{name:'Знания',exact:true}).click();await page.locator('.object-card').filter({has:page.getByRole('heading',{name:'Объект 0',exact:true})}).click();
 await page.locator('.entity-learning-row').filter({has:page.locator('strong',{hasText:'Автор'})}).click();await page.getByRole('button',{name:'★ Не учить это свойство',exact:true}).click();
 await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.learningState.get('ku:fact:f0:forward')).payload.status==='suspended'});
 const suspended=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return {memory:(await db.learningState.get('ku:fact:f0:forward')).payload,sibling:(await db.learningState.get('ku:fact:d0:forward')).payload,events:await db.reviewEvents.count()}});assert.deepEqual(suspended.memory.card,before.card);assert.equal(suspended.sibling.status,'triaged');assert.equal(suspend... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 await page.locator('.entity-learning-row').filter({has:page.locator('strong',{hasText:'Автор'})}).click();await page.getByRole('button',{name:'Вернуть в обучение',exact:true}).click();
 await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.learningState.get('ku:fact:f0:forward')).payload.status==='triaged'});
 const restored=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.learningState.get('ku:fact:f0:forward')).payload});assert.deepEqual({...restored.card,due:before.card.due},before.card);assert.equal(restored.attempts,before.attempts);assert(new Date(restored.card.due).getTime()<=Date.now());
});

try{for(const scenario of scenarios.filter(s=>!process.env.ENGI_TEST_FILTER||s.name.includes(process.env.ENGI_TEST_FILTER))){const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const page=await context.newPage();page.setDefaultTimeout(4000);try{await seed(page);await scenario.run(page);passed++;console.log('PASS '+scenario.name)}catch(e){failed++;c... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
console.log(JSON.stringify({browserAcceptance:{passed,failed}}));if(failed)process.exitCode=1;





```

### File: res://tests/deck-components.test.ts
```typescript
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pluralObjects, pluralSubtags} from '../src/components/knowledge/DeckCard';
import type {DeckInfo} from '../src/lib/engi/knowledge/decks';

test('pluralSubtags correctly formats sub-tag badges in Russian', () => {
  assert.equal(pluralSubtags(1), '+1 подтег');
  assert.equal(pluralSubtags(2), '+2 подтега');
  assert.equal(pluralSubtags(4), '+4 подтега');
  assert.equal(pluralSubtags(5), '+5 подтегов');
  assert.equal(pluralSubtags(6), '+6 подтегов');
  assert.equal(pluralSubtags(11), '+11 подтегов');
  assert.equal(pluralSubtags(21), '+21 подтег');
  assert.equal(pluralSubtags(22), '+22 подтега');
});

test('pluralObjects correctly inflects Russian numerals', () => {
  assert.equal(pluralObjects(0), '0 объектов');
  assert.equal(pluralObjects(1), '1 объект');
  assert.equal(pluralObjects(2), '2 объекта');
  assert.equal(pluralObjects(4), '4 объекта');
  assert.equal(pluralObjects(5), '5 объектов');
  assert.equal(pluralObjects(11), '11 объектов');
  assert.equal(pluralObjects(12), '12 объектов');
  assert.equal(pluralObjects(14), '14 объектов');
  assert.equal(pluralObjects(21), '21 объект');
  assert.equal(pluralObjects(22), '22 объекта');
  assert.equal(pluralObjects(25), '25 объектов');
});

test('deck data structures conform to DeckCard specifications', () => {
  const sampleDeck: DeckInfo = {
    id: 'tag-1',
    name: 'Живопись',
    isUntagged: false,
    childTagIds: ['tag-2'],
    entityCount: 15,
    sampleImages: ['engi-media://1', 'engi-media://2', 'engi-media://3'],
    learnedEntityCount: 5,
    startedEntityCount: 8,
    category: 'in_progress',
    stats: {
      total: 10,
      available: 12,
      new: 2,
      suspended: 0,
      covered: 8,
      retention: 85,
      due: 3,
    },
  };

  assert.equal(sampleDeck.childTagIds.length, 1);
  assert.equal(sampleDeck.sampleImages.length, 3);
  assert.equal(sampleDeck.stats.due, 3);
  assert.equal(sampleDeck.learnedEntityCount, 5);
  assert.equal(sampleDeck.category, 'in_progress');
});
```

### File: res://tests/deck-detail.test.ts
```typescript
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  getEntityMasterySummary,
  getDeckEntities,
  getDeckTypes,
  filterDeckEntities,
  UNTAGGED_TAG_ID,
} from '../src/lib/engi/knowledge/decks';
import type {Bundle, Snapshot} from '../src/lib/engi/types';

function fixture(): Snapshot {
  const b: Bundle = {
    entities: [
      {id: 'p1', type: 'person', name: 'Клод Моне', aliases: ['Моне'], externalIds: {}},
      {id: 'p2', type: 'person', name: 'Огюст Ренуар', aliases: [], externalIds: {}},
      {id: 'a1', type: 'artwork', name: 'Кувшинки', aliases: [], externalIds: {}},
      {id: 'un1', type: 'event', name: 'Парижский салон', aliases: [], externalIds: {}},
    ],
    facts: [
      {id: 'f1', entityId: 'a1', key: 'created_by', valueKind: 'entity', valueEntityId: 'p1', verification: 'verified', source: {name: 'test'}},
    ],
    media: [
      {id: 'm1', entityId: 'p1', role: 'portrait', url: 'engi-media://p1', license: 'cc'},
    ],
    tags: [
      {id: 'tag-art', name: 'Импрессионизм'},
    ],
    entityTags: [
      {entityId: 'p1', tagId: 'tag-art'},
      {entityId: 'p2', tagId: 'tag-art'},
      {entityId: 'a1', tagId: 'tag-art'},
    ],
    properties: [
      {id: 'created_by', name: 'Автор', valueKind: 'entity', cardinality: 'one', learnable: true},
    ],
    entityTypes: [
      {id: 'person', name: 'Художник'},
      {id: 'artwork', name: 'Картина'},
      {id: 'event', name: 'Событие'},
    ],
    missing: [],
    unresolved: [],
  };

  return {
    bundle: b,
    memories: [
      {
        id: 'ku:fact:f1:forward',
        card: {stability: 45, due: new Date(Date.now() + 86400000).toISOString()},
        attempts: 3,
        correct: 3,
        confusions: {},
        firstSuccessAt: new Date().toISOString(),
        status: 'review',
      },
    ],
    events: [],
  };
}

test('getEntityMasterySummary accurately classifies unseen vs active memory', () => {
  const s = fixture();
  const unseenSummary = getEntityMasterySummary('p2', s);
  assert.equal(unseenSummary.color, 'unseen');
  assert.equal(unseenSummary.mark, '⚪');

  const artworkSummary = getEntityMasterySummary('a1', s);
  assert.equal(artworkSummary.color, 'green');
  assert.equal(artworkSummary.mark, '🟢');
  assert.equal(artworkSummary.label, 'Закреплено');
});

test('getDeckEntities distinguishes tagged deck items from untagged inbox items', () => {
  const s = fixture();
  const artEntities = getDeckEntities(s.bundle, 'tag-art');
  assert.equal(artEntities.length, 3);
  assert.deepEqual(artEntities.map(e => e.id).sort(), ['a1', 'p1', 'p2']);

  const untagged = getDeckEntities(s.bundle, UNTAGGED_TAG_ID);
  assert.equal(untagged.length, 1);
  assert.equal(untagged[0].id, 'un1');
});

test('getDeckTypes lists types specifically present in the provided entity collection', () => {
  const s = fixture();
  const artEntities = getDeckEntities(s.bundle, 'tag-art');
  const deckTypes = getDeckTypes(artEntities, s.bundle);
  assert.equal(deckTypes.length, 2);
  assert.deepEqual(deckTypes.map(t => t.name).sort(), ['Картина', 'Художник']);
});

test('filterDeckEntities filters by combined text and category type', () => {
  const s = fixture();
  const artEntities = getDeckEntities(s.bundle, 'tag-art');

  const filteredByType = filterDeckEntities(artEntities, s.bundle, '', 'artwork');
  assert.equal(filteredByType.length, 1);
  assert.equal(filteredByType[0].id, 'a1');

  const filteredByName = filterDeckEntities(artEntities, s.bundle, 'Моне', 'all');
  assert.equal(filteredByName.length, 1);
  assert.equal(filteredByName[0].id, 'p1');
});

test('child tags of parent deck are accurately resolved for hierarchical navigation', () => {
  const b: Bundle = {
    entities: [
      {id: 'e1', type: 'person', name: 'Эйнштейн', aliases: [], externalIds: {}},
      {id: 'e2', type: 'person', name: 'Пастернак', aliases: [], externalIds: {}},
    ],
    facts: [],
    media: [],
    tags: [
      {id: 'nobel', name: 'Нобелевские лауреаты'},
      {id: 'nobel-physics', name: 'Физика', parentId: 'nobel'},
      {id: 'nobel-lit', name: 'Литература', parentId: 'nobel'},
    ],
    entityTags: [
      {entityId: 'e1', tagId: 'nobel-physics'},
      {entityId: 'e2', tagId: 'nobel-lit'},
    ],
    properties: [],
    entityTypes: [{id: 'person', name: 'Человек'}],
    missing: [],
    unresolved: [],
  };

  const childTags = b.tags.filter(t => !t.archived && t.parentId === 'nobel');
  assert.equal(childTags.length, 2);
  assert.deepEqual(childTags.map(t => t.name).sort(), ['Литература', 'Физика']);
});
```

### File: res://tests/deck-integration.test.ts
```typescript
import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {saveKnowledge, saveTag, archiveTag, attachEntityTag, detachEntityTag} from '../src/services/knowledge-service';
import {
  getDeckList,
  getDeckEntities,
  getDeckTypes,
  filterDeckEntities,
  progressForEntities,
  UNTAGGED_TAG_ID,
} from '../src/lib/engi/knowledge/decks';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {learningRow} from '../src/db/repositories';
import type {Bundle, Snapshot} from '../src/lib/engi/types';

function fixtureBundle(): Bundle {
  return {
    entities: [
      {id: 'e1', type: 'person', name: 'Персона 1', aliases: [], externalIds: {}},
      {id: 'e2', type: 'person', name: 'Персона 2', aliases: [], externalIds: {}},
      {id: 'e3', type: 'artwork', name: 'Картина 1', aliases: [], externalIds: {}},
    ],
    facts: [],
    media: [],
    tags: [
      {id: 'deck-1', name: 'Колода 1'},
    ],
    entityTags: [
      {entityId: 'e1', tagId: 'deck-1'},
    ],
    properties: [],
    entityTypes: [
      {id: 'person', name: 'Человек'},
      {id: 'artwork', name: 'Картина'},
    ],
    missing: [],
    unresolved: [],
  };
}

test('deck integration: tag creation, entity assignment and untagged inbox separation', async () => {
  const d = new EngiDB('deck-integration-' + crypto.randomUUID());
  try {
    await saveKnowledge(fixtureBundle(), d);

    // Initial state: 1 tagged deck, 2 untagged entities
    const b1: Bundle = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags, d.media, d.propertyDefinitions, d.entityTypes], async () => {
      return {
        ...fixtureBundle(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });
    const s1: Snapshot = {bundle: b1, memories: [], events: []};
    const decks1 = getDeckList(s1);
    assert.equal(decks1.length, 2);
    assert.equal(decks1.find(d => d.id === 'deck-1')?.entityCount, 1);
    assert.equal(decks1.find(d => d.id === UNTAGGED_TAG_ID)?.entityCount, 2);

    // Create a new deck
    await saveTag({id: 'deck-2', name: 'Колода 2'}, d);
    // Move e2 into deck-2
    await attachEntityTag('e2', 'deck-2', d);

    const b2: Bundle = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags, d.media, d.propertyDefinitions, d.entityTypes], async () => {
      return {
        ...fixtureBundle(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });
    const s2: Snapshot = {bundle: b2, memories: [], events: []};
    const decks2 = getDeckList(s2);
    assert.equal(decks2.length, 3);
    assert.equal(decks2.find(d => d.id === 'deck-2')?.entityCount, 1);
    assert.equal(decks2.find(d => d.id === UNTAGGED_TAG_ID)?.entityCount, 1);

    // Remove e1 from deck-1
    await detachEntityTag('e1', 'deck-1', d);
    const b3: Bundle = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags], async () => {
      return {
        ...fixtureBundle(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });
    const deck1Entities = getDeckEntities(b3, 'deck-1');
    assert.equal(deck1Entities.length, 0);

    // Archive deck-2
    await archiveTag('deck-2', d);
    const b4: Bundle = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags], async () => {
      return {
        ...fixtureBundle(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });
    const s4: Snapshot = {bundle: b4, memories: [], events: []};
    const decks4 = getDeckList(s4);
    assert.equal(decks4.some(d => d.id === 'deck-2'), false);
    // All 3 entities should now be untagged
    assert.equal(decks4.find(d => d.id === UNTAGGED_TAG_ID)?.entityCount, 3);
  } finally {
    d.close();
    await d.delete();
  }
});

function fullFixture(): Bundle {
  return {
    entities: [
      {id: 'p1', type: 'person', name: 'Клод Моне', aliases: ['Моне'], externalIds: {}},
      {id: 'p2', type: 'person', name: 'Джордж Вашингтон', aliases: ['Вашингтон'], externalIds: {}},
      {id: 'p3', type: 'person', name: 'Джон Адамс', aliases: ['Адамс'], externalIds: {}},
      {id: 'u1', type: 'person', name: 'Неразобранный деятель', aliases: [], externalIds: {}},
    ],
    facts: [
      {id: 'f1', entityId: 'p1', key: 'party', valueKind: 'text', valueText: 'Либерал', verification: 'verified', source: {name: 'test'}},
      {id: 'f2', entityId: 'p2', key: 'presidency_start', valueKind: 'date', dateStart: '1789-01-01', dateEnd: '1789-12-31', datePrecision: 'year', verification: 'verified', source: {name: 'test'}},
      {id: 'f3', entityId: 'p3', key: 'presidency_start', valueKind: 'date', dateStart: '1797-01-01', dateEnd: '1797-12-31', datePrecision: 'year', verification: 'verified', source: {name: 'test'}},
      {id: 'f4', entityId: 'u1', key: 'party', valueKind: 'text', valueText: 'Независимый', verification: 'verified', source: {name: 'test'}},
    ],
    media: [
      {id: 'm1', entityId: 'p1', role: 'portrait', url: 'engi-media://m1', license: 'cc'},
      {id: 'm2', entityId: 'p2', role: 'portrait', url: 'engi-media://m2', license: 'cc'},
      {id: 'm3', entityId: 'p3', role: 'portrait', url: 'engi-media://m3', license: 'cc'},
    ],
    tags: [
      {id: 'parent-art', name: 'Искусство'},
      {id: 'deck-art', name: 'Живопись', parentId: 'parent-art'},
      {id: 'deck-presidents', name: 'Президенты США'},
    ],
    entityTags: [
      {entityId: 'p1', tagId: 'deck-art'},
      {entityId: 'p2', tagId: 'deck-presidents'},
      {entityId: 'p3', tagId: 'deck-presidents'},
    ],
    properties: [
      {id: 'party', name: 'Партия', valueKind: 'text', cardinality: 'one', learnable: true, learning: {choice: 'on'}},
      {id: 'presidency_start', name: 'Начало президентства', valueKind: 'date', cardinality: 'one', learnable: true, learning: {choice: 'on'}},
    ],
    entityTypes: [
      {id: 'person', name: 'Человек'},
    ],
    missing: [],
    unresolved: [],
  };
}

test('deck integration: parent-child hierarchy populates childTagIds in deck catalog', () => {
  const b = fullFixture();
  const s: Snapshot = {bundle: b, memories: [], events: []};
  const decks = getDeckList(s);
  const parentArt = decks.find(d => d.id === 'parent-art');
  assert(parentArt);
  assert.deepEqual(parentArt.childTagIds, ['deck-art']);
  const childDeck = decks.find(d => d.id === 'deck-art');
  assert(childDeck);
  assert.equal(childDeck.parentId, 'parent-art');
});

test('deck integration: per-deck and untagged metrics isolation', () => {
  const b = fullFixture();
  const presTargets = canonicalTargets(b, 'deck-presidents');
  assert.equal(presTargets.length, 2);
  assert(presTargets.every(t => t.entityId === 'p2' || t.entityId === 'p3'));

  const artTargets = canonicalTargets(b, 'deck-art');
  assert.equal(artTargets.length, 1);
  assert.equal(artTargets[0].entityId === 'p1', true);

  const untagged = getDeckEntities(b, UNTAGGED_TAG_ID);
  assert.equal(untagged.length, 1);
  assert.equal(untagged[0].id, 'u1');

  const s: Snapshot = {bundle: b, memories: [], events: []};
  const untaggedStats = progressForEntities(s, new Set(['u1']));
  assert.equal(untaggedStats.available, 1);
  assert.equal(untaggedStats.covered, 0);
  assert.equal(untaggedStats.new, 1);
});

test('deck integration: multi-deck entity assignment maintains single memory state in database', async () => {
  const d = new EngiDB('deck-multi-' + crypto.randomUUID());
  try {
    await saveKnowledge(fullFixture(), d);

    // Assign p1 to both deck-art and deck-presidents
    await attachEntityTag('p1', 'deck-presidents', d);

    const b = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags, d.propertyDefinitions, d.entityTypes], async () => {
      return {
        ...fullFixture(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });

    const artEntities = getDeckEntities(b, 'deck-art');
    const presEntities = getDeckEntities(b, 'deck-presidents');
    assert(artEntities.some(e => e.id === 'p1'));
    assert(presEntities.some(e => e.id === 'p1'));

    const unitId = 'ku:fact:f1:forward';
    const item = canonicalTargets(b, 'all').find(i => i.targetId === unitId)!;
    const mem = triagedMemory(item, 'green', 'test-session', 0);
    await d.learningState.put(learningRow(mem));

    const s: Snapshot = {
      bundle: b,
      memories: [(await d.learningState.get(unitId))!.payload],
      events: [],
    };
    const decks = getDeckList(s);
    const artDeck = decks.find(dk => dk.id === 'deck-art')!;
    assert.equal(artDeck.stats.covered, 0);
    assert.equal(artDeck.stats.new, 0);
  } finally {
    d.close();
    await d.delete();
  }
});

test('deck integration: search and category type filtering inside deck view', () => {
  const b = fullFixture();
  const presEntities = getDeckEntities(b, 'deck-presidents');
  assert.equal(presEntities.length, 2);

  const searched = filterDeckEntities(presEntities, b, 'Адамс', 'all');
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, 'p3');

  const types = getDeckTypes(presEntities, b);
  assert.equal(types.length, 1);
  assert.equal(types[0].id, 'person');
});
```

### File: res://tests/decks-style.test.ts
```typescript
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('decks.css contains mobile touch targets, safe-area insets, dark mode and reduced motion', async () => {
  const css = await readFile(new URL('../src/components/knowledge/decks.css', import.meta.url), 'utf8');

  assert(css.includes('env(safe-area-inset-bottom)'), 'Safe-area inset bottom must be supported for iOS PWA');
  assert(css.includes('touch-action: manipulation'), 'Touch action manipulation must be set on interactive targets');
  assert(css.includes('min-height: 44px'), '44px minimum touch targets must be preserved for buttons');
  assert(css.includes('.dark .deck-card'), 'Dark mode styles must be present');
  assert(css.includes('prefers-reduced-motion'), 'Reduced motion accessibility query must be present');
  assert(css.includes('object-fit: contain'), 'Thumbnails must use object-fit: contain to avoid cropping images');
});
```

### File: res://tests/decks.test.ts
```typescript
import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  getUntaggedEntities,
  getDeckSampleImages,
  getDeckList,
  getDeckEntities,
  getDeckTypes,
  filterDeckEntities,
  UNTAGGED_TAG_ID,
} from '../src/lib/engi/knowledge/decks';
import {EngiDB} from '../src/db/engi-db';
import {saveKnowledge, attachEntityTag, detachEntityTag, archiveTag} from '../src/services/knowledge-service';
import type {Bundle, Snapshot} from '../src/lib/engi/types';

function fixture(): Bundle {
  return {
    entities: [
      {id: 'e1', type: 'person', name: 'Джон Кеннеди', aliases: ['Кеннеди'], externalIds: {}},
      {id: 'e2', type: 'person', name: 'Джордж Вашингтон', aliases: ['Вашингтон'], externalIds: {}},
      {id: 'e3', type: 'artwork', name: 'Мона Лиза', aliases: ['Джоконда'], externalIds: {}},
      {id: 'e4', type: 'artwork', name: 'Звёздная ночь', aliases: [], externalIds: {}},
      {id: 'e5', type: 'event', name: 'Неразобранное событие', aliases: [], externalIds: {}},
    ],
    facts: [],
    media: [
      {id: 'm1', entityId: 'e1', role: 'portrait', url: 'engi-media://1111', license: 'cc', primary: true},
      {id: 'm2', entityId: 'e2', role: 'portrait', url: 'engi-media://2222', license: 'cc', primary: true},
      {id: 'm3', entityId: 'e3', role: 'artwork', url: 'engi-media://3333', license: 'cc', primary: true},
      {id: 'm4', entityId: 'e3', role: 'detail', url: 'engi-media://4444', license: 'cc'},
    ],
    tags: [
      {id: 'tag-presidents', name: 'Президенты США'},
      {id: 'tag-art', name: 'Живопись'},
    ],
    entityTags: [
      {entityId: 'e1', tagId: 'tag-presidents'},
      {entityId: 'e2', tagId: 'tag-presidents'},
      {entityId: 'e3', tagId: 'tag-art'},
      {entityId: 'e4', tagId: 'tag-art', archived: true},
    ],
    properties: [],
    entityTypes: [
      {id: 'person', name: 'Человек'},
      {id: 'artwork', name: 'Картина'},
      {id: 'event', name: 'Событие'},
    ],
    missing: [],
    unresolved: [],
  };
}

test('getUntaggedEntities returns entities without active tags and skips tagged or archived ones', () => {
  const b = fixture();
  const untagged = getUntaggedEntities(b);
  assert.equal(untagged.length, 2);
  assert.deepEqual(untagged.map(e => e.id).sort(), ['e4', 'e5']);
});

test('getDeckSampleImages returns up to limit distinct valid images', () => {
  const b = fixture();
  const images = getDeckSampleImages(b, ['e1', 'e2', 'e3'], 3);
  assert.equal(images.length, 3);
  assert.equal(images[0], 'engi-media://1111');
  assert.equal(images[1], 'engi-media://2222');
  assert.equal(images[2], 'engi-media://3333');
});

test('getDeckList builds tag decks and automatically includes untagged pseudo-deck', () => {
  const b = fixture();
  const snapshot: Snapshot = {
    bundle: b,
    memories: [],
    events: [],
  };
  const decks = getDeckList(snapshot);
  assert.equal(decks.length, 3);
  const presidents = decks.find(d => d.id === 'tag-presidents');
  assert(presidents);
  assert.equal(presidents.entityCount, 2);
  assert.equal(presidents.learnedEntityCount, 0);
  assert.equal(presidents.category, 'unlearned');
  assert.equal(presidents.isUntagged, false);

  const untagged = decks.find(d => d.id === UNTAGGED_TAG_ID);
  assert(untagged);
  assert.equal(untagged.name, 'Неразобранное');
  assert.equal(untagged.isUntagged, true);
  assert.equal(untagged.entityCount, 2);
  assert.equal(untagged.category, 'unlearned');
});

test('getDeckEntities returns deck members or untagged members based on deckId', () => {
  const b = fixture();
  const artEntities = getDeckEntities(b, 'tag-art');
  assert.equal(artEntities.length, 1);
  assert.equal(artEntities[0].id, 'e3');

  const untaggedEntities = getDeckEntities(b, UNTAGGED_TAG_ID);
  assert.equal(untaggedEntities.length, 2);
  assert.deepEqual(untaggedEntities.map(e => e.id).sort(), ['e4', 'e5']);
});

test('getDeckTypes and filterDeckEntities filter items cleanly by type and search query', () => {
  const b = fixture();
  const allEntities = b.entities;
  const types = getDeckTypes(allEntities, b);
  assert.equal(types.length, 3);

  const filteredByType = filterDeckEntities(allEntities, b, '', 'artwork');
  assert.equal(filteredByType.length, 2);

  const filteredByQuery = filterDeckEntities(allEntities, b, 'Джоконда');
  assert.equal(filteredByQuery.length, 1);
  assert.equal(filteredByQuery[0].id, 'e3');
});

test('attachEntityTag and detachEntityTag update membership in database', async () => {
  const d = new EngiDB('deck-tag-test-' + crypto.randomUUID());
  try {
    await saveKnowledge(fixture(), d);

    await attachEntityTag('e5', 'tag-presidents', d);
    let untagged = getUntaggedEntities(await d.transaction('r', [d.entities, d.entityTags, d.tags], async () => {
      const [entities, entityTags, tags] = await Promise.all([d.entities.toArray(), d.entityTags.toArray(), d.tags.toArray()]);
      return {...fixture(), entities, entityTags, tags};
    }));
    assert.equal(untagged.some(e => e.id === 'e5'), false);

    await detachEntityTag('e5', 'tag-presidents', d);
    untagged = getUntaggedEntities(await d.transaction('r', [d.entities, d.entityTags, d.tags], async () => {
      const [entities, entityTags, tags] = await Promise.all([d.entities.toArray(), d.entityTags.toArray(), d.tags.toArray()]);
      return {...fixture(), entities, entityTags, tags};
    }));
    assert.equal(untagged.some(e => e.id === 'e5'), true);

    await archiveTag('tag-presidents', d);
    const archivedTag = await d.tags.get('tag-presidents');
    assert.equal(archivedTag?.archived, true);
  } finally {
    d.close();
    await d.delete();
  }
});
```

### File: res://tests/feed.test.ts
```typescript
import {prepareDue} from './helpers22';
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {EngiDB} from '../src/db/engi-db';
import {createTrainerService} from '../src/services/trainer-service';
import {saveKnowledge} from '../src/services/knowledge-service';
import {getBundle,learningRow} from '../src/db/repositories';
import {updateMemory,assess} from '../src/lib/engi/engine';
import {composeFeed} from '../src/lib/engi/session/composer';
import {canonicalTargets,recipes} from '../src/lib/engi/questions/recipe-factory';
import type {Bundle} from '../src/lib/engi/types';

function fixture():Bundle {
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'relation',name:'Связь',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']},{id:'date',name:'Дата',valueKind:'date',cardinality:'one',learnable:true,subjectTypes:['subject... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 for(let i=0;i<8;i++){b.entities.push({id:'s'+i,type:'subject',name:'Объект '+i,aliases:[],externalIds:{}},{id:'a'+i,type:'answer',name:'Ответ '+i,aliases:[],externalIds:{}});b.facts.push({id:'f'+i,entityId:'s'+i,key:'relation',valueKind:'entity',valueEntityId:'a'+i,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}},{id:'d'+i,entityId:'s'+i,key:'date',valueKind:'date',dateS... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}
async function setup(run:(db:EngiDB,svc:ReturnType<typeof createTrainerService>)=>Promise<void>){const d=new EngiDB('feed-'+crypto.randomUUID());try{await saveKnowledge(fixture(),d);await prepareDue(d);await run(d,createTrainerService(d))}finally{d.close();await d.delete()}}


test('wrong option persists only a draft, never reveals correction, and resumes across service recreation',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!,before=await d.learningState.toArray();
 const pending=await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id,latencyMs:1600});assert.equal(pending.pending,true);assert.equal(pending.feedback,null);assert.equal(await d.reviewEvents.count(),0);assert.deepEqual(await d.learningState.toArray(),before);
 const resumed=await createTrainerService(d).getResumableSession();assert.deepEqual(resumed!.interaction!.attemptSequence,[wrong.id]);await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id,latencyMs:3000});assert.deepEqual((await d.activeSessions.get(s.id))!.interaction!.attemptSequence,[wrong.id]);
}));
test('two real errors then forced correction commit one Again with all unique confusions and first latency',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],m=updateMemory(undefined,t.items[0],true,t.items[0].answerId)!;m.card.due=new Date(Date.now()-1000);m.card.state=2;m.status='review';await d.learningState.put(learningRow(m));const wrongs=t.options.filter(o=>o.id!==t.items[0].answerId).slice(0,2);
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrongs[0].id,latencyMs:1200});await svc.answer({sessionId:s.id,taskId:t.id,answer:wrongs[1].id,latencyMs:5000});await Promise.all([svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId,latencyMs:9000}),svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId})]);
 const event=(await d.reviewEvents.get(t.id))!,after=(await d.learningState.get(m.id))!.payload;assert.equal(await d.reviewEvents.count(),1);assert.equal(event.payload.score,0);assert.equal(event.payload.metadata.firstAttemptLatencyMs,1200);assert.deepEqual(event.payload.metadata.wrongChoices,wrongs.map(o=>o.id));assert.equal(after.card.reps,m.card.reps+1);assert.equal(after.card.lapses,m.card.lap... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));
test('first successful bootstrap probe is real Good; a new failed probe is not a memory lapse',()=>setup(async(d,svc)=>{
 let s=await svc.startFeed('all','choice'),t=s.tasks[0];await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal((await d.learningState.get(t.items[0].targetId))!.payload.card.reps,1);s=await svc.advanceFeed(s.id);t=s.tasks[0];await svc.answer({sessionId:s.id,taskId:t.id,answer:t.options.find(o=>o.id!==t.items[0].answerId)!.id});await svc.answer({sessionId:s.id,taskId... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));
test('invalid options and unfinished advance cannot change progress',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice');await assert.rejects(svc.answer({sessionId:s.id,taskId:s.tasks[0].id,answer:'invalid'}));await assert.rejects(svc.advanceFeed(s.id));assert.equal(await d.reviewEvents.count(),0);assert.equal((await d.activeSessions.get(s.id))!.tasks[0].id,s.tasks[0].id);
}));
test('an aborted final event rolls back memory and preserves correction draft for one safe retry',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!,before=(await d.learningState.get(t.items[0].targetId))!.payload;await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});const fail=()=>{throw Error('event-write-failure')};d.reviewEvents.hook('creating',fail);await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:t.ite... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));
test('timeline scale is shared and narrow dates cannot all pass without adjusting the neutral default',()=>{
 for(const years of [[1800,1850,1900],[1871,1872,1873]]){const b=fixture();b.facts=b.facts.filter(f=>f.key==='date').slice(0,3).map((f,n)=>({...f,dateStart:years[n]+'-01-01',dateEnd:years[n]+'-12-31'}));const tasks=composeFeed(b,[],'all','timeline','daily');assert.equal(tasks.length,1);const scale=tasks[0].timeline!;assert(years.filter(y=>Math.abs(y-scale.initial)<=15).length<years.length/2);asser... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
});
test('ordinary property image and name cues share one unit and adding images keeps imageless properties',()=>{
 const b=fixture(),before=canonicalTargets(b).filter(i=>i.factId?.startsWith('f'));b.media.push({id:'img',entityId:'s0',role:'primary',url:'engi-media://'+'a'.repeat(64),origin:'user',license:'Личное'});const clone=structuredClone(b),after=canonicalTargets(clone).filter(i=>i.factId?.startsWith('f'));assert.equal(after.length,8);assert(before.every(i=>after.some(x=>x.targetId===i.targetId)));const ... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
});
test('one scheduled unit creates one useful question and no non-due refill',()=>{
 const b=fixture();b.entities=b.entities.slice(0,2);b.facts=b.facts.filter(f=>f.id==='f0');const i=canonicalTargets(b)[0],m=updateMemory(undefined,i,true,i.answerId)!;assert.equal(composeFeed(b,[m]).length,0);m.card.due=new Date(Date.now()-1000);assert.equal(composeFeed(b,[m]).length,1);
});
test('Recall cannot grade before reveal; early reveal is not itself a review',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','recall_reveal'),t=s.tasks[0];await assert.rejects(svc.answer({sessionId:s.id,taskId:t.id,answer:true}));await svc.saveInteraction(s.id,t.id,{recallElapsedMs:1200});await assert.rejects(svc.saveInteraction(s.id,t.id,{revealed:true}));await svc.saveInteraction(s.id,t.id,{recallElapsedMs:1200,earlyReveal:true,revealed:true});assert.equal(await d.reviewEvents.count(... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));
test('objective failure reduces trust in repeated confident self-reports',()=>setup(async(d,svc)=>{
 const s=await svc.startFeed('all','choice'),t=s.tasks[0],m=(await d.learningState.get(t.items[0].targetId))!.payload;m.selfReport={remembered:3,missed:0,objectiveSuccesses:0,objectiveFailures:0};await d.learningState.put(learningRow(m));await svc.answer({sessionId:s.id,taskId:t.id,answer:t.options.find(o=>o.id!==t.items[0].answerId)!.id});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.item... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));

```

### File: res://tests/helpers22.ts
```typescript
import type {EngiDB} from '../src/db/engi-db';
import {getBundle,learningRow} from '../src/db/repositories';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
/** Real due states let storage/review regressions bypass the independent Intro UI. */
export async function prepareDue(d:EngiDB){
 for(const item of canonicalTargets(await getBundle(d))){const old=await d.learningState.get(item.targetId),m=old?.payload??triagedMemory(item,'red','',0);m.card.due=new Date(Date.now()-1000);if(m.bootstrap)m.bootstrap.sessionId=undefined;await d.learningState.put(learningRow(m))}
}

```

### File: res://tests/learning22.test.ts
```typescript
import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCard,type Card} from 'ts-fsrs';
import {mergeLegacyStates,legacyUnitId} from '../src/lib/engi/learning/knowledge-unit';
import type {Bundle,Memory} from '../src/lib/engi/types';
import Dexie from 'dexie';
import {EngiDB} from '../src/db/engi-db';
import {storesV2} from '../src/db/migrations';
import {getSnapshot,learningRow} from '../src/db/repositories';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {saveKnowledge} from '../src/services/knowledge-service';
import {triagedMemory,reviewLearning} from '../src/lib/engi/learning/bootstrap';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {createTrainerService} from '../src/services/trainer-service';
import {setUnitSuspended} from '../src/services/learning-service';
async function setup(run:(d:EngiDB,svc:ReturnType<typeof createTrainerService>)=>Promise<void>){const d=new EngiDB('learning22-'+crypto.randomUUID());try{await saveKnowledge(fixture(),d);await run(d,createTrainerService(d))}finally{d.close();await d.delete()}}
async function ready(d:EngiDB){for(const i of canonicalTargets((await getSnapshot(d)).bundle)){const m=triagedMemory(i,'red','',0);m.card.due=new Date(Date.now()-1000);await d.learningState.put(learningRow(m))}}
export function fixture():Bundle {const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'sample',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'party',name:'Партия',valueKind:'entity',subjectTypes:['sample'],targetTypes:['answer'],cardinality:'one',learnable:true},{id:'birth_date',name:'Дата рождения',valueKind:'date',subjectType... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
test('legacy cue variants map to one ordinary property and merge conservatively',()=>{
 const b=fixture(),id='ku:fact:f0:forward',a:Memory={id:'fact:f0:name_to_party',card:{...createEmptyCard<Card>(new Date()),due:new Date('2026-10-08'),stability:50,difficulty:3,reps:5},attempts:6,correct:5,confusions:{a1:1},firstSuccessAt:'2026-09-01'},c:Memory={...a,id:'fact:f0:image_to_party',card:{...a.card,due:new Date('2026-10-07'),stability:8,difficulty:7},correct:3,confusions:{a2:2}};
 assert.equal(legacyUnitId(a.id,b),id);assert.equal(legacyUnitId(c.id,b),id);
 const result=mergeLegacyStates([a,c],b),merged=result.states.find(m=>m.id===id)!;
 assert.equal(merged.card.stability,8);assert.equal(merged.card.difficulty,7);assert.equal(new Date(merged.card.due).toISOString(),new Date('2026-10-07').toISOString());assert.equal(merged.correct,3);
 assert.equal(result.mappings.length,2);assert.equal(result.states.find(m=>m.id===a.id)!.legacyOf,id);
 assert.deepEqual(mergeLegacyStates(result.states,b).states,result.states);
});

test('actual v2 upgrade preserves original history and maps old cues once through backup restore',async()=>{
 const name='upgrade22-'+crypto.randomUUID(),old=new Dexie(name);old.version(2).stores(storesV2);const b=fixture();await old.open();await old.table('entities').bulkPut(b.entities);await old.table('facts').bulkPut(b.facts);
 const m:Memory={id:'fact:f0:name_to_party',card:{...createEmptyCard<Card>(new Date()),stability:12,difficulty:6,reps:3},attempts:3,correct:2,confusions:{a1:2},firstSuccessAt:new Date().toISOString()};await old.table('learningState').put({id:m.id,payload:m,dueAt:new Date().toISOString(),stability:12,covered:1});const event={id:'old-review',timestamp:new Date().toISOString(),recipe:'old',level:'dir... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 const d=new EngiDB(name),target=new EngiDB('restore22-'+crypto.randomUUID());try{const snapshot=await getSnapshot(d);assert(snapshot.memories.some(m=>m.id==='ku:fact:f0:forward'));assert(!snapshot.memories.some(m=>m.id.startsWith('fact:')));assert.deepEqual(await d.reviewEvents.get(event.id),event);assert.equal(await d.targetMappings.count(),1);const backup=await exportBackup(d);await restoreBack... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
});

test('familiarity does not create success and bootstrap intervals depend on actual property probes',()=>{
 const item=canonicalTargets(fixture())[0],now=new Date('2026-10-06T12:00:00Z');
 for(const [color,days] of [['red',1],['orange',2],['yellow',3],['green',7]] as const){const m=triagedMemory(item,color,'session',0,now);assert.equal(m.card.reps,0);assert.equal(m.firstSuccessAt,undefined);assert.equal(m.objectiveReviews,0);const result=reviewLearning(m,item,true,true,false,false,1200,now);assert.equal(new Date(result.memory.card.due).getTime()-now.getTime(),days*86400000);assert.... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 const suspended=triagedMemory(item,'suspended','session',0,now);assert.equal(suspended.status,'suspended');assert.equal(suspended.card.reps,0);
});

test('bootstrap failure demotes green and repair preserves the next due and FSRS card',()=>{
 const item=canonicalTargets(fixture())[0],now=new Date('2026-10-06T12:00:00Z'),m=triagedMemory(item,'green','session',0,now),fail=reviewLearning(m,item,false,true,false,false,500,now);
 assert.equal(fail.memory.status,'learning');assert.equal(fail.memory.card.reps,0);assert.equal(fail.memory.bootstrap!.successes,0);assert.equal(new Date(fail.memory.card.due).getTime()-now.getTime(),86400000);
 const repaired=reviewLearning(fail.memory,item,true,true,true,false,600,now);assert.deepEqual(repaired.memory.card,fail.memory.card);assert.equal(repaired.fsrsUpdated,false);
});

test('Object Intro persists colors, creates no review, suspends only the selected unit and daily budget survives restarts',()=>setup(async(d,svc)=>{
 let s=await svc.startFeed();assert(s.intro);assert.equal(await d.reviewEvents.count(),0);const [a,c]=s.intro.unitIds;
 await svc.saveIntroSelection(s.id,a,'green');await svc.saveIntroSelection(s.id,c,'suspended');s=(await svc.getResumableSession())!;assert.equal(s.intro!.selections[a],'green');s=await svc.completeIntro(s.id);
 assert.equal((await d.learningState.get(a))!.payload.card.reps,0);assert.equal((await d.learningState.get(c))!.payload.status,'suspended');assert.equal(await d.reviewEvents.count(),0);
 for(let n=0;n<2;n++){s=await svc.startFeed();assert(s.intro);s=await svc.completeIntro(s.id)}s=await svc.startFeed();assert.equal(s.exhausted,true);assert.equal((await d.appMeta.get('newLearning'))!.value.introducedEntityIds.length,3);
}));

test('properties are independent; forced correction is one failed review and preserves first latency',()=>setup(async(d,svc)=>{
 await ready(d);let s=await svc.startFeed('all','choice'),t=s.tasks[0],siblings=(await d.learningState.toArray()).find(r=>r.id!==t.items[0].targetId&&r.id.includes(`:${t.items[0].entityId.replace('s','d')}:`));const before=siblings&&structuredClone(siblings.payload);
 const wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id,latencyMs:450});assert.equal(await d.reviewEvents.count(),0);
 const [one,two]=await Promise.all([svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId,latencyMs:9000}),svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId,latencyMs:10000})]);assert.equal(await d.reviewEvents.count(),1);assert.equal(one.event!.payload.score,0);assert.equal(two.event!.payload.metadata.firstAttemptLatencyMs,450);assert.equal((await d.learningState.get(t... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));

test('after each answer stale tasks disappear and sibling properties are separated by unrelated entities',()=>setup(async(d,svc)=>{
 await ready(d);let s=await svc.startFeed('all','choice');const seen:string[]=[];
 for(let n=0;n<12;n++){const t=s.tasks[0];assert(t);assert(!seen.slice(-6).includes(t.items[0].entityId));seen.push(t.items[0].entityId);const clone={...t,id:crypto.randomUUID()};s.tasks.push(clone);await d.activeSessions.put(s);await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});assert.equal((await d.activeSessions.get(s.id))!.tasks.length,1);s=await svc.advanceFeed(s.id,fal... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));

test('one non-due unit stops main mode; unscheduled practice never changes its FSRS card',async()=>{
 const d=new EngiDB('single22-'+crypto.randomUUID());try{const b=fixture();b.entities=b.entities.slice(0,2);b.facts=b.facts.filter(f=>f.id==='f0');await saveKnowledge(b,d);const item=canonicalTargets((await getSnapshot(d)).bundle)[0],m=triagedMemory(item,'green','',0);m.card.due=new Date(Date.now()+86400000);m.status='review';await d.learningState.put(learningRow(m));const svc=createTrainerService... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
});

test('Suspend and resume retain past memory without counting suspended units as learned',()=>setup(async(d,svc)=>{
 await ready(d);const m=(await d.learningState.toArray())[0];await setUnitSuspended(m.id,true,d);assert.equal((await d.learningState.get(m.id))!.payload.status,'suspended');let s=await svc.startFeed('all','choice');assert.notEqual(s.tasks[0].items[0].targetId,m.id);await setUnitSuspended(m.id,false,d);assert.equal((await d.learningState.get(m.id))!.payload.status,'triaged');assert.equal((await d.l... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));



```

### File: res://tests/local.test.ts
```typescript
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';
import {createTrainerService} from '../src/services/trainer-service';
import {emptyBundle,getSnapshot,putBundle,contentTables,historyPage} from '../src/db/repositories';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {importPack} from '../src/services/pack-service';
import {sha256} from '../src/services/pack-format';
import {mediaStore} from '../src/media/media-store';
import {ZipWriter,BlobWriter,TextReader,BlobReader} from '@zip.js/zip.js';
import {buildIndexes} from '../src/lib/engi/indexes';
import {prepareDue} from './helpers22';
import type {Bundle} from '../src/lib/engi/types';
const cache=new Map<string,Response>();Object.defineProperty(globalThis,'caches',{value:{open:async()=>({match:async(k:string)=>cache.get(k)?.clone(),put:async(k:string,r:Response)=>{cache.set(k,r.clone())},delete:async(k:string)=>cache.delete(k)}),keys:async()=>['engi-media-v1']},configurable:true});
const seed:Bundle=JSON.parse(await readFile(new URL('./fixtures/seed.json',import.meta.url),'utf8'));
const image=new Blob([await readFile(new URL('../public/icon-192.png',import.meta.url))],{type:'image/png'});const hash=await sha256(image);
function localSeed(){const b=structuredClone(seed);b.media=b.media.map(m=>({...m,url:'engi-media://'+hash}));return b}
async function populate(d:EngiDB){await d.transaction('rw',contentTables(d),()=>putBundle(d,localSeed()))}
async function archive(version=1,mutate?:(b:any,m:any)=>void,extra?:string){const b=structuredClone(seed);b.media=b.media.map(m=>({...m,url:'media/image.png'}));const m={format:'engi-pack',schemaVersion:1,packId:'test.art',packVersion:version,name:'Test',createdAt:new Date().toISOString(),files:[{path:'media/image.png',bytes:image.size,sha256:hash,mime:'image/png'}]};mutate?.(b,m);const w=new ZipW... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
async function dbTest(run:(d:EngiDB)=>Promise<void>){const d=new EngiDB('engi-test-'+crypto.randomUUID());try{await run(d)}finally{d.close();await d.delete()}}

test('empty DB, indexed context and local persistence across service recreation',async()=>dbTest(async d=>{
 assert.equal((await getSnapshot(d)).bundle.entities.length,0);await populate(d);await prepareDue(d);
 const ix=buildIndexes(localSeed());assert.equal(ix.entityById.size,seed.entities.length);
 const baseline=await d.learningState.toArray(),svc=createTrainerService(d),session=await svc.startFeed('all','choice'),task=session.tasks[0];
 const result=await svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId});assert.equal(result.feedback.score,1);assert.equal(await d.learningState.count(),baseline.length);
 d.close();const reopened=new EngiDB(d.name);try{const snapshot=await createTrainerService(reopened).getSnapshot();assert.equal(snapshot.memories.find(m=>m.id===task.items[0].targetId)!.attempts,1);assert.equal(snapshot.events.length,1);for(const sibling of baseline.filter(r=>r.id!==task.items[0].targetId))assert.deepEqual(await reopened.learningState.get(sibling.id),sibling);assert.equal((await c... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));

test('concurrent double submit is idempotent and event/state are atomic',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d),session=await svc.startFeed('all','choice'),task=session.tasks[0],input={sessionId:session.id,taskId:task.id,answer:task.items[0].answerId};
 await Promise.all([svc.answer(input),svc.answer(input)]);assert.equal(await d.reviewEvents.count(),1);assert.equal((await d.learningState.get(task.items[0].targetId))?.payload.attempts,1);assert.equal((await d.activeSessions.get(session.id))?.results.length,1);
}));

test('failed initial probe, confusion harvest, direct match and session resume',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d);let s=await svc.startFeed('all','choice');const t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});assert.equal(await d.reviewEvents.count(),0);await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 const failed=(await d.learningState.get(t.items[0].targetId))!.payload;assert.equal(failed.card.reps,0);assert.equal(failed.card.lapses,0);assert.equal(failed.attempts,1);assert.equal(failed.confusions[wrong.id],1);
 let found=false;for(let n=0;n<12;n++){s=await svc.advanceFeed(s.id);const current=s.tasks[0];assert(current);if(current.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,current.id,{recallElapsedMs:5000,revealed:true});await svc.answer({sessionId:s.id,taskId:current.id,answer:current.recipe.format==='recall_reveal'?true:current.items[0].answerId});if(current.retryOf===t.id){found=tru... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 assert(found);const memory=(await d.learningState.get(t.items[0].targetId))!.payload;assert(memory.confusions[wrong.id]>0);assert.equal(memory.attempts,failed.attempts);assert.deepEqual(memory.card,failed.card);
 const match=await svc.startFeed('all','match'),mt=match.tasks[0],before=await d.reviewEvents.count();assert.equal(mt.recipe.format,'match');await svc.answer({sessionId:match.id,taskId:mt.id,answer:mt.items[0].answerId});assert.equal(await d.reviewEvents.count(),before+1);assert((await d.reviewEvents.get(mt.id))?.payload.targets.every((e:any)=>e.level==='direct'));const next=await svc.advanceFeed(... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));

test('backup catastrophe: restore without content then reimport stable IDs',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d),session=await svc.startFeed('all','choice'),task=session.tasks[0];await svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId,confidence:'high'});
 const backup=JSON.parse(JSON.stringify(await exportBackup(d)));assert(!('bundle' in backup));assert(!('media' in backup));const target=new EngiDB('engi-catastrophe-'+crypto.randomUUID());try{await restoreBackup(backup,target);assert.equal(await target.entities.count(),0);assert.deepEqual(JSON.parse(JSON.stringify(await target.learningState.toArray())),backup.learningState);assert.equal(await targ... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));

test('pack import twice, v2 stable targets, deduplicated image and no progress reset',async()=>dbTest(async d=>{
 cache.clear();await importPack(await archive(),()=>{},d);await prepareDue(d);const svc=createTrainerService(d),session=await svc.startFeed('all','choice'),t=session.tasks[0];await svc.answer({sessionId:session.id,taskId:t.id,answer:t.items[0].answerId});const before=JSON.stringify(await d.learningState.toArray());await importPack(await archive(),()=>{},d);assert.equal(await d.entities.count(),see... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));

test('bad ZIP paths, hashes, unknown schema, missing references, duplicates leave old data intact',async()=>dbTest(async d=>{await importPack(await archive(),()=>{},d);const before=JSON.stringify(await getSnapshot(d));for(const zip of [await archive(2,undefined,'../evil'),await archive(2,(_b,m)=>m.files[0].sha256='0'.repeat(64)),await archive(2,(_b,m)=>m.schemaVersion=99),await archive(2,b=>b.medi... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

test('editing a fact resets only its targets; reports stay offline and append-only',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d);let session=await svc.startFeed('all','choice');const first=session.tasks[0];for(let n=0;n<4;n++){const t=session.tasks[0];await svc.answer({sessionId:session.id,taskId:t.id,answer:t.items[0].answerId});session=await svc.advanceFeed(session.id)}
 const s=await getSnapshot(d),fact=s.bundle.facts.find(f=>f.valueKind==='date')!,entity=s.bundle.entities.find(e=>e.id===fact.entityId)!,before=await d.reviewEvents.count(),memories=await d.learningState.toArray();
 const affected=memories.filter(m=>m.id.startsWith(`ku:fact:${fact.id}:`));assert(affected.length>0);await svc.editEntity({entityId:entity.id,name:entity.name,facts:[{...fact,year:1901}]});
 for(const m of affected)assert.equal(await d.learningState.get(m.id),undefined);for(const sibling of memories.filter(m=>!affected.some(a=>a.id===m.id)))assert.deepEqual(await d.learningState.get(sibling.id),sibling);
 assert.equal(await d.reviewEvents.count(),before);await svc.reportQuestion(first.id,'Ошибка');const report=(await d.reviewEvents.where('recipe').equals('report').first())!;await svc.resolveReport(report.id);await svc.resolveReport(report.id);assert.equal(await d.reviewEvents.where('recipe').equals('report_resolved').count(),1);
}));

test('an aborted event write rolls back FSRS and session result',async()=>dbTest(async d=>{
 await populate(d);await prepareDue(d);const svc=createTrainerService(d),session=await svc.startFeed('all','choice'),task=session.tasks[0],before=await d.learningState.toArray();
 const fail=()=>{throw Error('simulated write failure')};d.reviewEvents.hook('creating',fail);await assert.rejects(svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId}));d.reviewEvents.hook('creating').unsubscribe(fail);
 assert.deepEqual(await d.learningState.toArray(),before);assert.equal(await d.reviewEvents.count(),0);assert.equal((await d.activeSessions.get(session.id))?.results.length,0);await svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId});assert.equal(await d.learningState.count(),before.length);assert.equal((await d.learningState.get(task.items[0].targetId))!.payload.attemp... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));

test('snapshot limits history but backup preserves every event and settings',async()=>dbTest(async d=>{await d.reviewEvents.bulkAdd(Array.from({length:1007},(_,i)=>({id:'history-'+i,timestamp:new Date(1700000000000+i).toISOString(),recipe:'report',level:'report',targetIds:[],payload:{reason:'test '+i}})));await d.appMeta.put({key:'customSetting',value:{goal:15}});assert.equal((await getSnapshot(d)... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

```

### File: res://tests/motivation.test.ts
```typescript
import 'fake-indexeddb/auto';
import {prepareDue} from './helpers22';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {EngiDB} from '../src/db/engi-db';
import {getSnapshot,learningRow} from '../src/db/repositories';
import * as knowledge from '../src/services/knowledge-service';
import {recipes,eligible,canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {updateMemory} from '../src/lib/engi/engine';
import {composeFeed} from '../src/lib/engi/session/composer';
import {createTrainerService} from '../src/services/trainer-service';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import type {Bundle} from '../src/lib/engi/types';
function fixture():Bundle{const b:Bundle={entities:[],facts:[],media:[],tags:[{id:'set',name:'Моя подборка'}],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'s',name:'Объект'},{id:'a',name:'Ответ'}],properties:[{id:'p',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['s'],targetTypes:['a']}]};for(let i=0;i<6;i++){b.entities.push({id:'s'+i,type:'s',name:'Объек... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
async function setup(run:(d:EngiDB)=>Promise<void>){const d=new EngiDB('motivation-'+crypto.randomUUID());try{await knowledge.saveKnowledge(fixture(),d);await run(d)}finally{d.close();await d.delete()}}

test('accept upstream fact resets only its own targets and clears conflict',()=>setup(async d=>{
 const b=fixture(),r=recipes(b).find(r=>r.answerKey==='p'&&r.format==='choice')!,items=eligible(b,r);
 for(const i of items.slice(0,2))await d.learningState.put(learningRow(updateMemory(undefined,i,true,i.answerId)!));
 const old=(await d.facts.get('f0'))!;await d.facts.put({...old,origin:'pack',originPackId:'sample',originPackVersion:1,userModified:true,upstreamConflict:true,upstreamValue:{...old,valueEntityId:'a2'}});
 await (knowledge as any).resolvePackConflict('facts','f0','pack',d);
 assert.equal((await d.facts.get('f0'))!.valueEntityId,'a2');assert.equal((await d.facts.get('f0'))!.upstreamConflict,false);assert.equal((await d.facts.get('f0'))!.userModified,false);
 assert.equal(await d.learningState.get(items[0].targetId),undefined);assert(await d.learningState.get(items[1].targetId));
}));

test('keep local fact clears conflict without changing memory and remembers upstream acknowledgement',()=>setup(async d=>{
 const b=fixture(),i=eligible(b,recipes(b).find(r=>r.answerKey==='p'&&r.format==='choice')!)[0];await d.learningState.put(learningRow(updateMemory(undefined,i,true,i.answerId)!));const before=await d.learningState.toArray(),old=(await d.facts.get('f0'))!;
 await d.facts.put({...old,origin:'pack',originPackId:'sample',userModified:true,upstreamConflict:true,upstreamValue:{...old,valueEntityId:'a2'}});
 await (knowledge as any).resolvePackConflict('facts','f0','mine',d);const next=(await d.facts.get('f0'))! as any;
 assert.equal(next.valueEntityId,'a0');assert.equal(next.upstreamConflict,false);assert(next.upstreamAcknowledged);assert.deepEqual(await d.learningState.toArray(),before);
}));

test('invalid upstream relation cannot corrupt existing graph or dismiss conflict',()=>setup(async d=>{
 const old=(await d.facts.get('f0'))!;await d.facts.put({...old,upstreamConflict:true,upstreamValue:{...old,valueEntityId:'absent'}});
 await assert.rejects((knowledge as any).resolvePackConflict('facts','f0','pack',d));assert.equal((await d.facts.get('f0'))!.valueEntityId,'a0');assert.equal((await d.facts.get('f0'))!.upstreamConflict,true);
}));

test('home hook uses real due memories and otherwise actual new objects',async()=>{
 const {returnHook}=await import('../src/lib/engi/knowledge/motivation');const b=fixture(),i=eligible(b,recipes(b).find(r=>r.answerKey==='p'&&r.format==='choice')!)[0],m=updateMemory(undefined,i,true,i.answerId)!;m.card.due=new Date(Date.now()-1000);
 assert.equal(returnHook({bundle:b,memories:[m],events:[]})!.kind,'due');assert.equal(returnHook({bundle:b,memories:[],events:[]})!.count,3);
 assert.equal(returnHook({bundle:{...b,entities:[],facts:[],entityTags:[]},memories:[],events:[]}),null);
});

test('daily progress counts completed retrievals, excludes diagnostics and reports real stability crossings',async()=>{
 const {todayLearning}=await import('../src/lib/engi/knowledge/motivation');const now=new Date();
 const s={bundle:fixture(),memories:[],events:[{id:'a',timestamp:now.toISOString(),recipe:'choice',level:'direct',payload:{score:0,metadata:{stabilityTransitions:[]}}},{id:'b',timestamp:now.toISOString(),recipe:'choice',level:'direct',payload:{score:1,metadata:{stabilityTransitions:[{targetId:'x',before:29,after:31}]}}},{id:'c',timestamp:now.toISOString(),recipe:'timeline',level:'diagnostic',paylo... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 assert.deepEqual(todayLearning(s,now),{retrievals:2,stability30Gains:1});
});

test('low-trust repeated self-grades are checked by objective choices, not more Recall',()=>{
 const b=fixture();b.properties![0].learning={match:'off',categorize:'off'};
 const memories=canonicalTargets(b).map(i=>({...updateMemory(undefined,i,true,i.answerId)!,selfReport:{remembered:5,missed:0,objectiveFailures:2,objectiveSuccesses:0}}));
 for(const m of memories)m.card.due=new Date(Date.now()-1000);
 const tasks=composeFeed(b,memories,'all','mixed','weak',[],12);assert(tasks.length>=6);assert(tasks.every(t=>t.recipe.format==='choice'));assert(tasks.some(t=>t.reason==='calibration'));
});

test('self-grade calibration and acknowledged local content survive backup and restore',()=>setup(async d=>{
 const b=fixture(),i=canonicalTargets(b)[0],m={...updateMemory(undefined,i,true,i.answerId)!,selfReport:{remembered:3,missed:1,objectiveFailures:1,objectiveSuccesses:2}};await d.learningState.put(learningRow(m));
 const backup=JSON.parse(JSON.stringify(await exportBackup(d))),target=new EngiDB('backup-'+crypto.randomUUID());try{await restoreBackup(backup,target);assert.deepEqual((await target.learningState.get(m.id))!.payload.selfReport,m.selfReport)}finally{target.close();await target.delete()}
}));

test('a quick near-twin repair does not schedule FSRS twice and decays observed confusion',()=>setup(async d=>{
 await prepareDue(d);const svc=createTrainerService(d);let s=await svc.startFeed('all','choice');const t=s.tasks[0],wrong=t.options.find(o=>o.id!==t.items[0].answerId)!;
 const established=updateMemory(undefined,t.items[0],true,t.items[0].answerId)!;established.card.due=new Date(Date.now()-1000);established.status='review';await d.learningState.put(learningRow(established));await svc.answer({sessionId:s.id,taskId:t.id,answer:wrong.id});await svc.answer({sessionId:s.id,taskId:t.id,answer:t.items[0].answerId});
 const before=(await d.learningState.get(t.items[0].targetId))!.payload;let repaired=false;
 for(let n=0;n<10;n++){s=await svc.advanceFeed(s.id);const next=s.tasks[s.currentPosition];if(next.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,next.id,{recallElapsedMs:5000,revealed:true});await svc.answer({sessionId:s.id,taskId:next.id,answer:next.recipe.format==='recall_reveal'?true:next.items[0].answerId});if(next.retryOf===t.id){const after=(await d.learningState.get(t.items... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 assert(repaired);
}));

```

### File: res://tests/production.mjs
```
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ZipWriter,BlobWriter,TextReader,BlobReader,configure} from '@zip.js/zip.js';
import {chromium} from 'playwright';

// This fixture is imported through the production UI and its real worker.
const png=await readFile(new URL('../public/icon-192.png',import.meta.url));
const hash=createHash('sha256').update(png).digest('hex');
const bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'offline-s',name:'Объект'},{id:'offline-a',name:'Автор'}],properties:[{id:'offline-author',name:'Автор',valueKind:'entity',subjectTypes:['offline-s'],targetTypes:['offline-a'],cardinality:'one',learnable:true}]};
for(let i=0;i<8;i++){
 bundle.entities.push({id:'offline-s'+i,type:'offline-s',name:'Объект '+i,aliases:[],externalIds:{}},{id:'offline-a'+i,type:'offline-a',name:'Автор '+i,aliases:[],externalIds:{}});
 bundle.facts.push({id:'offline-f'+i,entityId:'offline-s'+i,key:'offline-author',valueKind:'entity',valueEntityId:'offline-a'+i,verification:'verified',source:{kind:'url',name:'Проверочный набор',url:'https://example.org/fixture/'+i}});
 bundle.media.push({id:'offline-m'+i,entityId:'offline-s'+i,role:'primary',primary:true,url:'media/example.png',sourceUrl:'https://example.org/fixture/'+i,license:'Test fixture'});
}
const manifest={format:'engi-pack',schemaVersion:2,packId:'offline.acceptance',packVersion:1,name:'Проверка офлайн',createdAt:new Date().toISOString(),files:[{path:'media/example.png',bytes:png.length,sha256:hash,mime:'image/png'}]};
configure({useWebWorkers:false});const writer=new ZipWriter(new BlobWriter());
await writer.add('manifest.json',new TextReader(JSON.stringify(manifest)));await writer.add('bundle.json',new TextReader(JSON.stringify(bundle)));await writer.add('media/example.png',new BlobReader(new Blob([png],{type:'image/png'})),{level:0});
const pack=Buffer.from(await (await writer.close()).arrayBuffer());
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});
const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const page=await context.newPage();page.setDefaultTimeout(10000);
const workers=[];page.on('worker',worker=>workers.push(worker.url()));
async function snapshot(){return page.evaluate(async()=>{const d=await new Promise((resolve,reject)=>{const r=indexedDB.open('engi');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{return await new Promise((resolve,reject)=>{const tx=d.transaction(['activeSessions','reviewEvents','installedPacks','learningState','appMeta'],'readonly'),out={};for(const name of tx.objectStoreNa... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
try{
 await page.goto(process.env.ENGI_PRODUCTION_URL??'http://127.0.0.1:4173/engi/');await page.waitForSelector('.feed-home');
 await page.evaluate(()=>{window.__toastHistory=[];new MutationObserver(()=>{for(const toast of document.querySelectorAll('[data-sonner-toast]'))if(!window.__toastHistory.includes(toast.textContent))window.__toastHistory.push(toast.textContent)}).observe(document.body,{childList:true,subtree:true})});
 await page.locator('input[type=file]').setInputFiles({name:'offline.engi',mimeType:'application/zip',buffer:pack});
 await page.getByText('Пакет импортирован',{exact:true}).waitFor();
 assert.equal((await snapshot()).installedPacks.length,1);assert(workers.some(url=>url.includes('/assets/')&&url.endsWith('.js')),'Production import must create its real bundled worker');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.reload();await page.waitForSelector('.feed-home');
 assert(await page.evaluate(()=>!!navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.waitForSelector('.feed-home');await page.waitForFunction(()=>document.querySelector('.home-art img')?.naturalWidth>0);
 await page.getByLabel('Формат',{exact:true}).selectOption('choice');await page.getByRole('button',{name:'Начать',exact:true}).click();
 const introIds=[];
 for(let n=0;n<3;n++){
  await page.locator('#object-intro-heading').waitFor();const intro=(await snapshot()).activeSessions.find(s=>s.status==='active').intro;assert(intro);introIds.push(intro.entityId);
  await page.waitForFunction(()=>document.querySelector('.learning22-portrait')?.naturalWidth>0);
  const green=page.getByRole('button',{name:/: Знаю хорошо$/});const count=await green.count();assert(count>=2);
  for(let i=0;i<count;i++){await green.nth(i).click();await page.waitForFunction(()=>document.querySelector('.learning22-screen')?.getAttribute('aria-busy')==='false')}
  await page.getByRole('button',{name:'Готово',exact:true}).click();
  await page.waitForFunction(previous=>document.querySelector('#object-intro-heading')?.textContent!==previous,'Объект '+intro.entityId.replace('offline-s',''));
 }
 await page.locator('#stop-study-heading').waitFor();const introduced=await snapshot();assert.equal(new Set(introIds).size,3);assert.equal(introduced.reviewEvents.length,0);assert.equal(introduced.appMeta.find(row=>row.key==='newLearning').value.introducedEntityIds.length,3);assert(introduced.learningState.every(row=>row.payload.card.reps===0));
 const nextDay=await page.evaluate(()=>Date.now()+2*86400000);await page.clock.setFixedTime(new Date(nextDay));await page.reload();await page.locator('.feed-home').waitFor();
 await page.getByLabel('Формат',{exact:true}).selectOption('choice');await page.getByRole('button',{name:'Начать',exact:true}).click();await page.waitForSelector('.study-feed.state-ready');
 const s=(await snapshot()).activeSessions.find(s=>s.status==='active'),task=s.tasks[s.currentPosition];
 if(task.recipe.cue==='image'&&task.items[0].image)await page.waitForFunction(()=>document.querySelector('.feed-cue img')?.naturalWidth>0);
 const correct=task.options.find(o=>o.id===task.items[0].answerId);await page.getByRole('button',{name:correct.name,exact:true}).click();
 await page.waitForFunction(id=>document.querySelector('.feed-current')?.getAttribute('data-task-id')!==id,task.id);
 assert.equal((await snapshot()).reviewEvents.length,1);const resumeTask=(await snapshot()).activeSessions.find(s=>s.status==='active').tasks[0].id;await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места'}).click();await page.waitForSelector('.study-feed.state-ready');assert.equal((await snapshot()).reviewEvents.length,1);assert.equal(await page.locator('.feed-current'... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 assert(await page.evaluate(async hash=>!!(await (await caches.open('engi-media-v1')).match(new URL('/__engi_media__/'+hash,location.origin))),hash));
 console.log('PASS production worker import, service-worker offline reload, cached image, Intro triage/budget, next-day due review and exact resume');
}catch(error){console.error(await page.evaluate(()=>window.__toastHistory));console.error((await page.locator('body').innerText()).slice(-2200));throw error}finally{await context.close();await browser.close()}

```

### File: res://tests/recall22-browser.mjs
```
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5182/engi/';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const cases=[];
function check(name,run){cases.push({name,run})}
async function mount(page,{failReveal=false,elapsed=0}={}){
 await page.goto(url);
 await page.clock.install({time:new Date('2026-10-06T12:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-06T12:00:01Z'));
 await page.evaluate(async({failReveal,elapsed})=>{
  const reactModule=await import('/engi/node_modules/.vite/deps/react.js');const React=reactModule.default??reactModule;
  const clientModule=await import('/engi/node_modules/.vite/deps/react-dom_client.js');const {createRoot}=clientModule.default??clientModule;
  const {RecallRevealCard}=await import('/engi/src/components/study/RecallRevealCard.tsx');
  const host=document.createElement('div');document.body.replaceChildren(host);
  window.__recall={writes:[],grades:[],failReveal,paused:false,busy:false};
  const root=createRoot(host);
  const task={id:'isolated-recall',recipe:{label:'Вспомните ответ'},items:[{answer:'Проверенный ответ'}]};
  window.__renderRecall=()=>root.render(React.createElement(RecallRevealCard,{task,cue:null,draft:{recallElapsedMs:elapsed},paused:window.__recall.paused,busy:window.__recall.busy,reducedMotion:true,accessible:true,onPersist:async delta=>{window.__recall.writes.push(delta);if(delta.revealed&&window.__recall.failReveal){window.__recall.failReveal=false;throw Error('Temporary write failure')}},onSub... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
  window.__renderRecall();
 },{failReveal,elapsed});
 await page.locator('.recall-thinking').waitFor();
}
async function state(page){return page.evaluate(()=>window.__recall)}
async function reveal(page){await page.getByRole('button',{name:'Показать сейчас',exact:true}).click();await page.locator('.revealed-answer').waitFor()}
async function swipe(page,dx){const box=await page.locator('.recall-swipe').boundingBox();const x=box.x+box.width/2,y=box.y+20;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:12});await page.mouse.up()}

check('Early reveal freezes actual elapsed, never grades, and swipe grades only after reveal',async page=>{
 await mount(page);await swipe(page,150);assert.deepEqual((await state(page)).grades,[]);
 await page.clock.runFor(1234);await reveal(page);
 const before=await state(page),delta=before.writes.find(v=>v.revealed);
 assert.deepEqual(delta,{revealed:true,earlyReveal:true,recallElapsedMs:1234});assert.deepEqual(before.grades,[]);
 await page.clock.runFor(9000);assert.deepEqual((await state(page)).writes,before.writes);
 await swipe(page,-150);assert.deepEqual((await state(page)).grades,[false]);
});
check('Automatic reveal still takes exactly five seconds and requires a grade',async page=>{
 await mount(page);await page.clock.runFor(4999);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.clock.runFor(1);await page.locator('.revealed-answer').waitFor();
 assert.deepEqual((await state(page)).writes.find(v=>v.revealed),{revealed:true,recallElapsedMs:5000});assert.deepEqual((await state(page)).grades,[]);
});
check('Early reveal write failure retries its original elapsed and early flag',async page=>{
 await mount(page,{failReveal:true});await page.clock.runFor(1234);await page.getByRole('button',{name:'Показать сейчас'}).click();
 assert.equal(await page.locator('.revealed-answer').count(),0);await page.clock.runFor(500);await page.locator('.revealed-answer').waitFor();
 const writes=(await state(page)).writes.filter(v=>v.revealed);assert.equal(writes.length,2);assert.deepEqual(writes[0],writes[1]);assert.equal(writes[1].recallElapsedMs,1234);assert.equal(writes[1].earlyReveal,true);
});
check('Pause, hidden time, and busy interactions preserve the remaining active time',async page=>{
 await mount(page,{elapsed:1000});await page.clock.runFor(734);
 await page.evaluate(()=>{window.__recall.paused=true;window.__renderRecall()});assert(await page.getByRole('button',{name:'Показать сейчас'}).isDisabled());await page.clock.runFor(10000);
 assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.evaluate(()=>{window.__recall.paused=false;window.__renderRecall()});await page.clock.runFor(100);
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))});await page.clock.runFor(10000);
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});
 await reveal(page);assert.equal((await state(page)).writes.find(v=>v.revealed).recallElapsedMs,1834);
});
check('Busy blocks early reveal and grading',async page=>{
 await mount(page);await page.evaluate(()=>{window.__recall.busy=true;window.__renderRecall()});
 assert(await page.getByRole('button',{name:'Показать сейчас'}).isDisabled());await page.clock.runFor(1000);
 await page.evaluate(()=>{window.__recall.busy=false;window.__renderRecall()});await reveal(page);
 await page.evaluate(()=>{window.__recall.busy=true;window.__renderRecall()});await swipe(page,150);
 assert.deepEqual((await state(page)).grades,[]);assert(await page.getByRole('button',{name:'Вспомнил',exact:true}).isDisabled());
});
let failed=0;
try{for(const {name,run} of cases){const page=await browser.newPage({viewport:{width:393,height:852}});page.setDefaultTimeout(2500);try{await run(page);console.log('PASS '+name)}catch(error){failed++;console.error('FAIL '+name+'\n'+error.stack)}finally{await page.close()}}}finally{await browser.close()}
if(failed)process.exitCode=1;




```

### File: res://tests/review22.test.ts
```typescript
import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {pickFeed,dailyNewState} from '../src/lib/engi/session/candidate-pool';
import type {Bundle} from '../src/lib/engi/types';
import {EngiDB,type SessionRow} from '../src/db/engi-db';
import {resetLearningProgress} from '../src/services/learning-service';

test('a newly enabled reverse unit belongs to its introduced source object and uses compact property Intro',()=>{
 const b:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],properties:[{id:'relation',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer'],inverse:{enabled:true,name:'Произведение'},learning:{reverse:true},promptTemplates:{reverse:'Что создал {subject}?'}}]};
 for(let n=0;n<3;n++){
  b.entities.push({id:'s'+n,type:'subject',name:'Произведение '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});
  b.facts.push({id:'f'+n,entityId:'s'+n,key:'relation',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}});
 }
 const units=canonicalTargets(b),memories=units.filter(i=>!i.targetId.endsWith(':reverse')).map(i=>triagedMemory(i,'red','old-session',0));
 const now=new Date().toISOString();
 const s:SessionRow={id:'new-session',tag:'all',format:'mixed',mode:'daily',tasks:[],currentPosition:0,results:[],createdAt:now,updatedAt:now,status:'active',timeLeft:90,completedCount:0,cooldown:[]};
 const next=pickFeed(b,memories,s,dailyNewState(undefined),['s0','s1','s2']);
 assert(next.intro);
 assert.equal(next.intro.entityId,'s0');
 assert.equal(next.intro.newProperty,true);
 assert.deepEqual(next.intro.unitIds,['ku:fact:f0:reverse']);
 const reverse=units.find(i=>i.targetId===next.intro!.unitIds[0])!;
 assert.equal(reverse.answer,'Произведение 0');
 assert.equal(reverse.name,'Автор 0');
});

test('resetLearningProgress clears memory, reviews, sessions and meta while keeping content',async()=>{
 const d=new EngiDB('reset-test-'+crypto.randomUUID());
 try{
  await d.learningState.put({id:'ku:test',payload:{} as any,dueAt:new Date().toISOString(),stability:1,covered:1});
  await d.reviewEvents.put({id:'ev:1',timestamp:new Date().toISOString(),recipe:'rec',level:'direct',payload:{},targetIds:['ku:test']});
  await d.activeSessions.put({id:'s:1',tasks:[],currentPosition:0,results:[],mode:'daily',createdAt:'',updatedAt:'',status:'active',timeLeft:60});
  await d.targetMappings.put({legacyId:'leg:1',unitId:'ku:test'});
  await d.appMeta.bulkPut([
   {key:'dailyLearning',value:{retrievals:5}},
   {key:'newLearning',value:{introducedEntityIds:['e1']}},
   {key:'introducedEntities',value:['e1']},
   {key:'reviewsSinceBackup',value:10},
   {key:'studyPreferences',value:{sound:true}},
   {key:'persistentStorage',value:true}
  ]);
  await d.entities.put({id:'e1',type:'person',name:'Person',aliases:[],externalIds:{}});

  await resetLearningProgress(d);

  assert.equal(await d.learningState.count(),0);
  assert.equal(await d.reviewEvents.count(),0);
  assert.equal(await d.activeSessions.count(),0);
  assert.equal(await d.targetMappings.count(),0);
  assert.equal(await d.appMeta.get('dailyLearning'),undefined);
  assert.equal(await d.appMeta.get('newLearning'),undefined);
  assert.equal(await d.appMeta.get('introducedEntities'),undefined);
  assert.equal(await d.appMeta.get('reviewsSinceBackup'),undefined);
  assert.deepEqual(await d.appMeta.get('studyPreferences'),{key:'studyPreferences',value:{sound:true}});
  assert.deepEqual(await d.appMeta.get('persistentStorage'),{key:'persistentStorage',value:true});
  assert.equal(await d.entities.count(),1);
 }finally{
  d.close();
  await d.delete();
 }
});

```

### File: res://tests/templates22.test.ts
```typescript
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ZipWriter,BlobWriter,TextReader,configure} from '@zip.js/zip.js';
import {EngiDB} from '../src/db/engi-db';
import {emptyBundle,getBundle} from '../src/db/repositories';
import {saveProperty} from '../src/services/knowledge-service';
import {importPack} from '../src/services/pack-service';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {propertySchema,validateImport} from '../src/lib/engi/validate';
import type {PropertyDefinition} from '../src/lib/engi/types';

const property=(id='birth_date',name='Дата рождения'):PropertyDefinition=>({id,name,valueKind:'date',cardinality:'one',learnable:true});
const custom:PropertyDefinition={...property('director','Режиссёр'),valueKind:'entity',origin:'user',promptTemplates:{forward:'Кто снял фильм «{subject}»?',reverse:'Какой фильм снял {subject}?',timeline:'Когда вышел фильм «{subject}»?',sort:'Расположите фильмы по дате выхода.'}};

test('import validation preserves all custom question templates',()=>{
 const b={...emptyBundle(),properties:[custom]};
 assert.deepEqual(validateImport(JSON.parse(JSON.stringify(b)),emptyBundle()).properties![0].promptTemplates,custom.promptTemplates);
});

test('templates must be bounded plain strings with recognized placeholders',()=>{
 for(const forward of [42,'x'.repeat(1001),'   ','Когда {answer}?','Когда {subject','<script>alert(1)</script>'])assert.equal(propertySchema.safeParse({...custom,promptTemplates:{forward}}).success,false,String(forward));
 assert.equal(propertySchema.safeParse({...custom,promptTemplates:{forward:'Где {subject}?'}}).success,true);
 assert.equal(propertySchema.safeParse({...custom,promptTemplates:{forward:'Кто автор?',unknown:'x'}}).success,false);
 assert.equal(propertySchema.safeParse({...custom,promptTemplates:{forward:'x'.repeat(1000)}}).success,true);
});

test('built-in and overridden prompts identify the actual property and subject',async()=>{
 const {questionPrompt}=await import('../src/lib/engi/questions/question-templates');
 assert.equal(questionPrompt(property(),'Джон Кеннеди','choice'),'Когда родился Джон Кеннеди?');
 assert.equal(questionPrompt(property('presidency_start'),'Джон Кеннеди','timeline'),'Когда Джон Кеннеди стал президентом?');
 assert.equal(questionPrompt(property('presidency_end'),'Джон Кеннеди','choice'),'Когда закончилось президентство Джон Кеннеди?');
 assert.equal(questionPrompt({...property(),promptTemplates:{forward:'В каком году родился {subject}?'}},'Джон Кеннеди','timeline'),'В каком году родился Джон Кеннеди?');
 assert.equal(questionPrompt(custom,'Психо','choice'),'Кто снял фильм «Психо»?');
 assert.equal(questionPrompt({...custom,promptTemplates:{forward:'{subject}, снова {subject}'}},'$&','recall_reveal'),'$&, снова $&');
 assert.match(questionPrompt(property('custom.date','Дата премьеры'),'Психо','choice'),/Дата премьеры.*Психо/);
 assert.notEqual(questionPrompt(undefined,'Объект','timeline'),'Когда это произошло?');
});

test('group sort and missing instructions refer to the sequence rather than one subject date',async()=>{
 const {questionPrompt}=await import('../src/lib/engi/questions/question-templates');
 for(const format of ['sort','missing'] as const){const prompt=questionPrompt(property(),'Джон Кеннеди',format);assert.match(prompt,/располож|поряд|пропущ|последоват/i);assert.doesNotMatch(prompt,/Когда родился|Джон Кеннеди/)}
 assert.equal(questionPrompt(custom,'Психо','sort'),'Расположите фильмы по дате выхода.');
});

test('reverse requires explicit enablement and a dedicated existing prompt',async()=>{
 const {questionPrompt,reversePromptAvailable}=await import('../src/lib/engi/questions/question-templates');
 assert.equal(reversePromptAvailable(custom),false);
 assert.equal(reversePromptAvailable({...custom,learning:{reverse:true}}),true);
 assert.equal(reversePromptAvailable({...custom,inverse:{enabled:true}}),true);
 assert.equal(reversePromptAvailable({...property(),learning:{reverse:true}}),false);
 assert.equal(reversePromptAvailable({...custom,learning:{reverse:false},inverse:{enabled:true}}),false);
 assert.equal(questionPrompt({...custom,learning:{reverse:true}},'Альфред Хичкок','choice','reverse'),'Какой фильм снял Альфред Хичкок?');
});

test('pack import and backup restore retain templates without source changes',async()=>{
 configure({useWebWorkers:false});
 const d=new EngiDB('templates-pack-'+crypto.randomUUID()),target=new EngiDB('templates-backup-'+crypto.randomUUID());
 try{
  const writer=new ZipWriter(new BlobWriter());
  await writer.add('manifest.json',new TextReader(JSON.stringify({format:'engi-pack',schemaVersion:2,packId:'questions',packVersion:1,name:'Вопросы',createdAt:new Date().toISOString(),files:[]})));
  await writer.add('bundle.json',new TextReader(JSON.stringify({...emptyBundle(),properties:[custom]})));
  await importPack(await writer.close(),()=>{},d);
  assert.deepEqual((await getBundle(d)).properties!.find(p=>p.id==='director')!.promptTemplates,custom.promptTemplates);
  await saveProperty({...custom,promptTemplates:{...custom.promptTemplates,forward:'Кто режиссёр фильма «{subject}»?'}},d);
  const backup=JSON.parse(JSON.stringify(await exportBackup(d)));
  await restoreBackup(backup,target);
  assert.equal((await target.propertyDefinitions.get('director'))!.promptTemplates!.forward,'Кто режиссёр фильма «{subject}»?');
 }finally{d.close();target.close();await d.delete();await target.delete()}
});

```

### File: res://tests/v2.test.ts
```typescript
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {State} from 'ts-fsrs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';
import {storesV1} from '../src/db/migrations';
import {getBundle,getSnapshot,putBundle,emptyBundle,contentTables,learningRow} from '../src/db/repositories';
import {saveKnowledge,saveEntity,saveProperty,saveTag,uploadImage} from '../src/services/knowledge-service';
import {importPack} from '../src/services/pack-service';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {createTrainerService} from '../src/services/trainer-service';
import {recipes,eligible,canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {composeFeed,cooled} from '../src/lib/engi/session/composer';
import {updateMemory,preflight,assess} from '../src/lib/engi/engine';
import {sha256} from '../src/services/pack-format';
import {ZipWriter,BlobWriter,BlobReader,TextReader,configure} from '@zip.js/zip.js';
import {prepareDue} from './helpers22';
import type {Bundle,PropertyDefinition,Fact} from '../src/lib/engi/types';
configure({useWebWorkers:false});
const cache=new Map<string,Response>();Object.defineProperty(globalThis,'caches',{value:{open:async()=>({match:async(k:string)=>cache.get(k)?.clone(),put:async(k:string,r:Response)=>cache.set(k,r.clone()),delete:async(k:string)=>cache.delete(k)}),keys:async()=>['engi-media-v1']},configurable:true});
const seed:Bundle=JSON.parse(await readFile(new URL('./fixtures/seed.json',import.meta.url),'utf8'));
const image=new Blob([await readFile(new URL('../public/icon-192.png',import.meta.url))],{type:'image/png'});const hash=await sha256(image);
async function withDB(run:(d:EngiDB)=>Promise<void>){const d=new EngiDB('v2-'+crypto.randomUUID());try{await run(d)}finally{d.close();await d.delete()}}
function dynamic():Bundle{const b=emptyBundle();b.entityTypes=[{id:'custom.actor',name:'Актёр'},{id:'custom.place',name:'Город'}];b.properties=[{id:'custom.birth_place',name:'Место рождения',valueKind:'entity',subjectTypes:['custom.actor'],targetTypes:['custom.place'],cardinality:'one',learnable:true}];for(let i=0;i<5;i++){b.entities.push({id:'p'+i,type:'custom.actor',name:'Человек '+i,aliases:[],... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
async function zip(b:Bundle,version=1,schemaVersion=1){const raw=structuredClone(b);raw.media=raw.media.map(m=>({...m,url:'media/icon.png'}));const manifest={format:'engi-pack',schemaVersion,packId:'starter',packVersion:version,name:'Starter',createdAt:new Date().toISOString(),files:raw.media.length?[{path:'media/icon.png',bytes:image.size,sha256:hash,mime:'image/png'}]:[]};const w=new ZipWriter(n... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

test('v1 → v2 migration preserves entities, facts, exact learning IDs, events, packs and media',async()=>{const name='migration-'+crypto.randomUUID();const old=new Dexie(name);old.version(1).stores(storesV1);const b=structuredClone(seed);b.media=b.media.map(m=>({...m,url:'engi-media://'+hash}));const r=recipes(b).find(r=>r.answerKey==='created_by'&&r.format==='choice')!;const item=eligible(b,r)[0]... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

test('new type + property + relation generates valid choice without code; insufficient/ambiguous data is excluded',async()=>withDB(async d=>{await saveKnowledge(dynamic(),d);const b=await getBundle(d);const rs=recipes(b).filter(r=>r.answerKey==='custom.birth_place');assert(rs.some(r=>r.format==='choice'));await prepareDue(d);const tasks=composeFeed(b,(await getSnapshot(d)).memories,'all','choice',... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

test('rename and label preserve FSRS; value edit invalidates only dependent targets; tags and archives preserve history',async()=>withDB(async d=>{await saveKnowledge(dynamic(),d);let b=await getBundle(d);const rs=recipes(b).find(r=>r.answerKey==='custom.birth_place'&&r.format==='choice')!;const items=eligible(b,rs);for(const i of items.slice(0,2))await d.learningState.put(learningRow(updateMemory... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

test('v1 pack, user override, upstream update, removed row tombstone and v2 custom pack',async()=>withDB(async d=>{await importPack(await zip(seed),()=>{},d);let b=await getBundle(d);const f=b.facts.find(f=>f.key==='presidency_start')!;await saveKnowledge({facts:[{...f,dateStart:'1900-01-01',dateEnd:'1900-12-31',datePrecision:'year'}]},d);await importPack(await zip(seed,2),()=>{},d);const local=aw... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

test('backup v2 restores user entities/relations/types/properties/tags/overrides and actual user image bytes; v1 remains accepted',async()=>withDB(async d=>{await saveKnowledge(dynamic(),d);await saveTag({id:'mine',name:'Мои знания'},d);await saveKnowledge({entityTags:[{entityId:'p0',tagId:'mine'}]},d);await uploadImage('p0',image,'portrait',d);const backup=JSON.parse(JSON.stringify(await exportBa... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]

test('due builder avoids duplicate and unscheduled units while format controls preserve canonical targets',async()=>withDB(async d=>{
 const b=structuredClone(seed);b.media=b.media.map(m=>({...m,url:'engi-media://'+hash}));await d.transaction('rw',contentTables(d),()=>putBundle(d,b));await prepareDue(d);const memories=(await getSnapshot(d)).memories;
 const first=composeFeed(b,memories,'all','mixed','daily',[],12);assert.equal(first.length,12);for(const task of first)assert(preflight(task));assert.equal(new Set(first.map(t=>t.items[0].targetId)).size,first.length);
 const target=first[0].items[0].targetId,future=memories.map(m=>m.id===target?{...m,card:{...m.card,due:new Date(Date.now()+86400000)}}:m);
 assert(!composeFeed(b,future,'all','mixed','daily',[],memories.length).some(t=>t.items[0].targetId===target));
 assert(!composeFeed(b,memories,'all','mixed','daily',[first[0]],memories.length).some(t=>t.items[0].targetId===target));
 const dynamicB=dynamic(),total=canonicalTargets(dynamicB).length;dynamicB.properties![0].learning={choice:'off',recallReveal:'on'};assert.equal(canonicalTargets(dynamicB).length,total);assert(!recipes(dynamicB).some(r=>r.format==='choice'));
}));

test('feed atomic double submit, retry is delayed and established quick repair does not reschedule FSRS',async()=>withDB(async d=>{
 await saveKnowledge(dynamic(),d);await prepareDue(d);const service=createTrainerService(d),session=await service.startFeed('all','choice'),t=session.tasks[0],answer=t.items[0].answerId;
 await Promise.all([service.answer({sessionId:session.id,taskId:t.id,answer}),service.answer({sessionId:session.id,taskId:t.id,answer})]);assert.equal(await d.reviewEvents.count(),1);assert.equal((await d.learningState.get(t.items[0].targetId))?.payload.attempts,1);
 const next=await service.advanceFeed(session.id);assert.equal(next.completedCount,1);assert.equal(next.tasks.length,1);const original=next.tasks[0],m=updateMemory(undefined,original.items[0],true,original.items[0].answerId)!;m.status='review';m.card.state=State.Review;m.card.reps=3;m.card.last_review=new Date(Date.now()-86400000);m.card.due=new Date(Date.now()-1000);await d.learningState.put(lear... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 await service.answer({sessionId:session.id,taskId:original.id,answer:original.options.find(o=>o.id!==original.items[0].answerId)!.id});await service.answer({sessionId:session.id,taskId:original.id,answer:original.items[0].answerId});const afterFailure=(await d.learningState.get(m.id))!.payload;assert(afterFailure.card.lapses>m.card.lapses);
 const repairSession=(await d.activeSessions.get(session.id))!,pending=repairSession.repairQueue![0];assert.equal(pending.retryAfter,(repairSession.completedCount??0)+4);repairSession.tasks=[pending];repairSession.currentPosition=0;repairSession.repairQueue=[];await d.activeSessions.put(repairSession);
 await service.answer({sessionId:session.id,taskId:pending.id,answer:pending.items[0].answerId});const repaired=(await d.learningState.get(m.id))!.payload;assert.deepEqual(repaired.card,afterFailure.card);assert.equal(repaired.attempts,afterFailure.attempts);assert.equal((await d.reviewEvents.get(pending.id))?.payload.fsrsEnabled,false);assert.equal((await d.reviewEvents.get(pending.id))?.payload.... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 d.close();const reopened=new EngiDB(d.name);try{assert.equal((await createTrainerService(reopened).getResumableSession())?.id,session.id)}finally{reopened.close()}
}));

test('main feed stops when its due units finish and optional practice preserves scheduling',async()=>withDB(async d=>{
 await saveKnowledge(dynamic(),d);await prepareDue(d);const svc=createTrainerService(d);let session=await svc.startFeed('all','choice');const seen=new Set<string>();
 for(let n=0;n<5;n++){const task=session.tasks[0];assert(task);assert(!seen.has(task.items[0].targetId));seen.add(task.items[0].targetId);await svc.answer({sessionId:session.id,taskId:task.id,answer:task.items[0].answerId});session=await svc.advanceFeed(session.id)}
 assert.equal(session.exhausted,true);assert.equal(session.tasks.length,0);assert.equal(session.completedCount,5);assert.equal(await d.reviewEvents.count(),5);
 const before=await d.learningState.toArray();session=await svc.openMore(session.id,true);assert.equal(session.mode,'practice');const task=session.tasks[0];assert(task.practice);if(task.recipe.format==='recall_reveal')await svc.saveInteraction(session.id,task.id,{recallElapsedMs:5000,revealed:true});await svc.answer({sessionId:session.id,taskId:task.id,answer:task.recipe.format==='recall_reveal'?t... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 for(const row of before){const after=(await d.learningState.get(row.id))!.payload;assert.deepEqual(after.card,row.payload.card);assert.equal(after.attempts,row.payload.attempts)}assert.equal((await d.reviewEvents.get(task.id))!.level,'practice');
}));

test('automatic repair surfaces after unrelated cards and does not duplicate a future task',async()=>withDB(async d=>{
 await saveKnowledge(dynamic(),d);await prepareDue(d);const svc=createTrainerService(d);let s=await svc.startFeed('all','choice');const original=s.tasks[0];await svc.answer({sessionId:s.id,taskId:original.id,answer:original.options.find(o=>o.id!==original.items[0].answerId)!.id});await svc.answer({sessionId:s.id,taskId:original.id,answer:original.items[0].answerId});const failed=(await d.learningS... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
 assert.equal(failed.card.reps,0);assert.equal(failed.card.lapses,0);let found=false;for(let n=0;n<12;n++){s=await svc.advanceFeed(s.id);const task=s.tasks[0];assert(task);assert.equal(s.tasks.length,1);if(task.retryOf===original.id){assert((s.completedCount??0)>=4);assert(cooled(task.items[0],s.cooldown??[]));await svc.answer({sessionId:s.id,taskId:task.id,answer:task.items[0].answerId});assert.d... [ОБРЕЗАНО: ДЛИННАЯ СТРОКА]
}));

```

### File: res://tests/fixtures/seed.json
```json
{
  "entities": [
    {
      "id": "grande-jatte",
      "type": "artwork",
      "name": "Воскресный день на острове Гранд-Жатт",
      "aliases": [
        "Воскресенье на острове Гранд-Жатт",
        "Гранд-Жатт"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:0",
      "type": "person",
      "name": "Жорж Сёра",
      "aliases": [
        "Сёра"
      ],
      "externalIds": {}
    },
    {
      "id": "bedroom",
      "type": "artwork",
      "name": "Спальня в Арле",
      "aliases": [
        "Спальня",
        "Комната в Арле"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:1",
      "type": "person",
      "name": "Винсент ван Гог",
      "aliases": [
        "Гог"
      ],
      "externalIds": {}
    },
    {
      "id": "water-lilies",
      "type": "artwork",
      "name": "Кувшинки",
      "aliases": [
        "Водяные лилии"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:2",
      "type": "person",
      "name": "Клод Моне",
      "aliases": [
        "Моне"
      ],
      "externalIds": {}
    },
    {
      "id": "gare-saint-lazare",
      "type": "artwork",
      "name": "Прибытие поезда из Нормандии на вокзал Сен-Лазар",
      "aliases": [
        "Вокзал Сен-Лазар"
      ],
      "externalIds": {}
    },
    {
      "id": "paris-rain",
      "type": "artwork",
      "name": "Парижская улица в дождливую погоду",
      "aliases": [
        "Парижская улица. Дождь"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:3",
      "type": "person",
      "name": "Гюстав Кайботт",
      "aliases": [
        "Кайботт"
      ],
      "externalIds": {}
    },
    {
      "id": "basket-apples",
      "type": "artwork",
      "name": "Корзина с яблоками",
      "aliases": [
        "Натюрморт с корзиной яблок"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:4",
      "type": "person",
      "name": "Поль Сезанн",
      "aliases": [
        "Сезанн"
      ],
      "externalIds": {}
    },
    {
      "id": "child-bath",
      "type": "artwork",
      "name": "Купание ребёнка",
      "aliases": [
        "Купание ребенка"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:5",
      "type": "person",
      "name": "Мэри Кассат",
      "aliases": [
        "Кассат"
      ],
      "externalIds": {}
    },
    {
      "id": "moulin-rouge",
      "type": "artwork",
      "name": "В Мулен Руж",
      "aliases": [
        "В Мулен-Руж"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:6",
      "type": "person",
      "name": "Анри де Тулуз-Лотрек",
      "aliases": [
        "Тулуз-Лотрек"
      ],
      "externalIds": {}
    },
    {
      "id": "girl-pearl",
      "type": "artwork",
      "name": "Девушка с жемчужной серёжкой",
      "aliases": [
        "Девушка с жемчужной сережкой"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:7",
      "type": "person",
      "name": "Ян Вермеер",
      "aliases": [
        "Вермеер"
      ],
      "externalIds": {}
    },
    {
      "id": "mona-lisa",
      "type": "artwork",
      "name": "Мона Лиза",
      "aliases": [
        "Джоконда"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:8",
      "type": "person",
      "name": "Леонардо да Винчи",
      "aliases": [
        "Винчи"
      ],
      "externalIds": {}
    },
    {
      "id": "starry-night",
      "type": "artwork",
      "name": "Звёздная ночь",
      "aliases": [
        "Звездная ночь"
      ],
      "externalIds": {}
    },
    {
      "id": "scream",
      "type": "artwork",
      "name": "Крик",
      "aliases": [
        "The Scream"
      ],
      "externalIds": {}
    },
    {
      "id": "artist:9",
      "type": "person",
      "name": "Эдвард Мунк",
      "aliases": [
        "Мунк"
      ],
      "externalIds": {}
    },
    {
      "id": "washington",
      "type": "person",
      "name": "Джордж Вашингтон",
      "aliases": [
        "Вашингтон"
      ],
      "externalIds": {}
    },
    {
      "id": "adams",
      "type": "person",
      "name": "Джон Адамс",
      "aliases": [
        "Адамс"
      ],
      "externalIds": {}
    },
    {
      "id": "jefferson",
      "type": "person",
      "name": "Томас Джефферсон",
      "aliases": [
        "Джефферсон"
      ],
      "externalIds": {}
    },
    {
      "id": "lincoln",
      "type": "person",
      "name": "Авраам Линкольн",
      "aliases": [
        "Линкольн",
        "Абрахам Линкольн"
      ],
      "externalIds": {}
    },
    {
      "id": "theodore-roosevelt",
      "type": "person",
      "name": "Теодор Рузвельт",
      "aliases": [
        "Тедди Рузвельт"
      ],
      "externalIds": {}
    },
    {
      "id": "eisenhower",
      "type": "person",
      "name": "Дуайт Эйзенхауэр",
      "aliases": [
        "Эйзенхауэр",
        "Дуайт Дэвид Эйзенхауэр"
      ],
      "externalIds": {}
    },
    {
      "id": "kennedy",
      "type": "person",
      "name": "Джон Кеннеди",
      "aliases": [
        "Кеннеди",
        "Джон Фицджеральд Кеннеди"
      ],
      "externalIds": {}
    },
    {
      "id": "reagan",
      "type": "person",
      "name": "Рональд Рейган",
      "aliases": [
        "Рейган"
      ],
      "externalIds": {}
    },
    {
      "id": "bush",
      "type": "person",
      "name": "Джордж Буш — младший",
      "aliases": [
        "Джордж Буш младший",
        "Джордж Уокер Буш",
        "Буш младший"
      ],
      "externalIds": {}
    },
    {
      "id": "obama",
      "type": "person",
      "name": "Барак Обама",
      "aliases": [
        "Обама"
      ],
      "externalIds": {}
    }
  ],
  "facts": [
    {
      "id": "grande-jatte:created_by",
      "entityId": "grande-jatte",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:0",
      "source": {
        "url": "https://www.artic.edu/artworks/27992",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "1884–1886, border added 1888–1889",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "grande-jatte:date",
      "entityId": "grande-jatte",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1884-01-01",
      "dateEnd": "1886-12-31",
      "datePrecision": "range",
      "source": {
        "url": "https://www.artic.edu/artworks/27992",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "1884–1886, border added 1888–1889",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "bedroom:created_by",
      "entityId": "bedroom",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:1",
      "source": {
        "url": "https://www.artic.edu/artworks/28560",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "bedroom:date",
      "entityId": "bedroom",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1889-01-01",
      "dateEnd": "1889-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.artic.edu/artworks/28560",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "water-lilies:created_by",
      "entityId": "water-lilies",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:2",
      "source": {
        "url": "https://www.artic.edu/artworks/16568",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "water-lilies:date",
      "entityId": "water-lilies",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1906-01-01",
      "dateEnd": "1906-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.artic.edu/artworks/16568",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "gare-saint-lazare:created_by",
      "entityId": "gare-saint-lazare",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:2",
      "source": {
        "url": "https://www.artic.edu/artworks/16571",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "gare-saint-lazare:date",
      "entityId": "gare-saint-lazare",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1877-01-01",
      "dateEnd": "1877-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.artic.edu/artworks/16571",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "paris-rain:created_by",
      "entityId": "paris-rain",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:3",
      "source": {
        "url": "https://www.artic.edu/artworks/20684",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "paris-rain:date",
      "entityId": "paris-rain",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1877-01-01",
      "dateEnd": "1877-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.artic.edu/artworks/20684",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "basket-apples:created_by",
      "entityId": "basket-apples",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:4",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Paul_C%C3%A9zanne_-_The_Basket_of_Apples_-_1926.252_-_Art_Institute_of_Chicago.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "Около 1893",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "basket-apples:date",
      "entityId": "basket-apples",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1893-01-01",
      "dateEnd": "1893-12-31",
      "datePrecision": "circa",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Paul_C%C3%A9zanne_-_The_Basket_of_Apples_-_1926.252_-_Art_Institute_of_Chicago.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "Около 1893",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "child-bath:created_by",
      "entityId": "child-bath",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:5",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Mary_Cassatt_-_The_Child's_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "child-bath:date",
      "entityId": "child-bath",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1893-01-01",
      "dateEnd": "1893-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Mary_Cassatt_-_The_Child's_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "moulin-rouge:created_by",
      "entityId": "moulin-rouge",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:6",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Henri_de_Toulouse-Lautrec_-_At_the_Moulin_Rouge_-_1928.610_-_Art_Institute_of_Chicago.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "1892–1895",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "moulin-rouge:date",
      "entityId": "moulin-rouge",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1892-01-01",
      "dateEnd": "1895-12-31",
      "datePrecision": "range",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Henri_de_Toulouse-Lautrec_-_At_the_Moulin_Rouge_-_1928.610_-_Art_Institute_of_Chicago.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "1892–1895",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "girl-pearl:created_by",
      "entityId": "girl-pearl",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:7",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Girl_with_a_Pearl_Earring.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "Около 1665",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "girl-pearl:date",
      "entityId": "girl-pearl",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1665-01-01",
      "dateEnd": "1665-12-31",
      "datePrecision": "circa",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Girl_with_a_Pearl_Earring.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "Около 1665",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "mona-lisa:created_by",
      "entityId": "mona-lisa",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:8",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "Начата около 1503; работа продолжалась позднее",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "mona-lisa:date",
      "entityId": "mona-lisa",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1503-01-01",
      "dateEnd": "1503-12-31",
      "datePrecision": "circa",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "Начата около 1503; работа продолжалась позднее",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "starry-night:created_by",
      "entityId": "starry-night",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:1",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "starry-night:date",
      "entityId": "starry-night",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1889-01-01",
      "dateEnd": "1889-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "scream:created_by",
      "entityId": "scream",
      "key": "created_by",
      "valueKind": "entity",
      "valueEntityId": "artist:9",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:The_Scream.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "scream:date",
      "entityId": "scream",
      "key": "creation_date",
      "valueKind": "date",
      "dateStart": "1893-01-01",
      "dateEnd": "1893-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://commons.wikimedia.org/wiki/File:The_Scream.jpg",
        "name": "Art Institute of Chicago / Wikimedia Commons",
        "locator": "year",
        "family": "museum"
      },
      "verification": "verified"
    },
    {
      "id": "washington:date",
      "entityId": "washington",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "1789-01-01",
      "dateEnd": "1789-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    },
    {
      "id": "adams:date",
      "entityId": "adams",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "1797-01-01",
      "dateEnd": "1797-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    },
    {
      "id": "jefferson:date",
      "entityId": "jefferson",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "1801-01-01",
      "dateEnd": "1801-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    },
    {
      "id": "lincoln:date",
      "entityId": "lincoln",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "1861-01-01",
      "dateEnd": "1861-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    },
    {
      "id": "theodore-roosevelt:date",
      "entityId": "theodore-roosevelt",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "1901-01-01",
      "dateEnd": "1901-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    },
    {
      "id": "eisenhower:date",
      "entityId": "eisenhower",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "1953-01-01",
      "dateEnd": "1953-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    },
    {
      "id": "kennedy:date",
      "entityId": "kennedy",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "1961-01-01",
      "dateEnd": "1961-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    },
    {
      "id": "reagan:date",
      "entityId": "reagan",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "1981-01-01",
      "dateEnd": "1981-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    },
    {
      "id": "bush:date",
      "entityId": "bush",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "2001-01-01",
      "dateEnd": "2001-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    },
    {
      "id": "obama:date",
      "entityId": "obama",
      "key": "presidency_start",
      "valueKind": "date",
      "dateStart": "2009-01-01",
      "dateEnd": "2009-12-31",
      "datePrecision": "year",
      "source": {
        "url": "https://www.whitehousehistory.org/collections/president-biographies",
        "name": "White House Historical Association",
        "locator": "Год первого вступления в должность президента США",
        "family": "whitehousehistory"
      },
      "verification": "verified"
    }
  ],
  "media": [
    {
      "id": "grande-jatte:image",
      "entityId": "grande-jatte",
      "role": "artwork",
      "url": "https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb/full/843,/0/default.jpg",
      "sourceUrl": "https://www.artic.edu/artworks/27992",
      "license": "Public domain / CC0; Art Institute of Chicago"
    },
    {
      "id": "bedroom:image",
      "entityId": "bedroom",
      "role": "artwork",
      "url": "https://www.artic.edu/iiif/2/6644829f-f292-c5c4-a73c-0356a6fdbf0d/full/843,/0/default.jpg",
      "sourceUrl": "https://www.artic.edu/artworks/28560",
      "license": "Public domain / CC0; Art Institute of Chicago"
    },
    {
      "id": "water-lilies:image",
      "entityId": "water-lilies",
      "role": "artwork",
      "url": "https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/843,/0/default.jpg",
      "sourceUrl": "https://www.artic.edu/artworks/16568",
      "license": "Public domain / CC0; Art Institute of Chicago"
    },
    {
      "id": "gare-saint-lazare:image",
      "entityId": "gare-saint-lazare",
      "role": "artwork",
      "url": "https://www.artic.edu/iiif/2/0f1cc0e0-e42e-be16-3f71-2022da38cb93/full/843,/0/default.jpg",
      "sourceUrl": "https://www.artic.edu/artworks/16571",
      "license": "Public domain / CC0; Art Institute of Chicago"
    },
    {
      "id": "paris-rain:image",
      "entityId": "paris-rain",
      "role": "artwork",
      "url": "https://www.artic.edu/iiif/2/f8fd76e9-c396-5678-36ed-6a348c904d27/full/843,/0/default.jpg",
      "sourceUrl": "https://www.artic.edu/artworks/20684",
      "license": "Public domain / CC0; Art Institute of Chicago"
    },
    {
      "id": "basket-apples:image",
      "entityId": "basket-apples",
      "role": "artwork",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Paul_C%C3%A9zanne_-_The_Basket_of_Apples_-_1926.252_-_Art_Institute_of_Chicago.jpg/960px-Paul_C%C3%A9zanne_-_The_Basket_of_Apples_-_1926.252_-_Art_Institute_of_Chicago.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Paul_C%C3%A9zanne_-_The_Basket_of_Apples_-_1926.252_-_Art_Institute_of_Chicago.jpg",
      "license": "Public domain (PD-Art), Wikimedia Commons"
    },
    {
      "id": "child-bath:image",
      "entityId": "child-bath",
      "role": "artwork",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg/960px-Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Mary_Cassatt_-_The_Child's_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg",
      "license": "Public domain (PD-Art), Wikimedia Commons"
    },
    {
      "id": "moulin-rouge:image",
      "entityId": "moulin-rouge",
      "role": "artwork",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Henri_de_Toulouse-Lautrec_-_At_the_Moulin_Rouge_-_1928.610_-_Art_Institute_of_Chicago.jpg/960px-Henri_de_Toulouse-Lautrec_-_At_the_Moulin_Rouge_-_1928.610_-_Art_Institute_of_Chicago.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Henri_de_Toulouse-Lautrec_-_At_the_Moulin_Rouge_-_1928.610_-_Art_Institute_of_Chicago.jpg",
      "license": "Public domain (PD-Art), Wikimedia Commons"
    },
    {
      "id": "girl-pearl:image",
      "entityId": "girl-pearl",
      "role": "artwork",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Girl_with_a_Pearl_Earring.jpg/960px-Girl_with_a_Pearl_Earring.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Girl_with_a_Pearl_Earring.jpg",
      "license": "Public domain (PD-Art), Wikimedia Commons"
    },
    {
      "id": "mona-lisa:image",
      "entityId": "mona-lisa",
      "role": "artwork",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/960px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
      "license": "Public domain (PD-Art), Wikimedia Commons"
    },
    {
      "id": "starry-night:image",
      "entityId": "starry-night",
      "role": "artwork",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/960px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
      "license": "Public domain (PD-Art), Wikimedia Commons"
    },
    {
      "id": "scream:image",
      "entityId": "scream",
      "role": "artwork",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/The_Scream.jpg/960px-The_Scream.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:The_Scream.jpg",
      "license": "Public domain (PD-Art), Wikimedia Commons"
    },
    {
      "id": "washington:image",
      "entityId": "washington",
      "role": "portrait",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Gwashington.jpeg/960px-Gwashington.jpeg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Gwashington.jpeg",
      "license": "Public domain, Wikimedia Commons"
    },
    {
      "id": "adams:image",
      "entityId": "adams",
      "role": "portrait",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/Official_Presidential_portrait_of_John_Adams_%28by_John_Trumbull%2C_circa_1792%29.jpg/960px-Official_Presidential_portrait_of_John_Adams_%28by_John_Trumbull%2C_circa_1792%29.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Official_Presidential_portrait_of_John_Adams_(by_John_Trumbull%2C_circa_1792).jpg",
      "license": "Public domain, Wikimedia Commons"
    },
    {
      "id": "jefferson:image",
      "entityId": "jefferson",
      "role": "portrait",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/Thomas_Jefferson_by_Rembrandt_Peale%2C_1800.jpg/960px-Thomas_Jefferson_by_Rembrandt_Peale%2C_1800.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Thomas_Jefferson_by_Rembrandt_Peale%2C_1800.jpg",
      "license": "Public domain, Wikimedia Commons"
    },
    {
      "id": "lincoln:image",
      "entityId": "lincoln",
      "role": "portrait",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Abraham_Lincoln_November_1863.jpg/960px-Abraham_Lincoln_November_1863.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_November_1863.jpg",
      "license": "Public domain, Wikimedia Commons"
    },
    {
      "id": "theodore-roosevelt:image",
      "entityId": "theodore-roosevelt",
      "role": "portrait",
      "url": "https://upload.wikimedia.org/wikipedia/commons/9/95/Theodore_Roosevelt-Pach.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Theodore_Roosevelt-Pach.jpg",
      "license": "Public domain, Wikimedia Commons"
    },
    {
      "id": "eisenhower:image",
      "entityId": "eisenhower",
      "role": "portrait",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Dwight_D_Eisenhower.jpg/960px-Dwight_D_Eisenhower.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Dwight_D_Eisenhower.jpg",
      "license": "Public domain, Wikimedia Commons"
    },
    {
      "id": "kennedy:image",
      "entityId": "kennedy",
      "role": "portrait",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/John_F._Kennedy%2C_White_House_color_photo_portrait.jpg/960px-John_F._Kennedy%2C_White_House_color_photo_portrait.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:John_F._Kennedy%2C_White_House_color_photo_portrait.jpg",
      "license": "Public domain, Wikimedia Commons"
    },
    {
      "id": "reagan:image",
      "entityId": "reagan",
      "role": "portrait",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Ronald_Reagan_1985_presidential_portrait.jpg/960px-Ronald_Reagan_1985_presidential_portrait.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ronald_Reagan_1985_presidential_portrait.jpg",
      "license": "Public domain, Wikimedia Commons"
    },
    {
      "id": "bush:image",
      "entityId": "bush",
      "role": "portrait",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/George-W-Bush.jpeg/960px-George-W-Bush.jpeg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:George-W-Bush.jpeg",
      "license": "Public domain, Wikimedia Commons"
    },
    {
      "id": "obama:image",
      "entityId": "obama",
      "role": "portrait",
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/960px-President_Barack_Obama.jpg",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:President_Barack_Obama.jpg",
      "license": "Public domain, Wikimedia Commons"
    }
  ],
  "tags": [
    {
      "id": "art",
      "name": "Живопись"
    },
    {
      "id": "presidents",
      "name": "Президенты США"
    }
  ],
  "entityTags": [
    {
      "entityId": "grande-jatte",
      "tagId": "art"
    },
    {
      "entityId": "bedroom",
      "tagId": "art"
    },
    {
      "entityId": "water-lilies",
      "tagId": "art"
    },
    {
      "entityId": "gare-saint-lazare",
      "tagId": "art"
    },
    {
      "entityId": "paris-rain",
      "tagId": "art"
    },
    {
      "entityId": "basket-apples",
      "tagId": "art"
    },
    {
      "entityId": "child-bath",
      "tagId": "art"
    },
    {
      "entityId": "moulin-rouge",
      "tagId": "art"
    },
    {
      "entityId": "girl-pearl",
      "tagId": "art"
    },
    {
      "entityId": "mona-lisa",
      "tagId": "art"
    },
    {
      "entityId": "starry-night",
      "tagId": "art"
    },
    {
      "entityId": "scream",
      "tagId": "art"
    },
    {
      "entityId": "washington",
      "tagId": "presidents"
    },
    {
      "entityId": "adams",
      "tagId": "presidents"
    },
    {
      "entityId": "jefferson",
      "tagId": "presidents"
    },
    {
      "entityId": "lincoln",
      "tagId": "presidents"
    },
    {
      "entityId": "theodore-roosevelt",
      "tagId": "presidents"
    },
    {
      "entityId": "eisenhower",
      "tagId": "presidents"
    },
    {
      "entityId": "kennedy",
      "tagId": "presidents"
    },
    {
      "entityId": "reagan",
      "tagId": "presidents"
    },
    {
      "entityId": "bush",
      "tagId": "presidents"
    },
    {
      "entityId": "obama",
      "tagId": "presidents"
    }
  ],
  "missing": [],
  "unresolved": []
}
```
