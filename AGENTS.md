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

- **Entry:** `src/main.tsx` → `App.tsx` (Router → Theme → Player → Toast → ErrorBoundary → AppBadgeProvider)
- **Apps** registered in `src/framework/appRegistry.ts` (lazy-loaded, 12 apps)
- **Base path:** `/startpage` (set in `vite.config.js` and Router basename)
- **Themes:** 5 themes (`Analog`, `Spectrum`, `Daylight`, `Retro`, `Forest`) defined in `src/framework/themes.ts`, applied via CSS custom properties + `data-theme` attribute on `<html>`
- **Storage:** `useAppStorage(appId, key, default)` → persists to `localStorage` under `gf:{appId}:{key}`. Old `-` separator keys auto-migrated on read.
- **Player:** `PlayerContext` manages cross-app audio state (volume persisted, play/stop/metadata transient)
- **Components:** shared UI kit in `src/framework/components/`
- **Engine:** custom game/audio/tween engines in `src/framework/engine/`
- **Hooks:** utility hooks in `src/framework/hooks/` (`useFlipAnimation`, `useCommandPalette`, `useInstallPrompt`, `useScrollToTop`, `useLocalStorage`)
- **View Transitions:** `App.tsx` → `useViewTransitionLocation()` wraps route changes in `document.startViewTransition()` for smooth crossfade between pages
- **App badges:** `AppBadgeContext` provides `useAppBadge(appId)` hook to set count badges on launcher app cards
- **Command palette:** `CommandPalette` component + `useCommandPalette()` hook (⌘K/⌃K global shortcut, fuzzy search apps/themes/actions)

### Components (`src/framework/components/`)

| Component | Description |
|-----------|-------------|
| `GfButton` | Variants: `primary`, `secondary`, `ghost`, `icon`. Sizes: `sm`, `md`, `lg`. Hover/press feedback. |
| `GfCard` | Composable card with accent bar, title, description, image. Clickable with keyboard support. |
| `MediaCard` | Rich card for audio streams: image (fallback initial), title, metadata, now-playing, play/fav buttons, equalizer. |
| `GfAppHeader` | Page header with gradient title, badge, count, segmented control, search input. |
| `GfBadge` | Variants: `default`, `accent`, `success`, `listeners`, `warning`. |
| `GfSegmentedControl` | Horizontal radio-group filter, scrollable on mobile. |
| `GfSlider` | Custom range slider with hidden native input. |
| `PlayerBar` | Fixed bottom bar: status indicator, track info, play/pause/stop, volume slider. |
| `Skeleton` / `SkeletonGrid` | Animated pulse loading placeholders. |
| `SettingsModal` | Modal with theme picker (live preview on hover), backup export/import. Focus trap, Escape to close. |
| `GfEmptyState` | Unified no-data UI: icon, title, description, optional action button. |
| `GfConfirmDialog` | Alert dialog for destructive actions: focus auto-confirm, Escape to close. |
| `GfBottomSheet` | Mobile draggable dialog: drag handle, Escape/backdrop close, desktop fallback to centered modal. |
| `CommandPalette` | ⌘K fuzzy finder: search apps, switch themes, navigate home. Arrow key + Enter navigation. |
| `InstallPrompt` | PWA install banner: appears when `beforeinstallprompt` fires, skips if already standalone. |

## Test quirks

- Tests co-located as `*.test.ts`/`*.test.tsx` next to source
- Vitest config in `vite.config.js`: jsdom, `globals: true`, setup file `src/test/setup.js` (mocks `localStorage`, `Element.prototype.animate` for FLIP animations)
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

## UI/UX conventions

- **Micro-interactions:** all interactive elements have `transition: all 0.15s`, `:active { transform: scale(0.97) }` press effect, hover states wrapped in `@media (hover: hover)` (no sticky hover on touch)
- **View Transitions:** route changes use `document.startViewTransition()` with a subtle scale+fade. CSS at `:root` via `::view-transition-old/new(root)`
- **Auto-hide topbar:** `AppShell` tracks scroll direction via `requestAnimationFrame` throttling; topbar hides on scroll down past 56px
- **FLIP animations:** `useFlipAnimation(ref, deps)` hook animates list items when positions change (enter + reorder), uses Web Animations API
- **Custom scrollbar:** `::-webkit-scrollbar` + `scrollbar-color` in `index.css`, matches theme colors

## Lint

- Flat config (`eslint.config.js`)
- Ignores `dist/` and `public/emulator`
- Applies JS/JSX and TS/TSX rules separately
- `@typescript-eslint/no-unused-vars` allows `_`-prefixed params
