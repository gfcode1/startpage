import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkeletonGrid } from './Skeleton'

describe('SkeletonGrid', () => {
  it('renders default 6 items', () => {
    render(<SkeletonGrid />)
    const cards = document.querySelectorAll('.gf-skeleton-card')
    expect(cards.length).toBe(6)
  })

  it('renders custom count', () => {
    render(<SkeletonGrid count={3} />)
    const cards = document.querySelectorAll('.gf-skeleton-card')
    expect(cards.length).toBe(3)
  })

  it('renders with grid wrapper', () => {
    const { container } = render(<SkeletonGrid />)
    expect(container.querySelector('.gf-skeleton-grid')).toBeInTheDocument()
  })

  it('renders skeleton boxes and lines inside each card', () => {
    render(<SkeletonGrid count={1} />)
    const card = document.querySelector('.gf-skeleton-card')
    expect(card?.querySelector('.gf-skeleton-box')).toBeInTheDocument()
    expect(card?.querySelector('.gf-skeleton-line')).toBeInTheDocument()
  })
})
