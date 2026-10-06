# Энги 2.0

Непрерывная лента обучения и редактируемая личная база знаний. Инструкции обновления, модель данных, проверки и список приёмки на iPhone: [UPDATE_V2.md](UPDATE_V2.md).

# Энги

Личный тренажёр знаний: React + TypeScript + Vite, Dexie/IndexedDB, Cache Storage, ts-fsrs и Workbox PWA. Обучение, проверка ответов, генерация заданий, редактирование и сохранение работают на устройстве без backend. GitHub Pages доставляет только приложение и обновления. ПК можно выключить.

## Запуск на Windows

Установите Node.js 22.13+ (рекомендуется актуальная Node 22). Распакуйте проект в папку `engi` или клонируйте свой репозиторий:

```powershell
git clone https://github.com/USERNAME/engi.git
cd engi
corepack enable
pnpm install
pnpm dev
```

Откройте `http://localhost:5173/engi/`. Никакой `.env`, учётной записи или серверной базы не нужно. Интернет нужен для первой установки npm-зависимостей. В dev service worker не включён: для проверки PWA используйте production preview.

```powershell
pnpm test
pnpm build
pnpm preview
```

Production output — `dist/`; preview обычно `http://localhost:4173/engi/`. Данные привязаны к origin браузера: localhost, preview и GitHub Pages имеют отдельные хранилища. Переносите прогресс через backup, знания через `.engi`.

## Что сохранено

Существующий engine адаптирован по путям и индексам; правила обучения сохранены. Семь форматов: choice, recall, match, sort, categorize, timeline, missing. Сохраняются recipes, FACT_TYPES, preflight, verified/direct eligibility, точность дат, исключение неоднозначных фактов, pretest, confusion tracking, отложенные retry и настоящий FSRS. Неудачный новый pretest не получает Again; recognition не получает Easy автоматически. Match даёт partial evidence, chronology/timeline — diagnostic evidence. Прогресс: coverage, retention, due, stability 7/30/90 дней.

Удалены из этой версии Next/vinext, API routes, Cloudflare Worker/D1, Drizzle, Wrangler, server sessions/auth и инфраструктура Sites. Ответы не требуют HTTP. Миграция существующих данных старого серверного приложения не автоматическая: его прежний JSON backup имеет другой формат и не является `.engi-backup`.

## Структура

```
src/
  App.tsx                     существующий интерфейс
  main.tsx, styles.css        SPA shell
  components/                 shadcn/ui и панель хранилища
  lib/engi/                   engine, types, validate, indexes
  db/                         Dexie schema, migrations, repositories
  services/                   trainer, pack, backup, storage health
  media/                      Cache Storage и object URL lifecycle
  pwa/                        обновление по запросу
scripts/
  check-learning.mjs
  build-engi-pack.mjs
tests/                        IndexedDB, packs, backup, fixtures
.github/workflows/            GitHub Pages deployment
```

DB называется `engi`, версия схемы — 1. В ней content, learningState, append-only reviewEvents, installedPacks, activeSessions, appMeta. Shell и версия DB независимы; обновление приложения не очищает базу. Ошибка открытия/миграции показывает ошибку и повторную попытку, без fallback удаления данных.

Ответ записывает Memory + ReviewEvent + результат сессии + счётчик backup одной IndexedDB transaction. Повтор task.id возвращает прежний feedback без повторного FSRS. После ответа UI получает только изменённые rows; полный Snapshot не перечитывается. История главного экрана ограничена 1000 событиями; repository `historyPage()` поддерживает pagination. Backup содержит все события.

## Создание пакета .engi

Подготовьте папку **вне коммитов**:

```
pack-source/
  manifest.json
  bundle.json
  media/
    image.webp
```

`manifest.json`:

```json
{
  "format": "engi-pack",
  "schemaVersion": 1,
  "packId": "my.collection",
  "packVersion": 1,
  "name": "Моя подборка",
  "createdAt": "2026-10-06T12:00:00Z",
  "files": []
}
```

