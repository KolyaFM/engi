# Repository Guidelines

## Project Structure & Module Organization

Engi is a local-first knowledge trainer built with React, TypeScript, Vite, Dexie/IndexedDB, FSRS, and PWA support.

- `src/App.tsx` and `src/main.tsx` provide the application entry points; feature folders include `study/`, `knowledge/`, and `collections/`.
- `src/lib/engi/` contains domain types, validation, question generation, and study logic. `src/services/` coordinates application operations; `src/db/` owns persistence and migrations.
- `src/components/` and `src/ui/` contain UI components; `src/styles.css` contains application styles. `src/media/` manages stored media; `public/` holds static icons.
- `tests/` contains automated tests and fixtures; `scripts/` contains validation and pack-building tools. `examples/` contains sample content packs.
- Consult `ARCHITECTURE_V3.md` and `PACK_FORMAT_V3.md` before changing persistence or import formats.

## Build, Test, and Development Commands

Use Node.js 22.13+ and pnpm 10.30.1.

- `pnpm install --frozen-lockfile`: install locked dependencies.
- `pnpm dev`: serve the app at `http://localhost:5173/engi/`.
- `pnpm test`: run learning validation and all `tests/*.test.ts` tests.
- `pnpm build`: run TypeScript checks and produce `dist/`.
- `pnpm preview`: preview the build at `http://localhost:4173/engi/`.
- `pnpm pack:build ./examples/coauthors ./my-pack.engi`: build a content archive.

## Coding Style & Naming Conventions

Use strict TypeScript and ES modules. Match adjacent formatting: many files use compact expressions, single quotes, semicolons, and one- or two-space indentation. Avoid unrelated reformatting. Use PascalCase for React components, camelCase for functions and variables, and kebab-case for service/module filenames. The `@/` alias resolves to `src/`. No dedicated lint or formatter script is configured; `pnpm build` checks types.

## Testing Guidelines

Tests use `node:test`, strict assertions, and `tsx`; database tests can use `fake-indexeddb`. Name tests `*.test.ts` and add regression cases for changed behavior. No numeric coverage threshold is configured.

For UI changes, start `pnpm dev`, install Chromium with `pnpm exec playwright install chromium`, and run `pnpm test:browser:v3` or the relevant browser script. Use `ENGI_TEST_URL` and `ENGI_BROWSER_PATH` when needed; screenshots go to `artifacts/`.

## Commit & Pull Request Guidelines

Recent commits use short, informal subjects such as `data update` and `card menu`; no enforced prefix scheme is evident. Prefer concise, descriptive subjects. PRs should explain behavior changes, link relevant issues, report validation, and include screenshots for UI changes. CI runs `pnpm test` and `pnpm build` before deploying `main` to GitHub Pages.

## Data Safety

Preserve database migration and legacy import compatibility. Back up local data before migration or destructive checks. Keep personal `.engi-backup` exports out of commits.
