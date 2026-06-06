import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppHeader } from './AppHeader'

const segments = [
  { value: 'all', label: 'All' },
  { value: 'a', label: 'A' },
]

describe('AppHeader', () => {
  it('renders title and badge', () => {
    render(<AppHeader title="Test App" badge="3 items" />)
    expect(screen.getByText('Test App')).toBeInTheDocument()
    expect(screen.getByText('3 items')).toBeInTheDocument()
  })

  it('renders segmented control when segments provided', () => {
    render(<AppHeader title="Test" segments={segments} segmentValue="all" />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders search input with placeholder', () => {
    render(<AppHeader title="Test" searchPlaceholder="Find..." searchValue="" />)
    const input = screen.getByPlaceholderText('Find...')
    expect(input).toBeInTheDocument()
  })

  it('calls onSearchChange when typing', () => {
    const onSearch = vi.fn()
    render(<AppHeader title="Test" searchValue="" onSearchChange={onSearch} />)
    const input = screen.getByPlaceholderText('Search...')
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(onSearch).toHaveBeenCalledWith('abc')
  })
})
