# StartDeck — Piano di Riscrittura Completo

> **Nome app:** StartDeck (configurabile da `src/config/app.ts`)
> **Approccio:** Full rewrite in nuovo repo — codice 100% nuovo
> **Stack:** React 19 · TypeScript 6 · **Mantine v9** · **TanStack Query v5** · Zustand · React Router 7 · Vite 8 · Vitest 4 · @dnd-kit · @iconify/react (Lucide) · Howler · **CodeMirror 6**

---

## Indice

1. [Architettura](#1-architettura)
2. [Piano Grafico](#2-piano-grafico)
3. [Struttura del Progetto](#3-struttura-del-progetto)
4. [Componenti UI](#4-componenti-ui)
5. [Data Fetching](#5-data-fetching)
6. [Stores (Zustand)](#6-stores-zustand)
7. [Router e Layout](#7-router-e-layout)
8. [Registry](#8-registry)
9. [Widget System](#9-widget-system)
10. [App](#10-app)
11. [Widget](#11-widget)
12. [Keyboard Shortcuts](#12-keyboard-shortcuts)
13. [Player Audio](#13-player-audio)
14. [Settings Modal](#14-settings-modal)
15. [Testing](#15-testing)
16. [PWA e Deploy](#16-pwa-e-deploy)
17. [Configurazione Progetto](#17-configurazione-progetto)
18. [Fasi di Esecuzione](#18-fasi-di-esecuzione)
19. [ADRs](#19-adrs)
20. [Progress Tracker](#20-progress-tracker)

---

## 1. Architettura

### 1.1 Storage a 3 strati con interfaccia pluggabile

```
Store (Zustand persist middleware)
  → usa StorageAdapter
       │
StorageAdapter interface
  - get<T>(key): T
  - set<T>(key, value): void
  - subscribe(key, cb): unsub
  - getAll(): Record<string, unknown>
  - import(data): void
       │
  ┌──────────────┐     ┌──────────────┐
  │ LocalAdapter  │     │ CloudAdapter  │
  │ (localStorage)│     │ (futuro)     │
  └──────────────┘     └──────────────┘
```

**Perche**: Quando si vorra aggiungere sync cloud, bastera scrivere un `CloudAdapter` che implementa la stessa interfaccia di `LocalAdapter`. Zero cambiamenti negli store esistenti.

### 1.2 State Management

| Layer | Libreria | Cosa gestisce |
|-------|----------|--------------|
| Stato server (API) | **TanStack Query** | Weather, HN, Wikipedia, Radio Browser, RSS, Quote |
| Stato dominio persistente | **Zustand** | Player audio, widget config |
| Stato UI | **Mantine hooks** | Tema, notifiche, modali, spotlight |
| Form | **@mantine/form** | Todo, Notes, Calendar eventi, Kanban card |

### 1.3 App name configurabile

```ts
// src/config/app.ts — unico punto
export const APP_CONFIG = {
  name: 'StartDeck',
  basePath: '/startpage/',
  version: '1.0.0',
} as const
```

---

## 2. Piano Grafico

### 2.1 Decisioni di Design

| Decisione | Scelta |
|-----------|--------|
| Stile visivo | Evoluzione dell'attuale (marroni caldi + arancio bruciato) |
| Launcher layout | Widget-first con dock (stile macOS) |
| Border radius | Sharp minimal: 5px default |
| Animazioni | Mantine built-in + view transition + widget stagger |
| Component library | **Mantine v9** + 7 componenti custom |

### 2.2 Tema Mantine

```ts
const theme = createTheme({
  colors: {
    dark: [
      '#d4c5b5', '#c4b5a5', '#a49585', '#8a7f75', '#6a6055',
      '#3a3028', '#2d2420', '#241d1a', '#1a1412', '#0f0b0a',
    ],
    accent: [
      '#fef0e6', '#fde1cd', '#fbc39b', '#f4a66a', '#e08a4e',
      '#d4763a', '#b5642e', '#965226', '#78401e', '#5a3016',
    ],
  },
  primaryColor: 'accent',
  primaryShade: { light: 6, dark: 5 },
  defaultColorScheme: 'dark',
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700' },
  radius: { xs: '2px', sm: '4px', md: '5px', lg: '8px', xl: '12px' },
  defaultRadius: 'md',
  cursorType: 'pointer',
  respectReducedMotion: true,
})
```

### 2.3 Tipografia

- **Display**: Space Grotesk 700 (headings)
- **UI**: Inter 400/500/600 (Mantine default)

### 2.4 Layout Generale

```
┌─────────────────────────────────────────┐
│  Topbar  [←]  StartDeck  [search] [⚙️]  │ h=56px, auto-hide su scroll
├─────────────────────────────────────────┤
│  Widget Grid (scrollabile)              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │      │ │      │ │      │ │      │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────────────┤
│  Dock (icone app, scroll orizzontale)    │
├─────────────────────────────────────────┤
│  PlayerBar (slide-up se attivo)          │ h=64px
└─────────────────────────────────────────┘
```

### 2.5 Componenti Mantine Usati

Tutti i componenti UI base sono Mantine: Button, Card, Badge, Tabs, SegmentedControl, Slider, Skeleton, Modal, Drawer, Notification, Spotlight, AppShell, ActionIcon, Tooltip, Menu, TextInput, Textarea, Select, Switch, Grid, Progress, ThemeIcon, Paper, Divider, Text, Title, ScrollArea, Code, Kbd, Group, Stack, Container, SimpleGrid, Alert, Loader, Timeline, Chip, CloseButton.

### 2.6 Hook Mantine Usati

useLocalStorage, useHotkeys, useDisclosure, useMediaQuery, useDebouncedValue, useColorScheme, useReducedMotion, useTimeout, useInterval, useForceUpdate, useMergedRef, useFocusTrap, useClickOutside.

### 2.7 Componenti Custom (7)

MediaCard, AppHeader, PlayerBar, Dock, WidgetGrid, WidgetPickerDialog, InstallPrompt.

---

## 3. Struttura del Progetto

```
startdeck/
├── public/                    (_redirects, 404, favicon, icone PWA)
├── src/
│   ├── main.tsx               (entry: MantineProvider + QueryClient + Spotlight)
│   ├── App.tsx                (Router + Providers)
│   ├── index.css              (@import mantine styles + animazioni custom)
│   ├── config/app.ts
│   ├── lib/
│   │   ├── storage/           (StorageAdapter interface, LocalAdapter, engine)
│   │   └── utils/format.ts
│   ├── theme/index.ts         (createTheme con palette custom)
│   ├── ui/                    (7 componenti custom)
│   ├── stores/                (3 Zustand: player, widget, widget-options)
│   ├── providers/             (player-provider, error-boundary)
│   ├── layout/app-shell.tsx   (Mantine AppShell + Topbar + PlayerBar)
│   ├── registry/              (apps.ts, widgets.ts, icons.ts)
│   ├── pages/                 (launcher, not-found, app-wrapper)
│   ├── apps/                  (13 app)
│   ├── widgets/               (14 widget)
│   └── engine/                (sound-mixer, audio-engine)
├── docs/adr/                  (8 ADRs)
├── postcss.config.cjs
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
└── .gitignore
```

---

## 4. Componenti UI

### 4.1 Componenti Mantine (gia pronti, non li scriviamo)

Categorie: Inputs (TextInput, Textarea, Select, Switch, Chip, Checkbox), Buttons (Button, ActionIcon), Navigation (Tabs, SegmentedControl, Anchor), Overlays (Modal, Drawer, Popover, Tooltip), Data Display (Badge, Card, Table, Kbd, Code, Notification), Feedback (Alert, Progress, Skeleton, Loader), Typography (Text, Title), Layout (AppShell, Group, Stack, Grid, Container, Paper, Divider, Space, SimpleGrid).

### 4.2 Componenti Custom (7 da scrivere)

| Componente | Descrizione | Priorita |
|-----------|------------|----------|
| MediaCard | Card per stazioni radio con album art + equalizer animato + play indicator | P1 |
| AppHeader | Header per-app con badge, segmented control, search input | P1 |
| PlayerBar | Fixed bottom player: cover, info, play/stop, volume, queue, sleep timer | P1 |
| Dock | macOS-style dock: icone app scrollabili con label e separatori | P1 |
| WidgetGrid | DnD grid (@dnd-kit su Mantine Grid), system widget pinned | P1 |
| WidgetPickerDialog | Dialog per aggiungere widget inattivi | P2 |
| InstallPrompt | PWA install banner | P2 |

---

## 5. Data Fetching

### 5.1 TanStack Query — Setup

Provider in App.tsx, QueryClient con default.

### 5.2 staleTime per App

| App | staleTime | refetchInterval | Note |
|-----|-----------|----------------|------|
| Weather | 30 min | 30 min | Dati meteo |
| Hacker News | 5 min | 5 min | Feed news |
| Wikipedia | Infinity | — | Dato statico per sessione |
| Radio Browser | 60 min | — | Catalogo stazioni |
| RSS Reader | 15 min | 15 min | Feed RSS |
| Quote widget | 24 h | — | Cambia ogni giorno |
| News widget | 15 min | 15 min | Headlines |
| Word of Day | 24 h | — | Parola del giorno |

### 5.3 Pattern comune

```tsx
// Ogni app con API esterna segue questo pattern
function useWeather(lat: number, lon: number) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => fetchWeatherApi(lat, lon),
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 30,
  })
}
```

### 5.4 Cache PWA

Le risposte API sono cache dal service worker con strategia stale-while-revalidate per funzionare offline.

---

## 6. Stores (Zustand)

Solo 3 store, solo per stato di dominio persistente.

### 6.1 player-store.ts

Volume (persistito), playingId, playingTitle, subtitle, isPlaying, isLoading, queue, sleepTimer.

Azioni: play, stop, setVolume, setPlaying, setLoading, setPlayInfo, addToQueue, removeFromQueue, playNextFromQueue, clearQueue, setSleepTimer, clearSleepTimer.

### 6.2 widget-store.ts

activeWidgets (persistito), layout (persistito).

Azioni: addWidget, removeWidget, reorderWidgets, setWidgetSize.

### 6.3 widget-options-store.ts

options (persistito).

Azioni: setOption, getOption.

---

## 7. Router e Layout

### 7.1 Route Structure

```
BrowserRouter (basename da APP_CONFIG.basePath)
  "/"                → Launcher (widget grid + dock)
  "/:appPath"        → AppWrapper (lazy-load app)
  "*"                → NotFound
```

### 7.2 View Transitions

`useViewTransition()` hook: `document.startViewTransition()` + fallback `requestAnimationFrame`. Animazione scale 0.98 + fade uguale all'attuale.

### 7.3 AppShell (Mantine AppShell)

```tsx
<MantineProvider theme={theme}>
  <QueryClientProvider client={queryClient}>
    <Notifications position="bottom-right" />
    <SpotlightProvider actions={spotlightActions} shortcut="mod + K">
      <RouterProvider>
        <AppShell header={{ height: 56 }} footer={{ height: isPlaying ? 64 : 0 }}>
          <AppShell.Header><Topbar auto-hide /></AppShell.Header>
          <AppShell.Main><Outlet /></AppShell.Main>
          <Dock />  (solo home)
          <PlayerBar />
        </AppShell>
      </RouterProvider>
    </SpotlightProvider>
  </QueryClientProvider>
</MantineProvider>
```

---

## 8. Registry

### 8.1 App Definition

```ts
type AppCategory = 'productivity' | 'music' | 'utilities'

interface AppDefinition {
  id: string
  name: string
  description: string
  path: string
  color: string
  icon: string
  category: AppCategory
  component: React.LazyExoticComponent
  widgets?: string[]
}
```

### 8.2 Widget Definition

```ts
type WidgetSize = 'small' | 'medium' | 'large'

interface WidgetDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'system' | 'standard' | 'app'
  defaultActive: boolean
  size: WidgetSize
  component: React.LazyExoticComponent
  options?: WidgetOption[]
}
```

### 8.3 App Registry (13 app)

| # | App | ID | Category | Path |
|---|-----|-----|----------|------|
| 1 | Todo | todo | productivity | /todo |
| 2 | Notes | notes | productivity | /notes |
| 3 | Kanban | kanban | productivity | /kanban |
| 4 | Calendar | calendar | productivity | /calendar |
| 5 | Pomodoro | pomodoro | productivity | /pomodoro |
| 6 | Weather | weather | utilities | /weather |
| 7 | RSS Reader | rssreader | utilities | /rssreader |
| 8 | Hacker News | hackernews | utilities | /hackernews |
| 9 | Wikipedia | wikipedia | utilities | /wikipedia |
| 10 | Radio Browser | radiobrowser | music | /radiobrowser |
| 11 | SomaFM | somafm | music | /somafm |
| 12 | Moodist | moodist | music | /moodist |
| 13 | YouTube Streams | youtubestreams | music | /youtubestreams |

### 8.4 Widget Registry (14 widget)

| # | Widget | ID | Category | Size | Default |
|---|--------|-----|----------|------|---------|
| 1 | Search | search | system | large | Si |
| 2 | Clock | clock | standard | small | Si |
| 3 | Quick Note | quicknote | standard | small | Si |
| 4 | Quote | quote | standard | small | No |
| 5 | Countdown | countdown | standard | small | No |
| 6 | Todo | todo | app | medium | No |
| 7 | Weather | weather | app | medium | No |
| 8 | Calendar | calendar | app | medium | No |
| 9 | News | news | app | medium | No |
| 10 | Radio Fav | radiofav | app | small | No |
| 11 | Now Playing | nowplaying | app | small | No |
| 12 | Password | password | standard | small | No |
| 13 | Calculator | calculator | standard | small | No |
| 14 | World Clock | worldclock | standard | small | No |

---

## 9. Widget System

### 9.1 Grid Layout

Mantine Grid con span configurabile:

- **small**: `{ base: 6, sm: 3, lg: 2 }`
- **medium**: `{ base: 6, sm: 4, lg: 3 }`
- **large**: `{ base: 6, sm: 6, lg: 4 }`

### 9.2 Regole

- System widget (Search) pinned prima, span full, non sortable
- @dnd-kit con SortableContext + closestCenter
- FLIP animations via useFlipAnimation
- Niente resize handle — taglie fisse predefinite
- WidgetPickerDialog per aggiungere widget
- WidgetOptionsPopup per configurare

---

## 10. App

### 10.1 Pattern comune

```
src/apps/todo/
├── todo-app.tsx
├── todo-app.test.tsx
├── types.ts
├── utils.ts
└── widgets/
    └── todo-widget.tsx
```

Tutto con Mantine. Data fetching via TanStack Query (se API esterna).

### 10.2 Dettaglio app

| App | API | Storage | Note |
|-----|-----|---------|------|
| Todo | — | StorageAdapter | @mantine/form, CmdN nuovo, CmdS salva |
| Notes | — | StorageAdapter auto-save 1s | CodeMirror 6 editor, marked preview |
| Kanban | — | StorageAdapter | Colonne personalizzabili, @dnd-kit |
| Calendar | — | StorageAdapter | Vista mese + settimana, eventi dettaglio |
| Pomodoro | — | StorageAdapter | useInterval, Mantine Progress |
| Weather | Open-Meteo | TanStack Query (30min) | react-leaflet |
| RSS Reader | Feed XML | TanStack Query (15min) | @mozilla/readability |
| Hacker News | HN API | TanStack Query (5min) | Mantine Card |
| Wikipedia | Wiki API | TanStack Query (session) | Search + article |
| Radio Browser | Radio API | TanStack Query (60min) | Howler, PlayerBar |
| SomaFM | SomaFM | — | Howler, PlayerBar |
| YouTubeStreams | YouTube | — | iframe + Howler |
| Moodist | Audio files | SoundMixer | Web Audio API |

### 10.3 Priorita implementazione

| Batch | App | Motivazione |
|-------|-----|-----------|
| **P1** | Todo, Pomodoro, Notes, Radio Browser | CRUD base + player audio |
| **P2** | Hacker News, Wikipedia, Weather, Calendar | API esterne + calendario |
| **P3** | Kanban, RSS, SomaFM, YouTube, Moodist | Complessita media/alta |

---

## 11. Widget

### 11.1 Pattern comune

```
src/widgets/clock-widget/
├── clock-widget.tsx
└── clock-widget.test.tsx
```

### 11.2 Widget dettaglio

| Widget | Dati | Refresh | Priorita |
|--------|------|---------|----------|
| Search | — | — | P1 |
| Clock | locale | ogni secondo | P1 |
| QuickNote | StorageAdapter | — | P1 |
| Quote | TanStack Query | 24h | P2 |
| Countdown | StorageAdapter | — | P2 |
| TodoWidget | StorageAdapter | — | P1 |
| WeatherWidget | TanStack Query | 30min | P2 |
| CalendarWidget | StorageAdapter | — | P2 |
| NewsWidget | TanStack Query | 15min | P2 |
| RadioFavWidget | StorageAdapter | — | P2 |
| NowPlayingWidget | player-store | realtime | P2 |
| PasswordWidget | — | — | P3 |
| CalculatorWidget | — | — | P3 |
| WorldClockWidget | locale | ogni secondo | P3 |

---

## 12. Keyboard Shortcuts

### Globali

| Shortcut | Azione | Implementazione |
|----------|--------|----------------|
| Cmd / Ctrl + K | Spotlight (search + navigation) | @mantine/spotlight |
| Cmd / Ctrl + J | Toggle dark/light theme | useHotkeys + useMantineColorScheme |
| Escape | Chiudi modale/drawer attivo | Mantine built-in |

### Per-app (dove applicabile)

| Shortcut | Azione | App |
|----------|--------|-----|
| Cmd / Ctrl + S | Salva | Todo, Notes, Kanban |
| Cmd / Ctrl + N | Nuovo elemento | Todo (task), Notes (nota), Kanban (card) |
| Cmd / Ctrl + F | Cerca/filtra attuale | Notes, Calendar, RSS |
| Cmd / Ctrl + Z | Undo | Notes (CodeMirror built-in) |
| Frecce su/giu | Navigazione lista | Todo, Kanban, HN, Wikipedia |

Gestiti via `useHotkeys` di Mantine in ogni app.

---

## 13. Player Audio

### Architecture

```
PlayerStore (Zustand)
  → PlayerBar (componente custom)
  → Howler (SomaFM, Radio Browser, YouTube)
  → SoundMixer Web Audio (Moodist)
  → AudioEngine (giochi futuri)
```

### PlayerBar

```
[● LIVE]  Artist - Song   [⏸] [■] 🔊━━━━┓ queue ⏰
```

Slide-up animato quando `isPlaying === true`. Elementi: status dot, track info, play/pause, stop, volume slider, queue button + badge, sleep timer.

---

## 14. Settings Modal

Contenuto del modal:

| Sezione | Contenuto |
|---------|-----------|
| **Tema** | Toggle dark/light con preview |
| **Backup** | Export JSON (download), Import JSON (upload file), data validation |
| **Info** | Nome app, versione (da APP_CONFIG), crediti, link GitHub |

Reset widget defaults (pulsante con conferma).

Implementato con Mantine Modal + Tabs o accordion sections.

---

## 15. Testing

### 15.1 Obbligatorio (core + critiche)

| Categoria | Cosa testare |
|-----------|-------------|
| **Storage** | StorageEngine (get/set/subscribe/getAll/import), LocalAdapter |
| **Store** | player-store, widget-store, widget-options-store |
| **Componenti custom** | Tutti e 7: MediaCard, AppHeader, PlayerBar, Dock, WidgetGrid, WidgetPickerDialog, InstallPrompt |
| **App critiche** | TodoApp (CRUD), NotesApp (save/load/editor) |
| **Hook** | useInstallPrompt |

### 15.2 Opzionale (se avanza tempo)

App secondarie (HN, Wikipedia, Calendar), widget non critici, hook minori.

### 15.3 Tooling

- Vitest (unit)
- @testing-library/react (componenti)
- jsdom (DOM environment)

---

## 16. PWA e Deploy

### 16.1 PWA (vite-plugin-pwa)

| Strategia | Cosa |
|-----------|------|
| Pre-cache | App shell (JS/CSS/HTML), Google Fonts |
| Runtime cache | API calls (Weather, HN, RSS) stale-while-revalidate |
| Offline | App funzionante con dati localStorage + API cached |
| Auto-update | Service worker auto-aggiornamento |
| Navigate fallback | /startpage/ |

### 16.2 Deploy (GitHub Pages)

.github/workflows/deploy.yml: build → upload dist/ → deploy a gh-pages.

public/_redirects: `/* /index.html 200`. public/404.html con sessionStorage.redirect.

---

## 17. Configurazione Progetto

### 17.1 Dipendenze

```json
{
  "dependencies": {
    "@mantine/core": "^9.3",
    "@mantine/hooks": "^9.3",
    "@mantine/notifications": "^9.3",
    "@mantine/spotlight": "^9.3",
    "@mantine/form": "^9.3",
    "@tanstack/react-query": "^5",
    "@codemirror/view": "^6",
    "@codemirror/state": "^6",
    "@codemirror/lang-markdown": "^6",
    "@codemirror/theme-one-dark": "^6",
    "zustand": "^5",
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^7",
    "@iconify/react": "^6",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^10",
    "howler": "^2",
    "dompurify": "^3",
    "marked": "^18",
    "leaflet": "^1",
    "react-leaflet": "^5",
    "@mozilla/readability": "^0.6",
    "html2pdf.js": "^0.14"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6",
    "vite": "^8",
    "vite-plugin-pwa": "^1",
    "typescript": "^6",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/howler": "^2",
    "@types/leaflet": "^1",
    "@types/dompurify": "^3",
    "vitest": "^4",
    "@testing-library/react": "^16",
    "@testing-library/jest-dom": "^6",
    "jsdom": "^29",
    "eslint": "^10",
    "typescript-eslint": "^8",
    "eslint-plugin-react-hooks": "^7",
    "globals": "^17",
    "postcss": "^8",
    "postcss-preset-mantine": "^2",
    "postcss-mixins": "^11",
    "husky": "^9",
    "lint-staged": "^15",
    "rollup-plugin-visualizer": "^5"
  }
}
```

### 17.2 postcss.config.cjs

```cjs
module.exports = {
  plugins: {
    'postcss-mixins': {},
    'postcss-preset-mantine': {},
  },
}
```

### 17.3 vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          { urlPattern: /^https:\/\/api\.open-meteo\.com/, handler: 'StaleWhileRevalidate' },
          { urlPattern: /^https:\/\/hacker-news\.firebaseio\.com/, handler: 'StaleWhileRevalidate' },
          { urlPattern: /^https:\/\/fonts\.googleapis\.com/, handler: 'CacheFirst' },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': '/src' } },
  base: '/startpage/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/notifications', '@mantine/spotlight'],
          query: ['@tanstack/react-query'],
          codemirror: ['@codemirror/view', '@codemirror/state', '@codemirror/lang-markdown'],
        },
      },
    },
  },
})
```

### 17.4 main.tsx

```tsx
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/spotlight/styles.css'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { SpotlightProvider, spotlightActions } from '@mantine/spotlight'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from './theme'
import { App } from './App'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, refetchOnWindowFocus: false } },
})

const root = document.getElementById('root')
root?.render(
  <MantineProvider theme={theme} defaultColorScheme="dark">
    <QueryClientProvider client={queryClient}>
      <Notifications position="bottom-right" />
      <SpotlightProvider shortcut="mod + K" actions={spotlightActions}>
        <App />
      </SpotlightProvider>
    </QueryClientProvider>
  </MantineProvider>
)
```

### 17.5 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "paths": { "@/*": ["./src/*"] },
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

## 18. Fasi di Esecuzione

### Fase 0: Setup progetto
- [ ] Verificare oldcode/ presente
- [ ] `npm create vite@latest startdeck -- --template react-ts`
- [ ] Installare tutte le dipendenze
- [ ] Configurare postcss.config.cjs
- [ ] Configurare tsconfig.json (strict)
- [ ] Configurare vite.config.ts (alias, code splitting, PWA)
- [ ] Configurare eslint.config.js
- [ ] Configurare vitest (jsdom, setup file)
- [ ] Setup public/ (_redirects, 404, favicon, icone PWA)
- [ ] Setup .github/workflows/deploy.yml

### Fase 1: Fondamenta architetturali
- [ ] src/config/app.ts
- [ ] StorageAdapter interface + LocalAdapter + engine + test
- [ ] src/utils/format.ts

### Fase 2: Tema + Mantine base
- [ ] src/theme/index.ts (createTheme)
- [ ] src/main.tsx (MantineProvider + QueryClient + Notifications + Spotlight)
- [ ] Verificare dark/light toggle funzionante
- [ ] Verificare Spotlight CmdK funzionante

### Fase 3: Componenti custom
- [ ] Dock (icone app, scroll, separatori)
- [ ] AppHeader (per-app actions + search)
- [ ] MediaCard (album art + equalizer)
- [ ] PlayerBar (player controls + slide-up)
- [ ] WidgetGrid (@dnd-kit + Mantine Grid)
- [ ] WidgetPickerDialog
- [ ] InstallPrompt
- [ ] Test tutti i componenti custom

### Fase 4: Stores Zustand
- [ ] player-store + test
- [ ] widget-store + test
- [ ] widget-options-store + test

### Fase 5: Router + Layout + Registry
- [ ] App.tsx (Router + Provider tree)
- [ ] layout/app-shell.tsx (Mantine AppShell)
- [ ] registry/apps.ts + widgets.ts + icons.ts
- [ ] pages/launcher.tsx (widget grid + dock)
- [ ] pages/not-found.tsx + pages/app-wrapper.tsx

### Fase 6: Apps Priority 1
- [ ] Todo (Mantine form, StorageAdapter, CmdN/CmdS)
- [ ] Pomodoro (Mantine Progress, useInterval)
- [ ] Notes (CodeMirror 6, auto-save StorageAdapter)
- [ ] Radio Browser (Howler, PlayerBar, TanStack Query)

### Fase 7: Apps Priority 2
- [ ] Hacker News (TanStack Query 5min, Mantine Card)
- [ ] Wikipedia (TanStack Query session)
- [ ] Weather (TanStack Query 30min, react-leaflet)
- [ ] Calendar (vista mese/settimana, eventi CRUD)

### Fase 8: Apps Priority 3
- [ ] Kanban (colonne custom, @dnd-kit, StorageAdapter)
- [ ] RSS Reader (@mozilla/readability, TanStack Query 15min)
- [ ] SomaFM (Howler, PlayerBar)
- [ ] YouTubeStreams (PlayerBar)
- [ ] Moodist (SoundMixer Web Audio API)

### Fase 9: Widget
- [ ] Search, Clock, QuickNote (P1)
- [ ] Quote, Countdown, TodoWidget (P1)
- [ ] WeatherWidget, CalendarWidget, NewsWidget (P2)
- [ ] RadioFavWidget, NowPlayingWidget (P2)
- [ ] PasswordWidget, CalculatorWidget, WorldClockWidget (P3)

### Fase 10: Polish + Deploy
- [ ] Animazioni (view transition, widget stagger fade-in)
- [ ] Keyboard shortcuts globali (CmdK, CmdJ)
- [ ] Per-app shortcuts (CmdS, CmdN, CmdF)
- [ ] Settings modal (tema + backup + info)
- [ ] PWA completa (pre-cache + runtime cache)
- [ ] Service worker API caching (stale-while-revalidate)
- [ ] Backup/restore in SettingsModal
- [ ] Test finale: npm run lint && npm run test && npm run build

---

## 19. ADRs

| # | Decisione | File |
|---|-----------|------|
| 01 | Storage a 3 strati con interfaccia pluggabile | adr-001-storage-adapter.md |
| 02 | Zustand + Mantine per state management (Zustand solo business) | adr-002-zustand-mantine.md |
| 03 | Mantine v9 come libreria componenti | adr-003-mantine.md |
| 04 | Componenti senza brand prefix (src/ui/) | adr-004-no-brand-prefix.md |
| 05 | Widget grid a taglie fisse (niente resize handle) | adr-005-widget-fixed-sizes.md |
| 06 | Foundation per sync futuro, zero auth ora | adr-006-no-auth-now.md |
| 07 | App name configurabile da src/config/app.ts | adr-007-app-config.md |
| 08 | Mantine theme mapping — palette marrone/arancio | adr-008-mantine-theme-mapping.md |

---

## 20. Progress Tracker

Salvato in `docs/REWRITE-PROGRESS.md`.

```
# Rewrite Progress

## Fasi
- [ ] Fase 0: Setup progetto
- [ ] Fase 1: Fondamenta architetturali
- [ ] Fase 2: Tema + Mantine base
- [ ] Fase 3: Componenti custom (7)
- [ ] Fase 4: Stores Zustand (3)
- [ ] Fase 5: Router + Layout + Registry
- [ ] Fase 6: Apps Priority 1 (4)
- [ ] Fase 7: Apps Priority 2 (4)
- [ ] Fase 8: Apps Priority 3 (5)
- [ ] Fase 9: Widget (14)
- [ ] Fase 10: Polish + Deploy

## Stats
- Componenti custom: [X]/7
- Stores: [X]/3
- Apps: [X]/13
- Widgets: [X]/14
- Tests: [X]
- Build: passing/failing
```
