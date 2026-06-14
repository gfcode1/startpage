# ADR-001: Storage a 3 strati con interfaccia pluggabile

## Status
Accepted

## Context
L'applicazione deve persistere dati localmente (localStorage) ora, ma in futuro dovra supportare sync cloud (Supabase/API). Vogliamo che l'aggiunta del sync richieda zero modifiche agli store e alle app.

## Decision
Introduciamo una `StorageAdapter` interface a 3 strati:

1. **`StorageAdapter`** — interfaccia che definisce get/set/subscribe/getAll/import
2. **`LocalAdapter`** — implementazione concreta su localStorage
3. **Zustand persist middleware** — usa l'adapter per serializzare

Quando arrivera il sync, si scrive un `CloudAdapter` che implementa la stessa interfaccia.

## Rationale
- Zero cambiamenti negli store esistenti
- Testabile: si puo mockare l'adapter
- Separation of concerns: storage e un dettaglio tecnico

## Trade-offs
- Leggera astrazione in piu (interfaccia + adapter)
- Accettabile: storage e un cross-cutting concern, merita la sua astrazione

## Consequences
- **Positive**: foundation solida per sync futuro
- **Negative**: leggero overhead di progettazione iniziale
- **Mitigation**: l'interfaccia e minimal (5 metodi)
