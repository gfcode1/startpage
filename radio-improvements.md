# Radio App — Miglioramento Completo

## Goal
Trasformare l'app SomaFM in Radio: fix bugs, aggiungere preferiti, auto-retry, raggruppamento generi e sleep timer.

## Tasks
- [ ] 1. Rinominare somafm → radio (dir, file, componenti, interfacce)
- [ ] 2. Aggiornare registry apps.ts (id, nome, icona, colore)
- [ ] 3. Bug fix: togglingRef, abortRef, retry UI
- [ ] 4. Feature: Canali Preferiti (toggle cuore + localStorage)
- [ ] 5. Feature: Auto-retry fetch con backoff esponenziale
- [ ] 6. UI: raggruppamento per genere, card ridisegnate
- [ ] 7. Feature: Sleep Timer UI (usa store globale player)
- [ ] 8. Verifica: typecheck, lint, build

## Done When
- [ ] `npm run typecheck` passa
- [ ] `npm run lint` passa
- [ ] `npm run build` passa
- [ ] App Radio funzionante con tutte le nuove feature
