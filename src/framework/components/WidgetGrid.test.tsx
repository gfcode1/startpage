import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { WidgetGrid } from './WidgetGrid'

function renderWidgetGrid() {
  return render(
    <MemoryRouter>
      <WidgetGrid />
    </MemoryRouter>,
  )
}

describe('WidgetGrid', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders section with widgets label', () => {
    renderWidgetGrid()
    expect(screen.getByLabelText('Widgets')).toBeInTheDocument()
  })

  it('renders search system widget with hide button', () => {
    renderWidgetGrid()
    expect(screen.getByTitle('Hide widget')).toBeInTheDocument()
  })

  it('shows add widget button', () => {
    renderWidgetGrid()
    expect(screen.getByLabelText('Add widget')).toBeInTheDocument()
  })

  it('renders drag handles for sortable widgets', () => {
    renderWidgetGrid()
    expect(screen.getByLabelText('Drag Clock')).toBeInTheDocument()
    expect(screen.getByLabelText('Drag Quick Note')).toBeInTheDocument()
  })
})
