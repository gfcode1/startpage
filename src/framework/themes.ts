export interface ThemeMeta {
  fontDisplay: string
  fontUi: string
  weightDisplay: number
}

export interface ThemeColors {
  bg: string
  bgApp: string
  bgElevated: string
  bgHover: string
  bgInput: string
  overlay: string
  text: string
  textMuted: string
  textInverse: string
  accent: string
  accentHover: string
  accentMuted: string
  border: string
  borderAccent: string
  glow: string
  success: string
  error: string
  warning: string
}

export interface ThemeShadows {
  sm: string
  md: string
  lg: string
  glow: string
}

export interface Theme {
  name: string
  meta: ThemeMeta
  colors: ThemeColors
  shadows: ThemeShadows
}

export const themes: Record<string, Theme> = {
  dark: {
    name: 'Dark',
    meta: { fontDisplay: 'Space Grotesk', fontUi: 'Inter', weightDisplay: 700 },
    colors: {
      bg: '#0f0b0a',
      bgApp: '#1a1412',
      bgElevated: '#241d1a',
      bgHover: '#2d2420',
      bgInput: '#15100e',
      overlay: 'rgba(0,0,0,0.55)',
      text: '#c4b5a5',
      textMuted: '#7a6f65',
      textInverse: '#0f0b0a',
      accent: '#d4763a',
      accentHover: '#e08a4e',
      accentMuted: '#d4763a22',
      border: '#2d2420',
      borderAccent: '#d4763a55',
      glow: '#d4763a40',
      success: '#5a9e6f',
      error: '#c44b4b',
      warning: '#d4a43a',
    },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.4)',
      md: '0 4px 12px rgba(0,0,0,0.5)',
      lg: '0 8px 32px rgba(0,0,0,0.6)',
      glow: '0 0 20px #d4763a30',
    },
  },
  light: {
    name: 'Light',
    meta: { fontDisplay: 'Space Grotesk', fontUi: 'Inter', weightDisplay: 700 },
    colors: {
      bg: '#f5ede0',
      bgApp: '#faf5ed',
      bgElevated: '#ffffff',
      bgHover: '#f0e8d8',
      bgInput: '#f0e8d8',
      overlay: 'rgba(0,0,0,0.3)',
      text: '#2a2018',
      textMuted: '#6a6055',
      textInverse: '#faf5ed',
      accent: '#d4763a',
      accentHover: '#bf6530',
      accentMuted: '#d4763a18',
      border: '#e0d8c8',
      borderAccent: '#d4763a44',
      glow: '#d4763a20',
      success: '#3a8a5a',
      error: '#c44b4b',
      warning: '#c49a2b',
    },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.08)',
      md: '0 4px 12px rgba(0,0,0,0.1)',
      lg: '0 8px 32px rgba(0,0,0,0.12)',
      glow: '0 0 20px #d4763a15',
    },
  },
}

export const themeKeys: string[] = Object.keys(themes)
