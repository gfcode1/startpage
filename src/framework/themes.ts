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
  analog: {
    name: 'Analog',
    meta: { fontDisplay: 'Unbounded', fontUi: 'JetBrains Mono', weightDisplay: 800 },
    colors: {
      bg: '#0f0b0a',
      bgApp: '#1a1412',
      bgElevated: '#241d1a',
      bgHover: '#2d2420',
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
  spectrum: {
    name: 'Spectrum',
    meta: { fontDisplay: 'Tektur', fontUi: 'JetBrains Mono', weightDisplay: 400 },
    colors: {
      bg: '#0a0a1a',
      bgApp: '#12122a',
      bgElevated: '#1a1a3a',
      bgHover: '#22224a',
      text: '#c0c8e0',
      textMuted: '#7078a0',
      textInverse: '#0a0a1a',
      accent: '#00f0ff',
      accentHover: '#33ffff',
      accentMuted: '#00f0ff22',
      border: '#22224a',
      borderAccent: '#00f0ff55',
      glow: '#00f0ff40',
      success: '#00ff88',
      error: '#ff2288',
      warning: '#ffcc00',
    },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.6)',
      md: '0 4px 12px rgba(0,0,0,0.7)',
      lg: '0 8px 32px rgba(0,0,0,0.8)',
      glow: '0 0 20px #00f0ff30',
    },
  },
  daylight: {
    name: 'Daylight',
    meta: { fontDisplay: 'Syne', fontUi: 'Literata', weightDisplay: 700 },
    colors: {
      bg: '#f5ede0',
      bgApp: '#faf5ed',
      bgElevated: '#ffffff',
      bgHover: '#f0e8d8',
      text: '#2a2018',
      textMuted: '#6a6055',
      textInverse: '#faf5ed',
      accent: '#c44b2b',
      accentHover: '#d85a3a',
      accentMuted: '#c44b2b18',
      border: '#e0d8c8',
      borderAccent: '#c44b2b44',
      glow: '#c44b2b20',
      success: '#3a8a5a',
      error: '#c44b4b',
      warning: '#c49a2b',
    },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.08)',
      md: '0 4px 12px rgba(0,0,0,0.1)',
      lg: '0 8px 32px rgba(0,0,0,0.12)',
      glow: '0 0 20px #c44b2b15',
    },
  },
  retro: {
    name: 'Retro',
    meta: { fontDisplay: 'Tektur', fontUi: 'JetBrains Mono', weightDisplay: 400 },
    colors: {
      bg: '#1a1420',
      bgApp: '#241d30',
      bgElevated: '#2e2640',
      bgHover: '#382f4a',
      text: '#e0c8a8',
      textMuted: '#a08870',
      textInverse: '#1a1420',
      accent: '#ff6b6b',
      accentHover: '#ff8585',
      accentMuted: '#ff6b6b22',
      border: '#382f4a',
      borderAccent: '#ff6b6b55',
      glow: '#ff6b6b40',
      success: '#6bc46b',
      error: '#ff4444',
      warning: '#ffcc44',
    },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.5)',
      md: '0 4px 12px rgba(0,0,0,0.6)',
      lg: '0 8px 32px rgba(0,0,0,0.7)',
      glow: '0 0 20px #ff6b6b30',
    },
  },
  forest: {
    name: 'Forest',
    meta: { fontDisplay: 'Fraunces', fontUi: 'Work Sans', weightDisplay: 700 },
    colors: {
      bg: '#0d120f',
      bgApp: '#141a16',
      bgElevated: '#1c241f',
      bgHover: '#242e27',
      text: '#cad4c5',
      textMuted: '#9aaa9a',
      textInverse: '#0d120f',
      accent: '#7cba5a',
      accentHover: '#8ed66a',
      accentMuted: '#7cba5a22',
      border: '#242e27',
      borderAccent: '#7cba5a55',
      glow: '#7cba5a40',
      success: '#5a9e6f',
      error: '#c44b4b',
      warning: '#d4a43a',
    },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.5)',
      md: '0 4px 12px rgba(0,0,0,0.6)',
      lg: '0 8px 32px rgba(0,0,0,0.7)',
      glow: '0 0 20px #7cba5a30',
    },
  },
}

export const themeKeys: string[] = Object.keys(themes)
