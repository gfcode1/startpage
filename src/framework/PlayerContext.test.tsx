import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerProvider, usePlayer } from './PlayerContext'

function TestHarness() {
  const {
    playingId, isPlaying, isLoading, volume,
    play, stop, setVolume, setPlayInfo,
  } = usePlayer()
  return (
    <div>
      <p data-testid="playing-id">{playingId || 'none'}</p>
      <p data-testid="is-playing">{String(isPlaying)}</p>
      <p data-testid="is-loading">{String(isLoading)}</p>
      <p data-testid="volume">{volume}</p>
      <button data-testid="btn-play" onClick={() => play({ id: 'test-1', title: 'Test', type: 'soma' })}>Play</button>
      <button data-testid="btn-stop" onClick={stop}>Stop</button>
      <button data-testid="btn-vol-up" onClick={() => setVolume(1)}>Vol max</button>
      <button data-testid="btn-info" onClick={() => setPlayInfo('Test Title', 'Test Sub')}>Set info</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <PlayerProvider>
      <TestHarness />
    </PlayerProvider>,
  )
}

describe('PlayerProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders children', () => {
    renderWithProvider()
    expect(screen.getByTestId('playing-id')).toBeInTheDocument()
  })

  it('has no track playing by default', () => {
    renderWithProvider()
    expect(screen.getByTestId('playing-id').textContent).toBe('none')
    expect(screen.getByTestId('is-playing').textContent).toBe('false')
    expect(screen.getByTestId('is-loading').textContent).toBe('false')
  })

  it('has default volume of 0.75', () => {
    renderWithProvider()
    expect(screen.getByTestId('volume').textContent).toBe('0.75')
  })

  it('play sets playing id', () => {
    renderWithProvider()
    fireEvent.click(screen.getByTestId('btn-play'))
    expect(screen.getByTestId('playing-id').textContent).toBe('test-1')
    expect(screen.getByTestId('is-playing').textContent).toBe('true')
  })

  it('stop clears playing state', () => {
    renderWithProvider()
    fireEvent.click(screen.getByTestId('btn-play'))
    fireEvent.click(screen.getByTestId('btn-stop'))
    expect(screen.getByTestId('playing-id').textContent).toBe('none')
    expect(screen.getByTestId('is-playing').textContent).toBe('false')
  })

  it('setVolume updates volume', () => {
    renderWithProvider()
    fireEvent.click(screen.getByTestId('btn-vol-up'))
    expect(screen.getByTestId('volume').textContent).toBe('1')
  })

  it('setPlayInfo updates title and subtitle', () => {
    renderWithProvider()
    fireEvent.click(screen.getByTestId('btn-info'))
  })

  it('persists volume to localStorage', () => {
    renderWithProvider()
    fireEvent.click(screen.getByTestId('btn-vol-up'))
    const stored = localStorage.getItem('gf:_framework:player')
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!).volume).toBe(1)
  })
})
