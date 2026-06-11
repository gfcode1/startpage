import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { WidgetOptionsProvider, useWidgetOptions } from './WidgetOptionsContext'

function TestHarness() {
  const { options, setOption } = useWidgetOptions('search')
  return (
    <div>
      <p data-testid="engine">{String(options.searchEngine)}</p>
      <p data-testid="newtab">{String(options.openInNewTab)}</p>
      <button data-testid="btn-change" onClick={() => setOption('searchEngine', 'brave')}>
        Change
      </button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <WidgetOptionsProvider>
      <TestHarness />
    </WidgetOptionsProvider>,
  )
}

describe('WidgetOptionsContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides default options from widget definition', () => {
    renderWithProvider()
    expect(screen.getByTestId('engine').textContent).toBe('google')
    expect(screen.getByTestId('newtab').textContent).toBe('true')
  })

  it('setOption updates value', async () => {
    renderWithProvider()
    screen.getByTestId('btn-change').click()
    await waitFor(() => {
      expect(screen.getByTestId('engine').textContent).toBe('brave')
    })
  })

  it('useWidgetOptions throws outside provider', () => {
    expect(() => render(<TestHarness />)).toThrow('useWidgetOptions must be used within WidgetOptionsProvider')
  })
})
