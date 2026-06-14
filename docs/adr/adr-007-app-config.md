# ADR-007: App name configurabile da unico punto

## Status
Accepted

## Context
L'app puo cambiare nome in futuro (GFcode → StartDeck → altro). Attualmente il nome e sparso in vari file. Vogliamo un unico source of truth.

## Decision
`src/config/app.ts` come unico punto di configurazione:

```ts
export const APP_CONFIG = {
  name: 'StartDeck',
  basePath: '/startpage/',
  version: '1.0.0',
} as const
```

Tutti i riferimenti al nome app importano da questo file. La base path del router usa `APP_CONFIG.basePath`. Il nome della web app (PWA manifest) usa `APP_CONFIG.name`.

## Rationale
- DRY: il nome esiste in un solo posto
- Cambiare nome = modificare un file
- Base path configurabile per diversi ambienti

## Trade-offs
- Leggera indirezione in piu

## Consequences
- **Positive**: rename triviale, configurazione centralizzata
- **Negative**: nessuna