`bundle.json` сохраняет модель Bundle: `entities`, `facts`, `media`, `tags`, `entityTags`, `missing`, `unresolved`. Полный тестовый пример формы — `tests/fixtures/seed.json`; его внешние media URLs перед сборкой замените локальными `media/...` и положите соответствующие изображения в папку. Fixture не загружается приложением.

Entity: `id`, `type`, `name`, `aliases`, `externalIds`. Fact: `id`, `entityId`, `key`, `valueKind`, соответствующее значение, `source: {url, name}`, `verification`. Date: `dateStart`, `dateEnd`, `datePrecision`. Media: `id`, `entityId`, `role`, `url: "media/image.webp"`, `sourceUrl`, `license`. В `tags` укажите `{id,name}`, в `entityTags` — `{entityId,tagId}`. Ссылки на авторов и другие ответы требуют соответствующие entity. Источники — HTTPS URLs. Изображения — WebP, JPEG, PNG; SVG/HTML/JS не принимаются.

```powershell
pnpm pack:build ./pack-source ./dist-packs/impressionism.engi
```

Builder валидирует Bundle, проверяет сигнатуры изображений, считает SHA-256, заполняет `files` с path/bytes/hash/MIME, создаёт ZIP и выводит размер и counts. Released entity/fact IDs **никогда не меняйте**. Обновляйте `packVersion`, сохраняя прежние IDs. Импорт v2 сохраняет все learning states и историю. Переназначение ID другому виду факта запрещено. Удалённые из обновлённого пакета объекты исключаются из занятий, их Memory остаётся для будущего повторного импорта.

Лимиты: пакет/суммарная распаковка до 512 MiB, одно изображение до 16 MiB, JSON до 16 MiB, максимум 50000 файлов. ZIP читается лениво через zip.js BlobReader, изображения проверяются и сохраняются по одному; весь пакет не распаковывается одним синхронным buffer. SHA требует buffer только одного изображения. Compression ratio >100, traversal, шифрование, дубли, неизвестная schema/MIME, плохие hashes/references отклоняются. Большие пакеты лучше разделить; верхний лимит не гарантирует, что у конкретного телефона хватит места.

## Импорт и занятия

При первом запуске база пустая. Нажмите **Импортировать пакет** → выберите `.engi`. На ПК файл можно перетащить в диалог. На iPhone выберите его из «Файлы» / iCloud / Downloads. Дождитесь окончания проверки и записи.

Media метаданные в IndexedDB имеют `engi-media://SHA256`; blobs хранятся в `engi-media-v1`. Компонент получает blob и создаёт object URL, освобождая его при смене/размонтировании. Внешние URLs не загружаются как тренировочные изображения. Следующие три задания предзагружают изображения. JSON importer оставлен в Developer / Legacy import и принимает только локальные media references (или Bundle без media).

Начните занятие. Все действия доступны offline. При закрытии вкладки сессия сохраняется; при следующем открытии доступны **Продолжить занятие** / **Начать новое**. Нажатие «Закончить» возвращает на главный экран, сохраняя занятие для продолжения. Retry добавляется после других заданий. Проблема с вопросом сохраняется локально и помечается проверенной отдельным событием истории. Импорт пакета и редактирование закрывают незавершённые сессии, чтобы не проверять уже устаревшие ответы; все записанные результаты сохраняются. Редактирование значения сбрасывает только Memory соответствующего fact target, оставляя историю и другие знания.

На телефоне Match использует touch-friendly select; Sort — кнопки вверх/вниз и pointer drag. Все действия доступны без hover и без drag, что также сохраняет доступность для клавиатуры. Recall поддерживает Enter.

## Резервная копия и хранилище

**Наборы → Сохранить резервную копию**. Файл называется `engi-backup-YYYY-MM-DD.engi-backup`. На iPhone используется share sheet, если доступна передача File; иначе скачивание. Сохраните в «Файлы» / iCloud Drive / другой диск.

Копия содержит schema/app DB version, все learningState, reviewEvents, confusions, настройки и metadata пакетов. Знания и изображения в неё не входят. После очистки данных сайта:

