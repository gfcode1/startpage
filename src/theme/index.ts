import { createTheme, Paper } from '@mantine/core'

export const theme = createTheme({
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },
  colors: {
    dark: [
      '#d4c5b5',
      '#c4b5a5',
      '#a49585',
      '#8a7f75',
      '#7a6f65',
      '#3a3028',
      '#2d2420',
      '#241d1a',
      '#1a1412',
      '#0f0b0a',
    ],
    accent: [
      '#fef0e6',
      '#fde1cd',
      '#fbc39b',
      '#f4a66a',
      '#e08a4e',
      '#d4763a',
      '#b5642e',
      '#965226',
      '#78401e',
      '#5a3016',
    ],
    gray: [
      '#f7f6f4',
      '#efede9',
      '#e4e1db',
      '#d4cfc7',
      '#b8b2a8',
      '#9c958a',
      '#7e776e',
      '#605a52',
      '#423d38',
      '#24211e',
    ],
  },
  primaryColor: 'accent',
  primaryShade: { light: 6, dark: 5 },
  fontFamily: 'Inter, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, monospace',
  headings: {
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: '700',
  },
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  respectReducedMotion: true,
  components: {
    Paper: Paper.extend({
      defaultProps: {
        shadow: 'sm',
      },
    }),
  },
})
