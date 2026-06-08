import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerProvider } from '../../framework/PlayerContext'
import { TopbarProvider } from '../../framework/TopbarContext'
import SomafmApp from './SomafmApp'

function renderWithPlayer() {
  return render(
    <TopbarProvider>
      <PlayerProvider>
        <SomafmApp />
      </PlayerProvider>
    </TopbarProvider>,
  )
}

describe('SomafmApp', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows channel count in header badge', () => {
    renderWithPlayer()
    expect(screen.getByText('46 channels')).toBeInTheDocument()
  })

  it('renders channel cards', () => {
    renderWithPlayer()
    expect(screen.getByText('Groove Salad')).toBeInTheDocument()
    expect(screen.getByText('Drone Zone')).toBeInTheDocument()
  })

  it('shows listener counts on channel cards', () => {
    renderWithPlayer()
    expect(screen.getByText('2.1k')).toBeInTheDocument()
  })

  it('shows genre filter as segmented control', () => {
    renderWithPlayer()
    expect(screen.getByText('All')).toBeInTheDocument()
  })

  it('filters channels by genre', () => {
    renderWithPlayer()
    fireEvent.click(screen.getByText('Ambient'))
    expect(screen.getByText('Drone Zone')).toBeInTheDocument()
    expect(screen.queryByText('Beat Blender')).not.toBeInTheDocument()
  })

  it('shows genre badge on channel cards', () => {
    renderWithPlayer()
    expect(screen.getAllByText('ambient').length).toBeGreaterThan(0)
  })

  it('toggles favorite status', () => {
    renderWithPlayer()
    const favButtons = screen.getAllByLabelText('Add to favorites')
    fireEvent.click(favButtons[0])
    expect(screen.getAllByLabelText('Remove from favorites').length).toBe(1)
    fireEvent.click(screen.getAllByLabelText('Remove from favorites')[0])
    expect(screen.getAllByLabelText('Add to favorites').length).toBeGreaterThan(0)
  })
})
