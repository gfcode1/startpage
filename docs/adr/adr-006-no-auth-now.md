# ADR-006: Foundation per sync futuro, zero auth ora

## Status
Accepted

## Context
L'app attuale ha Supabase auth + sync. Nella riscrittura non vogliamo auth. Ma vogliamo che in futuro aggiungere sync cloud sia semplice.

## Decision
- Zero auth nella prima versione
- StorageAdapter interface come foundation per sync futuro
- Quando si aggiungera sync: nuovo `CloudAdapter` + eventuale merge strategy
- Auth (se necessaria) come layer separato che non tocca gli store

## Rationale
- Auth e complesso (login, register, reset password, OAuth, refresh token)
- Non serve ora: l'app funziona offline con localStorage
- StorageAdapter permette di "sostituire" localStorage con cloud senza toccare logica

## Trade-offs
- Nessun sync cloud finche non lo implementiamo

## Consequences
- **Positive**: minor complessita, MVP piu veloce
- **Negative**: utenti non hanno dati cross-device (per ora)