1. Откройте Энги.
2. Наборы → **Восстановить из копии**, выберите `.engi-backup`.
3. Импортируйте прежние `.engi`.

Стабильные IDs снова свяжут знания с FSRS. Восстановление можно сделать без контента. Состояния с тем же ID заменяются данными копии; история объединяется append-only. Конфликт уже существующего события отклоняет restore целиком. Не связанный с установленными пакетами Memory не удаляется.

Хранилище показывает usage/quota, число пакетов/events, дату копии и persistent status. **Защитить локальные данные** вызывает `navigator.storage.persist()`; браузер может отказать. Защита не препятствует ручной очистке данных сайта. Напоминание о копии появляется после 7 дней или >300 событий, не блокируя занятия. Никакой облачной синхронизации нет. Между ПК и телефоном перенос — вручную копией и пакетами.

## GitHub Pages

1. Создайте репозиторий **engi**. Распакованные исходники положите в корень репозитория.
2. Push в `main`. Не включайте реальные packs/backups в git.
3. Settings → Pages → Source → **GitHub Actions**.
4. Дождитесь workflow **Deploy Engi to GitHub Pages**.
5. Откройте `https://USERNAME.github.io/engi/`.

Workflow: Node 22, pnpm frozen lockfile, tests, build, официальный upload/deploy Pages. Vite base, manifest start_url/scope — `/engi/`. Если репозиторий имеет другое имя, измените base/scope/start_url в `vite.config.ts`. Сохранение исходного origin и base важно для доступа к прежней базе. Shell precache включает HTML/JS/CSS/icons/fonts/manifest; пользовательские пакеты не precache.

Первый online запуск должен завершить установку service worker: дождитесь **Оболочка готова к работе без интернета**. Обновление предлагает кнопку, не reload посреди занятия. Кнопка блокируется до выхода из занятия. IndexedDB и media cache не чистятся обновлением.

## iPhone и Android

1. На iPhone откройте Safari и Pages URL.
2. Share → **Add to Home Screen** («На экран Домой»).
3. Включите **Open as Web App**, если этот переключатель доступен.
4. Откройте Энги с домашнего экрана.
5. Дождитесь готовности shell, импортируйте `.engi` из «Файлы».
6. Включите авиарежим и занимайтесь. ПК может быть выключен.

На Android откройте тот же URL в Chrome → Install app / Add to Home Screen → импорт пакета. Отдельный native build не нужен.

## Проверки

`pnpm test`: существующие 1575 generated tasks / 7 форматов, FSRS, pretest, ambiguity, approximate dates; fake IndexedDB persistence, concurrent double submit, confusion harvest, partial evidence, retries/resume, backup catastrophe без контента, duplicate/v2 pack import, media hash dedup, invalid ZIP/reference/schema/hash/MIME, локальные reports/edit, rollback при сбое записи, append-only история и экспорт более 1000 events. `pnpm build` включает TypeScript.

Ручные проверки на настоящем iPhone обязательны: установка standalone, 15 заданий в авиарежиме, закрытие/повторное открытие, resume, выключенный ПК, отсутствие сети/GitHub, update с сохранением данных, Files/share sheet, клавиатура Recall, pointer/touch сортировка и layout 390×844 / 393×852 / 430×932. Эти проверки нельзя заменить fake-indexeddb. Большие 200–500 MiB packs проверяйте на целевом устройстве; проверен программный sequential import, не такой объём в Safari.

GitHub deploy выполняется только после загрузки исходников в ваш репозиторий. Проект не содержит аккаунтов, telemetry, analytics, LLM/runtime museum APIs или server sync.

Документация используемых библиотек: [Dexie transactions](https://dexie.org/docs/Dexie/Dexie.transaction()), [Vite PWA prompt updates](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html), [zip.js](https://gildas-lormeau.github.io/zip.js/).

В поставляемом архиве также есть готовая `dist/`. Она собрана под `/engi/`; открытие index.html через file:// не заменяет HTTP/HTTPS хостинг и PWA.
