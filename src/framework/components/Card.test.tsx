import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GfCard, GfCardTitle, GfCardDescription, GfCardBody } from './Card'

describe('GfCard', () => {
  it('renders children', () => {
    render(<GfCard>Hello</GfCard>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('calls onClick when clickable', () => {
    const onClick = vi.fn()
    render(<GfCard onClick={onClick}>Click</GfCard>)
    screen.getByText('Click').click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has button role when clickable', () => {
    render(<GfCard onClick={() => {}}>Click</GfCard>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('does not have button role when not clickable', () => {
    render(<GfCard>Static</GfCard>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('GfCard subcomponents', () => {
  it('GfCardTitle renders with custom tag', () => {
    render(<GfCardTitle as="h1">Title</GfCardTitle>)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('GfCardDescription renders text', () => {
    render(<GfCardDescription>Desc</GfCardDescription>)
    expect(screen.getByText('Desc')).toBeInTheDocument()
  })

  it('GfCardBody renders children', () => {
    render(<GfCardBody><span>body</span></GfCardBody>)
    expect(screen.getByText('body')).toBeInTheDocument()
  })
})
