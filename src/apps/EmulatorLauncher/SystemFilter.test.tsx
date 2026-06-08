import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SystemFilter } from './SystemFilter'

describe('SystemFilter', () => {
  it('renders All button', () => {
    render(<SystemFilter selected={null} onChange={vi.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
  })

  it('renders all system buttons', () => {
    render(<SystemFilter selected={null} onChange={vi.fn()} />)
    expect(screen.getByText('NES')).toBeInTheDocument()
    expect(screen.getByText('SNES')).toBeInTheDocument()
    expect(screen.getByText('Game Boy')).toBeInTheDocument()
    expect(screen.getByText('GBA')).toBeInTheDocument()
    expect(screen.getByText('N64')).toBeInTheDocument()
  })

  it('marks All as active when selected is null', () => {
    render(<SystemFilter selected={null} onChange={vi.fn()} />)
    expect(screen.getByText('All').className).toContain('gf-emu__filter-btn--active')
  })

  it('marks specific system as active when selected', () => {
    render(<SystemFilter selected="nes" onChange={vi.fn()} />)
    const btn = screen.getByText('NES')
    expect(btn.className).toContain('gf-emu__filter-btn--active')
  })

  it('calls onChange with system when system button clicked', () => {
    const onChange = vi.fn()
    render(<SystemFilter selected={null} onChange={onChange} />)
    screen.getByText('NES').click()
    expect(onChange).toHaveBeenCalledWith('nes')
  })

  it('calls onChange with null when All clicked', () => {
    const onChange = vi.fn()
    render(<SystemFilter selected="nes" onChange={onChange} />)
    screen.getByText('All').click()
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
