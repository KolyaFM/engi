# Проверки Энги

Автоматически проверено в текущей среде:

- TypeScript strict check: passed.
- Existing learning tests: 1575 generated/assessed tasks, 7 formats, FSRS/pretest/confusions, multiple-author exclusions, approximate/range date exclusions.
- fake-indexeddb: 9 passing scenarios covering persistent reopen, concurrent idempotent submit, pretest/confusion harvest, partial Match, retry/resume, backup restoration before content, repeated/v2 pack import and hash dedup, rejection of bad ZIP/schema/hash/MIME/references, local editing/report resolution, atomic rollback and complete 1007-event export.
- `pnpm install --frozen-lockfile --offline`: passed after dependencies were installed.
- `pnpm build`: passed, `dist/` generated with Workbox precache.
- `pnpm dev`: starts; same-process HTTP check of `/engi/` returned 200 with correct title and SPA entry.
- Pack builder: produced a ZIP with manifest, 32 entities / 34 facts / 22 media metadata / one deduplicated image file, stable IDs and checksums.
- Static build checks: manifest start_url/scope `/engi/`, icon and JS/CSS paths exist, shell cache does not manage the imported media cache.
- Global source/dependency scan: no old product names, Cloudflare, Wrangler, vinext or trainer API in production sources/dependencies.

Build reports a non-fatal JavaScript chunk-size warning: main JS about 750 KB uncompressed / 248 KB gzip; shell is under 1 MB. This is delivery size, not per-answer traffic.

Not claimed as tested:

- Browser UI layout, interactive offline service worker lifecycle and update activation. Headless Chromium was unavailable; browser download failed in this execution environment.
- Real Windows clean clone: commands are cross-platform; checks ran on Linux with Node 24. GitHub workflow targets Node 22.
- Real iPhone/Android install, Safari persistence, Files/share sheet and mobile keyboard/pointer gestures.
- 200–500 MB pack import on a phone, quota pressure and low-memory behaviour.
- Live GitHub Actions deploy: workflow supplied, no user repository connected or modified.

Before everyday use on iPhone, install via Safari, import a pack, wait for offline-ready shell, then verify 15 answers in airplane mode, close/reopen/resume, backup/restore catastrophe and app update without state loss. Keep `.engi` packs and `.engi-backup` outside site storage.
