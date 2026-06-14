# ADR-004: Componenti senza brand prefix

## Status
Accepted

## Context
L'applicazione attuale usa prefisso `Gf` (GfButton, GfCard) legato al brand "GFcode". L'app sara rinominata "StartDeck" e potrebbe cambiare nome in futuro. Vogliamo che rinominare l'app sia banale.

## Decision
I componenti del design system:
- Stanno in `src/ui/`
- Hanno prefisso `Ui` (UiButton, UiCard)
- Il nome app e configurato in un unico punto (`src/config/app.ts`)

## Rationale
- `Ui` e generico, non legato al brand
- Cambiare nome app = modificare `APP_CONFIG.name`
- Nessuna collisione con elementi HTML perche importati via modulo

## Trade-offs
- `Ui` e un prefisso comune, ma chiaro

## Consequences
- **Positive**: rename triviale, componenti riutilizzabili in altri progetti
- **Negative**: nessuna
