import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppHeader } from './AppHeader'

const segments = [
  { value: 'all', label: 'All' },
  { value: 'a', label: 'A' },
]

describe('AppHeader', () => {
  it('renders badge', () => {
    render(<AppHeader badge="3 items" />)
    expect(screen.getByText('3 items')).toBeInTheDocument()
  })

  it('renders segmented control when segments provided', () => {
    render(<AppHeader segments={segments} segmentValue="all" />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders nothing when no props given', () => {
    const { container } = render(<AppHeader />)
    expect(container.querySelector('.gf-app-header')).toBeEmptyDOMElement()
  })
})
