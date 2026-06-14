import { createTheme } from '@mantine/core'

export const theme = createTheme({
  colors: {
    dark: [
      '#d4c5b5',
      '#c4b5a5',
      '#a49585',
      '#8a7f75',
      '#6a6055',
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
  },
  primaryColor: 'accent',
  primaryShade: { light: 6, dark: 5 },
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: '700',
  },
  radius: {
    xs: '2px',
    sm: '4px',
    md: '5px',
    lg: '8px',
    xl: '12px',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  respectReducedMotion: true,
})
