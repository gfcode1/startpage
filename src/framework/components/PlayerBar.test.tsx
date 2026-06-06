import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerBar } from './PlayerBar'

describe('PlayerBar', () => {
  it('shows offline state when not playing', () => {
    render(<PlayerBar />)
    expect(screen.getByText('OFFLINE')).toBeInTheDocument()
  })

  it('shows ON AIR when playing', () => {
    render(<PlayerBar isPlaying />)
    expect(screen.getByText('ON AIR')).toBeInTheDocument()
  })

  it('shows CONNECTING when loading', () => {
    render(<PlayerBar isLoading isPlaying />)
    expect(screen.getByText('CONNECTING...')).toBeInTheDocument()
  })

  it('displays the title', () => {
    render(<PlayerBar title="Test Stream" />)
    expect(screen.getByText('Test Stream')).toBeInTheDocument()
  })

  it('displays subtitle when provided', () => {
    render(<PlayerBar title="Test" subtitle="Artist Name" />)
    expect(screen.getByText('Artist Name')).toBeInTheDocument()
  })

  it('shows No stream when no title', () => {
    render(<PlayerBar />)
    expect(screen.getByText('No stream')).toBeInTheDocument()
  })

  it('calls onPlayPause when play button clicked', () => {
    const onPlayPause = vi.fn()
    render(<PlayerBar onPlayPause={onPlayPause} />)
    fireEvent.click(screen.getByLabelText('Play'))
    expect(onPlayPause).toHaveBeenCalledOnce()
  })

  it('calls onStop when stop button clicked', () => {
    const onStop = vi.fn()
    render(<PlayerBar isPlaying onStop={onStop} />)
    fireEvent.click(screen.getByLabelText('Stop'))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('renders volume slider', () => {
    render(<PlayerBar volume={0.5} />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('calls onVolumeChange when slider changes', () => {
    const onVolumeChange = vi.fn()
    render(<PlayerBar volume={0.5} onVolumeChange={onVolumeChange} />)
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '0.75' } })
    expect(onVolumeChange).toHaveBeenCalledWith(0.75)
  })
})
