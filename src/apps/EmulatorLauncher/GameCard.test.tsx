import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameCard } from './GameCard'
import type { ScannedGame } from './constants'

const nesGame: ScannedGame = {
  id: 'test:nes:super-mario.nes',
  title: 'Super Mario',
  system: 'nes',
  fileName: 'super-mario.nes',
}

describe('GameCard', () => {
  it('renders game title', () => {
    render(<GameCard game={nesGame} index={0} onClick={vi.fn()} />)
    expect(screen.getByText('Super Mario')).toBeInTheDocument()
  })

  it('renders system badge for known system', () => {
    render(<GameCard game={nesGame} index={0} onClick={vi.fn()} />)
    expect(screen.getByText('NES')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<GameCard game={nesGame} index={0} onClick={onClick} />)
    screen.getByText('Super Mario').click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('calls onClick on Enter key', () => {
    const onClick = vi.fn()
    render(<GameCard game={nesGame} index={0} onClick={onClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('calls onClick on Space key', () => {
    const onClick = vi.fn()
    render(<GameCard game={nesGame} index={0} onClick={onClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows delete button when onDelete is provided', () => {
    const onDelete = vi.fn()
    render(<GameCard game={nesGame} index={0} onClick={vi.fn()} onDelete={onDelete} />)
    const deleteBtn = screen.getByLabelText('Delete Super Mario')
    expect(deleteBtn).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<GameCard game={nesGame} index={0} onClick={vi.fn()} onDelete={onDelete} />)
    screen.getByLabelText('Delete Super Mario').click()
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('does not propagate click to parent when delete is clicked', () => {
    const onClick = vi.fn()
    const onDelete = vi.fn()
    render(<GameCard game={nesGame} index={0} onClick={onClick} onDelete={onDelete} />)
    screen.getByLabelText('Delete Super Mario').click()
    expect(onClick).not.toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('has accessible label', () => {
    render(<GameCard game={nesGame} index={0} onClick={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Play Super Mario')
  })
})
