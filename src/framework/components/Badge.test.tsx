import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GfBadge } from './Badge'

describe('GfBadge', () => {
  it('renders children', () => {
    render(<GfBadge>Test Badge</GfBadge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies default variant class', () => {
    render(<GfBadge>Default</GfBadge>)
    const badge = screen.getByText('Default')
    expect(badge.className).toContain('gf-badge--default')
  })

  it('applies custom variant class', () => {
    render(<GfBadge variant="accent">Accent</GfBadge>)
    const badge = screen.getByText('Accent')
    expect(badge.className).toContain('gf-badge--accent')
  })

  it('applies additional className', () => {
    render(<GfBadge className="custom">Custom</GfBadge>)
    const badge = screen.getByText('Custom')
    expect(badge.className).toContain('custom')
  })
})
