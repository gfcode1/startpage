# ADR-005: Widget grid a taglie fisse

## Status
Accepted

## Context
Il widget grid attuale ha un resize handle custom con pointer events, complessita di 200+ righe. Pochi utenti lo usano effettivamente.

## Decision
Taglie fisse predefinite: small (2col), medium (3col), large (4col). Impostate nel registry. L'utente puo cambiare taglia da un menu contestuale, non con drag handle.

## Rationale
- Riduzione drastica della complessita
- UX semplificata
- Se serve resize flessibile in futuro, si aggiunge

## Trade-offs
- Meno flessibile. Utente non puo creare taglie custom.

## Consequences
- **Positive**: codice piu semplice, widget grid manutenibile
- **Negative**: minor controllo granulare per utenti power
