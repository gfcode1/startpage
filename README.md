# GFcode — curated by creative stations

A React + TypeScript PWA platform with **12 mini-apps** across music, games, productivity, and utilities — all sharing a unified shell, theming, and audio player.

## Apps

| Category | Apps |
|----------|------|
| **Music** | **YouTube LoFi** — Browse, search & play Lofi Girl / Chillhop YouTube streams · **SomaFM Radio** — 46 curated internet radio channels (ambient, electronic, lounge & more) · **Radio Browser** — Browse and play thousands of global radio stations · **Soundscape** — Multi-track ambient sound mixer with volume, pan & fade controls |
| **Games** | **2048** — Classic tile-merging puzzle · **Flappy Bird** — Tap-to-fly arcade game with high scores · **EmulatorJS** — Retro console emulation (NES, SNES, Game Boy, N64, Genesis & more) |
| **Productivity** | **Todo List** — Simple task manager · **Markdown Notes** — Write and preview Markdown notes |
| **Utilities** | **RSS Reader** — Aggregate and browse articles from multiple RSS feeds · **Weather** — Current conditions & 5-day forecast by city |

## Features

- **5 themes** — Analog, Spectrum, Daylight, Retro, Forest — applied as CSS custom properties with smooth transitions
- **Cross-app audio player** — Shared player bar persists volume, handles SomaFM, YouTube, Radio Browser, and Soundscape sources
- **PWA** — Installable as standalone app with service worker caching (Google Fonts, JS, CSS, assets)
- **Persistent storage** — All app data saved to `localStorage` under namespaced keys, with full export/import backup
- **Game engine** — Custom canvas game loop, Web Audio SFX synthesizer, tween system, and input manager used by 2048 and Flappy Bird
- **EmulatorJS** — Drag-and-drop ROM loading for 16 retro systems; bundled ROMs served at build time
- **RSS proxy** — Dev-only middleware that fetches feeds with CORS headers; article extraction via Mozilla Readability
- **SPA routing** — GitHub Pages–friendly with `_redirects` + `404.html` fallback
- **GitHub Actions** — Auto-deploys to GitHub Pages on push to `main`

## Built with

React 19, TypeScript 6, Vite 8, Vitest 4, React Router 7, ESLint 10 (flat config), `vite-plugin-pwa`, `@emulatorjs/emulatorjs`, `@mozilla/readability`, `marked`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |
