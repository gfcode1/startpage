import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react'
import { themes, Theme } from './themes'
import { useAppStorage } from './persistence/useAppStorage'

interface GfThemeContextValue {
  themeKey: string
  setTheme: (key: string) => void
  activeTheme: Theme
  themes: Record<string, Theme>
}

// eslint-disable-next-line react-refresh/only-export-components
export const GfThemeContext = createContext<GfThemeContextValue | null>(null)

const OLD_KEY = 'gf-theme'
const APP_ID = '_framework'
const KEY = 'theme'

function migrateOldKey(): void {
  try {
    const oldVal = localStorage.getItem(OLD_KEY)
    if (oldVal !== null) {
      const newKey = `gf:${APP_ID}:${KEY}`
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, JSON.stringify(oldVal))
      }
      localStorage.removeItem(OLD_KEY)
    }
  } catch (e) { console.warn('ThemeProvider: migration failed', e) }
}

function applyTheme(themeKey: string): void {
  const t = themes[themeKey]
  if (!t) return
  const root = document.documentElement
  const c = t.colors
  const m = t.meta
  const s = t.shadows

  root.setAttribute('data-theme', themeKey)

  const vars: Record<string, string | number> = {
    '--gf-bg': c.bg,
    '--gf-bg-app': c.bgApp,
    '--gf-bg-elevated': c.bgElevated,
    '--gf-bg-hover': c.bgHover,
    '--gf-text': c.text,
    '--gf-text-muted': c.textMuted,
    '--gf-text-inverse': c.textInverse,
    '--gf-accent': c.accent,
    '--gf-accent-hover': c.accentHover,
    '--gf-accent-muted': c.accentMuted,
    '--gf-border': c.border,
    '--gf-border-accent': c.borderAccent,
    '--gf-glow': c.glow,
    '--gf-success': c.success,
    '--gf-error': c.error,
    '--gf-warning': c.warning,
    '--gf-shadow-sm': s.sm,
    '--gf-shadow-md': s.md,
    '--gf-shadow-lg': s.lg,
    '--gf-shadow-glow': s.glow,
    '--gf-font-display': m.fontDisplay,
    '--gf-font-ui': m.fontUi,
    '--gf-weight-display': m.weightDisplay,
  }

  Object.entries(vars).forEach(([key, val]) => {
    root.style.setProperty(key, String(val))
  })
}

export function GfThemeProvider({ children }: { children: ReactNode }) {
  migrateOldKey()

  const [themeKey, setThemeKeyState] = useAppStorage<string>(APP_ID, KEY, 'analog')

  const setTheme = useCallback((key: string) => {
    if (themes[key]) {
      setThemeKeyState(key)
    }
  }, [setThemeKeyState])

  useEffect(() => {
    applyTheme(themeKey)
  }, [themeKey])

  return (
    <GfThemeContext.Provider value={{ themeKey, setTheme, activeTheme: themes[themeKey], themes }}>
      {children}
    </GfThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGfTheme(): GfThemeContextValue {
  const ctx = useContext(GfThemeContext)
  if (!ctx) throw new Error('useGfTheme must be used within GfThemeProvider')
  return ctx
}
