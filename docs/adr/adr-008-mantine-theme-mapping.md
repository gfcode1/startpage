# ADR-008: Mantine theme mapping

## Status
Accepted

## Context
Il progetto originale ha una palette colori calda (marroni, beige, arancio bruciato) applicata via CSS custom properties. Con Mantine dobbiamo mappare questa palette nel sistema di `createTheme`.

## Decision
Usiamo `createTheme` di Mantine per definire:
- `colors.dark[0..9]` → sostituita con toni caldi (stessa sequenza della palette attuale)
- `colors.accent[0..9]` → scala arancio bruciato (primary color)
- `primaryColor: 'accent'` → primary e l'arancio
- `primaryShade: { light: 6, dark: 5 }` → shade giusta per ogni tema
- `fontFamily: 'Inter, sans-serif'` per UI
- `headings.fontFamily: 'Space Grotesk, sans-serif'` per display

## Rationale
- Mantine `dark[]` scala va da scuro (9) a chiaro (0). La nostra palette attuale inverte: 9 e `#0f0b0a` (bg), 0 e `#d4c5b5` (text)
- Unico punto di definizione del tema, riutilizzabile ovunque
- `useMantineColorScheme` gestisce dark/light toggle gratis

## Consequences
- **Positive**: tema centralizzato, consistente, con type safety
- **Negative**: la scala `dark[]` di Mantine non corrisponde piu ai default (ma e voluto)
