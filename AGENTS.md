# GFcode — Agent Guide

## Commands

| Action | Command |
|--------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |
| Test all | `npm run test` |
| Test watch | `npm run test:watch` |
| Single test file | `npx vitest run path/to/file.test.tsx` |

**Order:** `lint` before `test`. TypeScript errors surface through lint (no separate typecheck command).

## Stack

- React 19, TypeScript 6, Vite 8, Vitest 4, React Router 7, ESLint 10 (flat config)
- No `tsc` check — type checking via `tsconfig.json` + `tseslint`

## Architecture

- **Entry:** `src/main.tsx` → `App.tsx` (Router → Theme → Player → Toast → ErrorBoundary)
- **Apps** registered in `src/framework/appRegistry.ts` (lazy-loaded, 12 apps)
- **Base path:** `/startpage` (set in `vite.config.js` and Router basename)
- **Themes:** 5 themes (`Analog`, `Spectrum`, `Daylight`, `Retro`, `Forest`) defined in `src/framework/themes.ts`, applied via CSS custom properties + `data-theme` attribute on `<html>`
- **Storage:** `useAppStorage(appId, key, default)` → persists to `localStorage` under `gf:{appId}:{key}`. Old `-` separator keys auto-migrated on read.
- **Player:** `PlayerContext` manages cross-app audio state (volume persisted, play/stop/metadata transient)
- **Components:** shared UI kit in `src/framework/components/`
- **Engine:** custom game/audio/tween engines in `src/framework/engine/`

## Test quirks

- Tests co-located as `*.test.ts`/`*.test.tsx` next to source
- Vitest config in `vite.config.js`: jsdom, `globals: true`, setup file `src/test/setup.js` (mocks `localStorage`)
- `tsconfig.json` excludes `src/**/*.test.*` — Vitest handles compilation, not `tsc`
- No coverage or e2e setup

## Build quirks

- **Base:** `/startpage/` — all asset URLs and router basename use this
- **ROMs:** ROMs not bundled — loaded via drag-drop or file picker into IndexedDB
- **Emulator:** Uses EmulatorJS CDN (`https://cdn.emulatorjs.org/stable/data/`) — no local cores
- **PWA:** via `vite-plugin-pwa` with `autoUpdate`; caches fonts, ignores `emulator/`
- **RSS proxy:** Vite dev middleware at `/api/rss-proxy` — no production counterpart

## Deploy

- GitHub Pages deploy on push to `main` (`.github/workflows/deploy.yml`)
- Node 22, `npm ci`, `npm run build`, upload `dist/` artifact
- SPA routing: `public/_redirects` (`/* /index.html 200`) + `public/404.html` with `sessionStorage.redirect` fallback

## Lint

- Flat config (`eslint.config.js`)
- Ignores `dist/` and `public/emulator`
- Applies JS/JSX and TS/TSX rules separately
- `@typescript-eslint/no-unused-vars` allows `_`-prefixed params
