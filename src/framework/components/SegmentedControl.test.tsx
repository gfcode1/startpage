import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GfSegmentedControl } from './SegmentedControl'

const segments = [
  { value: 'all', label: 'All' },
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
]

describe('GfSegmentedControl', () => {
  it('renders all segments', () => {
    render(<GfSegmentedControl segments={segments} value="all" />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
  })

  it('marks selected segment as active', () => {
    render(<GfSegmentedControl segments={segments} value="a" />)
    const active = screen.getByText('Option A')
    expect(active.className).toContain('gf-segmented__item--active')
  })

  it('calls onChange when segment clicked', () => {
    const onChange = vi.fn()
    render(<GfSegmentedControl segments={segments} value="all" onChange={onChange} />)
    fireEvent.click(screen.getByText('Option B'))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('sets aria-checked correctly', () => {
    render(<GfSegmentedControl segments={segments} value="a" />)
    expect(screen.getByText('Option A')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('All')).toHaveAttribute('aria-checked', 'false')
  })
})
