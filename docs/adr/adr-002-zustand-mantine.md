# ADR-002: Zustand + Mantine per state management

## Status
Accepted

## Context
L'applicazione ha bisogno di state management per: player audio, tema, widget, notifiche. Il piano originale prevedeva 5 store Zustand. Con Mantine, tema e notifiche sono gia gestiti.

## Decision
Zustand solo per stato di dominio persistente che Mantine non copre:
- **player-store**: stato player audio (volume, playing, queue)
- **widget-store**: widget attivi e layout (persistito)
- **widget-options-store**: configurazioni per-widget (persistito)

Mantine gestisce:
- **Tema**: `MantineProvider` + `useMantineColorScheme` (con persist)
- **Notifiche**: `@mantine/notifications` `showNotification()`
- **Modali/drawer**: `useDisclosure()` hook
- **CmdK**: `@mantine/spotlight`

## Rationale
- Zustand si riduce da 5 a 3 store
- Mantine gestisce UI state con hook gia pronti e testati
- Separation of concerns: Zustand = business state, Mantine = UI state

## Consequences
- **Positive**: meno codice Zustand da scrivere e testare, UI state gia funzionante
- **Negative**: due librerie di state management (Zustand + Mantine hooks), ma ruoli distinti
