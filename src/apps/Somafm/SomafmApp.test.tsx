import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlayerProvider } from '../../framework/PlayerContext'
import { TopbarProvider } from '../../framework/TopbarContext'
import SomafmApp from './SomafmApp'
import { parseStreamUrl, parseBitrate } from './streamUrl'

globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

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

  it('shows channel count in header badge', async () => {
    renderWithPlayer()
    await waitFor(() => {
      expect(screen.getByText('46 channels')).toBeInTheDocument()
    })
  })

  it('renders channel cards', async () => {
    renderWithPlayer()
    await waitFor(() => {
      expect(screen.getByText('Groove Salad')).toBeInTheDocument()
    })
    expect(screen.getByText('Drone Zone')).toBeInTheDocument()
  })

  it('shows listener counts on channel cards', async () => {
    renderWithPlayer()
    await waitFor(() => {
      expect(screen.getByText('2.1k')).toBeInTheDocument()
    })
  })

  it('shows genre filter as segmented control', () => {
    renderWithPlayer()
    expect(screen.getByText('All')).toBeInTheDocument()
  })

  it('filters channels by genre', async () => {
    renderWithPlayer()
    await waitFor(() => {
      expect(screen.getByText('Groove Salad')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Ambient'))
    expect(screen.getByText('Drone Zone')).toBeInTheDocument()
    expect(screen.queryByText('Beat Blender')).not.toBeInTheDocument()
  })

  it('shows genre badge on channel cards', async () => {
    renderWithPlayer()
    await waitFor(() => {
      expect(screen.getAllByText('ambient').length).toBeGreaterThan(0)
    })
  })

  it('toggles favorite status', async () => {
    renderWithPlayer()
    await waitFor(() => {
      expect(screen.getAllByLabelText('Add to favorites').length).toBeGreaterThan(0)
    })
    const favButtons = screen.getAllByLabelText('Add to favorites')
    fireEvent.click(favButtons[0])
    expect(screen.getAllByLabelText('Remove from favorites').length).toBe(1)
    fireEvent.click(screen.getAllByLabelText('Remove from favorites')[0])
    expect(screen.getAllByLabelText('Add to favorites').length).toBeGreaterThan(0)
  })

  it('shows skeleton loading on mount', () => {
    renderWithPlayer()
    const skeletons = document.querySelectorAll('.gf-somafm__skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('hides skeleton after data loads', async () => {
    renderWithPlayer()
    await waitFor(() => {
      expect(screen.getByText('Groove Salad')).toBeInTheDocument()
    })
    const skeletons = document.querySelectorAll('.gf-somafm__skeleton')
    expect(skeletons.length).toBe(0)
  })
})

describe('parseStreamUrl', () => {
  it('returns null for undefined input', () => {
    expect(parseStreamUrl(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseStreamUrl('')).toBeNull()
  })

  it('parses a URL without explicit bitrate', () => {
    const url = parseStreamUrl('https://api.somafm.com/groovesalad.pls')
    expect(url).toMatch(/^https:\/\/ice[2-6]\.somafm\.com\/groovesalad-128-mp3$/)
  })

  it('parses a URL with explicit bitrate in slug', () => {
    const url = parseStreamUrl('https://api.somafm.com/groovesalad256.pls')
    expect(url).toMatch(/^https:\/\/ice[2-6]\.somafm\.com\/groovesalad-256-mp3$/)
  })

  it('parses a URL with 320k bitrate', () => {
    const url = parseStreamUrl('https://api.somafm.com/spacestation320.pls')
    expect(url).toMatch(/^https:\/\/ice[2-6]\.somafm\.com\/spacestation-320-mp3$/)
  })

  it('assigns random ice servers', () => {
    const servers = new Set<string>()
    for (let i = 0; i < 50; i++) {
      const url = parseStreamUrl('https://api.somafm.com/groovesalad.pls')
      const match = url?.match(/\/\/(ice[2-6])\./)
      if (match) servers.add(match[1])
    }
    expect(servers.size).toBeGreaterThan(1)
  })
})

describe('parseBitrate', () => {
  it('extracts channel and bitrate from slug with bitrate', () => {
    const { channel, bitrate } = parseBitrate('groovesalad256')
    expect(channel).toBe('groovesalad')
    expect(bitrate).toBe('256')
  })

  it('defaults to 128 when no bitrate', () => {
    const { channel, bitrate } = parseBitrate('groovesalad')
    expect(channel).toBe('groovesalad')
    expect(bitrate).toBe('128')
  })

  it('handles 320 bitrate', () => {
    const { channel, bitrate } = parseBitrate('spacestation320')
    expect(channel).toBe('spacestation')
    expect(bitrate).toBe('320')
  })
})
