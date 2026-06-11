import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WidgetOptionsProvider } from '../WidgetOptionsContext'
import { WidgetOptionsPopup } from './WidgetOptionsPopup'

function renderPopup(open = true) {
  return render(
    <WidgetOptionsProvider>
      <WidgetOptionsPopup
        widgetId="search"
        open={open}
        onClose={() => {}}
      />
    </WidgetOptionsProvider>,
  )
}

describe('WidgetOptionsPopup', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders nothing when closed', () => {
    renderPopup(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders options when open', () => {
    renderPopup(true)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Search Engine')).toBeInTheDocument()
    expect(screen.getByText('Ask Provider (LLM)')).toBeInTheDocument()
    expect(screen.getByText('Open in new tab')).toBeInTheDocument()
  })

  it('has a close button', () => {
    renderPopup(true)
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('renders select options', () => {
    renderPopup(true)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(1)
  })

  it('has aria-modal dialog', () => {
    renderPopup(true)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })
})


