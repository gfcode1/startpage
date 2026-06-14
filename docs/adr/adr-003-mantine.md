# ADR-003: Mantine v9 come libreria componenti

## Status
Accepted

## Context
L'applicazione ha bisogno di ~30 componenti UI (button, card, badge, slider, tabs, modali, notifiche, command palette, form inputs). Dobbiamo scegliere tra:
- Scriverli tutti custom con Tailwind
- Usare una libreria di componenti pre-fatti

Il carico di sviluppo e gia ~13 app + 14 widget + engine + storage. Scrivere anche 14+ componenti UI custom rallenterebbe troppo.

## Decision
Usiamo Mantine v9 come libreria componenti principale.

## Rationale
- 120+ componenti pronti, 70+ hook inclusi
- Dark/light mode nativa con `useMantineColorScheme`
- Spotlight (CmdK palette) built-in
- Notifications system built-in
- Form library (@mantine/form) per Todo/Notes/Calendar
- Hook utilissimi: useHotkeys, useLocalStorage, useInterval, useDisclosure
- Tema personalizzabile via `createTheme()` (si mappa 1:1 con la nostra palette)
- Maturita: 30k+ GitHub stars, 5M+ download/mese, 500+ contributor
- DX eccellente: tutto funziona out of the box

## Trade-offs
- **Bundle**: Mantine core ~200KB gzipped vs zero di Tailwind
  - **Mitigazione**: manualChunks in Vite separa Mantine dal resto; PWA caching lo serve veloce
- **Stile**: Mantine usa PostCSS, non Tailwind (ma avevamo Tailwind nel piano originale)
  - **Accettabile**: il risparmio in componenti scritti compensa

## Risparmio stimato
- ~400 righe di componenti UI non piu da scrivere (14 → 7 custom)
- ~100 righe di hook custom non piu da scrivere (5 → 1)
- Dark/light toggle, command palette, notifiche funzionano subito

## Consequences
- **Positive**: sviluppo molto piu veloce, componenti accessibili, testati, documentati
- **Negative**: dipendenza da libreria esterna, bundle ~200KB extra
- **Mitigation**: tree-shaking automatico, code splitting, PWA caching
