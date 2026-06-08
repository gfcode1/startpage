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
      <button data-testid="btn-light" onClick={() => setTheme('light')}>Set Light</button>
      <button data-testid="btn-dark" onClick={() => setTheme('dark')}>Set Dark</button>
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

  it('defaults to dark theme', () => {
    renderWithProvider()
    expect(screen.getByTestId('theme-key').textContent).toBe('dark')
  })

  it('provides activeTheme with name', () => {
    renderWithProvider()
    expect(screen.getByTestId('theme-name').textContent).toBe('Dark')
  })

  it('provides 2 themes', () => {
    renderWithProvider()
    expect(screen.getByTestId('theme-count').textContent).toBe('2')
  })

  it('changes theme on setTheme', () => {
    renderWithProvider()
    act(() => { fireEvent.click(screen.getByTestId('btn-light')) })
    expect(screen.getByTestId('theme-key').textContent).toBe('light')
  })

  it('sets data-theme attribute on html', () => {
    renderWithProvider()
    act(() => { fireEvent.click(screen.getByTestId('btn-dark')) })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('persists theme to localStorage', () => {
    renderWithProvider()
    act(() => { fireEvent.click(screen.getByTestId('btn-light')) })
    const stored = localStorage.getItem('gf:_framework:theme')
    expect(stored).toBe('"light"')
  })

  it('migrates old gf-theme key', () => {
    localStorage.setItem('gf-theme', 'retro')
    expect(localStorage.getItem('gf-theme')).toBe('retro')
    renderWithProvider()
    const themeEl = screen.getByTestId('theme-key')
    expect(themeEl.textContent).toBe('dark')
    expect(localStorage.getItem('gf-theme')).toBeNull()
    expect(localStorage.getItem('gf:_framework:theme')).toBe('"dark"')
  })

  it('migrates daylight to light', () => {
    localStorage.setItem('gf-theme', 'daylight')
    renderWithProvider()
    const themeEl = screen.getByTestId('theme-key')
    expect(themeEl.textContent).toBe('light')
  })
})
