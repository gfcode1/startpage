# StartDeck

A customizable startpage/launcher dashboard — replaces your browser new-tab page with widgets, apps, and tools.

## Stack

React 19 · TypeScript 6 · Vite 8 · Mantine v9 · Zustand · TanStack Query v5 · React Router 7

## Getting Started

```bash
npm install
npm run dev     # → http://localhost:5173/startpage/
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run test` | Run tests (Vitest) |
| `npm run lint` | Lint (ESLint) |
| `npm run typecheck` | TypeScript check |

## Structure

```
src/
├── apps/          # App modules (todo, notes, kanban, calendar, …)
├── widgets/       # Widget modules (clock, search, quote, …)
├── config/        # App config
├── theme/         # Mantine theme
├── layout/        # AppShell layout
├── lib/           # Storage adapter, utils
├── stores/        # Zustand stores
├── registry/      # App + widget registry
├── ui/            # Custom components
├── pages/         # Route pages
└── hooks/         # Shared hooks
```

## Apps

Todo · Notes · Kanban · Calendar · Pomodoro · Weather · RSS Reader · Wikipedia · SomaFM · Moodist

## Widgets

Search · Clock · Quick Note · Quote · Countdown · Todo · Weather · Calendar · Now Playing · Password · Calculator · World Clock
