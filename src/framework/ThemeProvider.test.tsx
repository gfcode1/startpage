import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GfThemeProvider, useGfTheme } from './ThemeProvider'

function TestHarness() {
  const { themeKey, setTheme, activeTheme, themes } = useGfTheme()
  return (
    <div>
      <p data-testid="theme-key">{themeKey}</p>
      <p data-testid="theme-name">{activeTheme?.name}</p>
      <p data-testid="theme-count">{Object.keys(themes).length}</p>
      <button data-testid="btn-daylight" onClick={() => setTheme('daylight')}>Set Daylight</button>
      <button data-testid="btn-forest" onClick={() => setTheme('forest')}>Set Forest</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <GfThemeProvider>
      <TestHarness />
    </GfThemeProvider>,
  )
}

describe('GfThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders children', () => {
    renderWithProvider()
    expect(screen.getByTestId('theme-key')).toBeInTheDocument()
  })

  it('defaults to analog theme', () => {
    renderWithProvider()
    expect(screen.getByTestId('theme-key').textContent).toBe('analog')
  })

  it('provides activeTheme with name', () => {
    renderWithProvider()
    expect(screen.getByTestId('theme-name').textContent).toBe('Analog')
  })

  it('provides all 5 themes', () => {
    renderWithProvider()
    expect(screen.getByTestId('theme-count').textContent).toBe('5')
  })

  it('changes theme on setTheme', () => {
    renderWithProvider()
    act(() => { fireEvent.click(screen.getByTestId('btn-daylight')) })
    expect(screen.getByTestId('theme-key').textContent).toBe('daylight')
  })

  it('sets data-theme attribute on html', () => {
    renderWithProvider()
    act(() => { fireEvent.click(screen.getByTestId('btn-forest')) })
    expect(document.documentElement.getAttribute('data-theme')).toBe('forest')
  })

  it('persists theme to localStorage', () => {
    renderWithProvider()
    act(() => { fireEvent.click(screen.getByTestId('btn-daylight')) })
    const stored = localStorage.getItem('gf:_framework:theme')
    expect(stored).toBe('"daylight"')
  })

  it('migrates old gf-theme key', () => {
    localStorage.setItem('gf-theme', 'retro')
    expect(localStorage.getItem('gf-theme')).toBe('retro')
    renderWithProvider()
    const themeEl = screen.getByTestId('theme-key')
    expect(themeEl.textContent).toBe('retro')
    expect(localStorage.getItem('gf-theme')).toBeNull()
    expect(localStorage.getItem('gf:_framework:theme')).toBe('"retro"')
  })
})
