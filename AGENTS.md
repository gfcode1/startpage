# StartDeck — Agent Guide

## Stack
React 19 · TypeScript 6 · Mantine v9 · Zustand · TanStack Query v5 · React Router 7 · Vite 8 · Vitest 4

## Commands
- `npm run dev` — dev server at /startpage/
- `npm run build` — tsc -b && vite build
- `npm run test` — vitest run
- `npm run lint` — eslint .
- `npm run typecheck` — tsc --noEmit

## Architecture
- **State**: Zustand stores (player, widget, widget-options, weather-location) with StorageAdapter persistence
- **Server state**: TanStack Query
- **UI**: Mantine v9 components + custom components in src/ui/
- **Routing**: React Router 7, all routes lazy-loaded
- **Storage**: StorageAdapter interface (LocalAdapter impl) — pluggable for future cloud sync
- **App registry**: src/registry/apps.ts — 13 apps
- **Widget registry**: src/registry/widgets.ts — 16 widgets
- **Theme**: Mantine createTheme, brown/amber palette, src/theme/index.ts

## Structure
```
src/
  apps/          # todo, notes, kanban, calendar, pomodoro, weather, news, wikipedia, radio, soundscape, password-vault, bookmarks, chat
  widgets/       # search, clock, quick-note, quote, countdown, now-playing, todo, weather, calendar, world-clock, calculator, password-vault, kanban, news, wikipedia, bookmarks, chat
  config/        # APP_CONFIG (name, basePath, version)
  theme/         # Mantine theme
  layout/        # AppShell wrapper
  ui/            # Custom: app-header, dock, install-prompt, media-card, player-bar, settings-modal, widget-grid, widget-picker-dialog
  stores/        # Zustand stores
  lib/storage/   # StorageAdapter, LocalAdapter, engine
  registry/      # apps.ts + widgets.ts
  pages/         # launcher + not-found
  hooks/         # use-install-prompt
```

## Conventions
- Components: no Gf- prefix, PascalCase files
- Stores: camelCase files, zustand v5
- Apps: each in own dir, lazy-loaded
- Widgets: each in own dir, sized small/medium/large
- Icons: @iconify/react with lucide: prefix
- CSS: Mantine + index.css (no CSS modules)
