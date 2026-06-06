import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GfButton } from './Button'

describe('GfButton', () => {
  it('renders children', () => {
    render(<GfButton>Click me</GfButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<GfButton>Default</GfButton>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('gf-btn')
    expect(btn.className).toContain('gf-btn--primary')
    expect(btn.className).toContain('gf-btn--md')
  })

  it('applies variant class', () => {
    render(<GfButton variant="secondary">Secondary</GfButton>)
    expect(screen.getByRole('button').className).toContain('gf-btn--secondary')
  })

  it('applies ghost variant', () => {
    render(<GfButton variant="ghost">Ghost</GfButton>)
    expect(screen.getByRole('button').className).toContain('gf-btn--ghost')
  })

  it('applies icon variant', () => {
    render(<GfButton variant="icon">Icon</GfButton>)
    expect(screen.getByRole('button').className).toContain('gf-btn--icon')
  })

  it('applies size class', () => {
    render(<GfButton size="lg">Large</GfButton>)
    expect(screen.getByRole('button').className).toContain('gf-btn--lg')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<GfButton onClick={onClick}>Click</GfButton>)
    screen.getByRole('button').click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is set', () => {
    render(<GfButton disabled>Disabled</GfButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<GfButton disabled onClick={onClick}>Disabled</GfButton>)
    screen.getByRole('button').click()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('merges custom className', () => {
    render(<GfButton className="custom-class">Custom</GfButton>)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })

  it('spreads native button props', () => {
    render(<GfButton type="submit" aria-label="Submit form">Submit</GfButton>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('type', 'submit')
    expect(btn).toHaveAttribute('aria-label', 'Submit form')
  })
})
