import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastContext'

function TestHarness() {
  const { addToast } = useToast()
  return (
    <div>
      <button onClick={() => addToast('Test message')}>Add info</button>
      <button onClick={() => addToast('Success!', 'success')}>Add success</button>
      <button onClick={() => addToast('Error!', 'error')}>Add error</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <TestHarness />
    </ToastProvider>,
  )
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders children', () => {
    renderWithProvider()
    expect(screen.getByText('Add info')).toBeInTheDocument()
  })

  it('shows toast when addToast is called', () => {
    renderWithProvider()
    act(() => { screen.getByText('Add info').click() })
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('auto-dismisses toast after 4 seconds', () => {
    renderWithProvider()
    act(() => { screen.getByText('Add info').click() })
    expect(screen.getByText('Test message')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(4000) })
    expect(screen.queryByText('Test message')).not.toBeInTheDocument()
  })

  it('renders toast with success icon', () => {
    renderWithProvider()
    act(() => { screen.getByText('Add success').click() })
    const toast = screen.getByText('Success!').closest('[role="alert"]')
    expect(toast).toBeInTheDocument()
    expect(toast?.className).toContain('gf-toast--success')
  })

  it('renders toast with error icon', () => {
    renderWithProvider()
    act(() => { screen.getByText('Add error').click() })
    const toast = screen.getByText('Error!').closest('[role="alert"]')
    expect(toast).toBeInTheDocument()
    expect(toast?.className).toContain('gf-toast--error')
  })

  it('multiple toasts are rendered', () => {
    renderWithProvider()
    act(() => { screen.getByText('Add info').click() })
    act(() => { screen.getByText('Add success').click() })
    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })
})
