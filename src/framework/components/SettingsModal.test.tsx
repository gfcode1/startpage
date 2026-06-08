import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsModal } from './SettingsModal'
import { GfThemeProvider } from '../ThemeProvider'
import { ToastProvider } from '../ToastContext'

function renderWithProviders(open: boolean, onClose = vi.fn()) {
  return render(
    <ToastProvider>
      <GfThemeProvider>
        <SettingsModal open={open} onClose={onClose} />
      </GfThemeProvider>
    </ToastProvider>,
  )
}

describe('SettingsModal', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('does not render when open is false', () => {
    renderWithProviders(false)
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('renders when open is true', () => {
    renderWithProviders(true)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders close button', () => {
    renderWithProviders(true)
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('renders theme section', () => {
    renderWithProviders(true)
    expect(screen.getByText('Theme')).toBeInTheDocument()
  })

  it('renders both theme toggles', () => {
    renderWithProviders(true)
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('renders backup section', () => {
    renderWithProviders(true)
    expect(screen.getByText('Profile Backup')).toBeInTheDocument()
  })

  it('renders download and upload buttons', () => {
    renderWithProviders(true)
    expect(screen.getByText('Download backup')).toBeInTheDocument()
    expect(screen.getByText('Upload backup')).toBeInTheDocument()
  })

  it('has dialog role and aria-modal', () => {
    renderWithProviders(true)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', 'Settings')
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    renderWithProviders(true, onClose)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
