import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import channelData from './data/channels.json'
import { MediaCard } from '../../framework/components/MediaCard'
import { AppHeader } from '../../framework/components/AppHeader'
import { PlayerBar } from '../../framework/components/PlayerBar'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { usePlayer } from '../../framework/PlayerContext'
import { GfBadge } from '../../framework/components/Badge'
import type { Channel } from './types'
import './SomafmApp.css'

const APP_ID = 'somafm'

function getGenres(channels: Channel[]): string[] {
  const seen = new Set<string>()
  const all = channels.flatMap((c: Channel) => c.genre.split('|'))
  all.forEach((g: string) => seen.add(g))
  return ['all', ...Array.from(seen).sort()]
}

const ICE_SERVERS = ['ice2', 'ice3', 'ice4', 'ice5', 'ice6']

function parseStreamUrl(playlistUrl: string) {
  if (!playlistUrl) return null
  const match = playlistUrl.match(/\/api\.somafm\.com\/(.+)\.pls/)
  if (!match) return null
  const slug = match[1]
  const bitMatch = slug.match(/^(.*?)(\d+)$/)
  const channel = bitMatch ? bitMatch[1] : slug
  const bitrate = bitMatch ? bitMatch[2] : '128'
  const server = ICE_SERVERS[Math.floor(Math.random() * ICE_SERVERS.length)]
  return `https://${server}.somafm.com/${channel}-${bitrate}-mp3`
}

export default function SomafmApp() {
  const player = usePlayer()
  const channels = useMemo(() => [...channelData].sort((a, b) => Number(b.listeners) - Number(a.listeners)), [])
  const genres = useMemo(() => getGenres(channels), [channels])
  const [genreFilter, setGenreFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useAppStorage<string[]>(APP_ID, 'favorites', [])
  const [playError, setPlayError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playerTypeRef = useRef(player.type)

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchGenre = genreFilter === 'all' || c.genre.split('|').includes(genreFilter)
      const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
      return matchGenre && matchSearch
    })
  }, [channels, genreFilter, search])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }, [setFavorites])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    player.stop()
    setPlayError(null)
  }, [player])

  const handlePlay = useCallback((channel: Channel) => {
    if (player.playingId === channel.id && player.isPlaying) {
      stopPlayback()
      return
    }

    const streamUrl = parseStreamUrl(channel.playlists?.[0]?.url)
    if (!streamUrl || !audioRef.current) return

    setPlayError(null)
    player.play({ id: channel.id, title: channel.title, subtitle: channel.lastPlaying, type: 'soma' })

    audioRef.current.src = streamUrl
    audioRef.current.volume = player.volume

    audioRef.current.play()
      .then(() => {
        player.setPlaying(true)
        player.setLoading(false)
      })
      .catch(() => {
        player.stop()
        setPlayError('Unable to play stream. Try again.')
      })
  }, [player, stopPlayback])

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
      if (playerTypeRef.current === 'soma') {
        player.stop()
      }
    }
  }, [])

  useEffect(() => {
    playerTypeRef.current = player.type
  }, [player.type])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = player.volume
    }
  }, [player.volume])

  const genreSegments = genres.map((g: string) => ({
    value: g,
    label: g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1),
  }))

  return (
    <div className="gf-somafm">
      <AppHeader
        title="SomaFM"
        badge={`${channels.length} channels`}
        segments={genreSegments}
        segmentValue={genreFilter}
        onSegmentChange={setGenreFilter}
        searchPlaceholder="Search channel..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {playError && (
        <p className="gf-somafm__error">{playError}</p>
      )}

      <div className="gf-somafm__grid">
        {filteredChannels.map((channel, i) => (
          <MediaCard
            key={channel.id}
            id={channel.id}
            index={i}
            image={channel.image}
            title={channel.title}
            description={channel.description}
            metadata={
              <>
                <GfBadge variant="listeners">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginRight: 3 }}>
                    <path d="M1 9V7l4-4 4 4v2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <circle cx="5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                  </svg>
                  {Number(channel.listeners) >= 1000
                    ? `${(Number(channel.listeners) / 1000).toFixed(1)}k`
                    : channel.listeners}
                </GfBadge>
                <span className="gf-somafm__genre">{channel.genre.split('|')[0]}</span>
              </>
            }
            nowPlaying={channel.lastPlaying}
            isPlaying={player.playingId === channel.id}
            isLoading={player.isLoading && player.playingId === channel.id}
            isFavorite={favorites.includes(channel.id)}
            onPlay={() => handlePlay(channel)}
            onFavorite={toggleFavorite}
          />
        ))}
        {filteredChannels.length === 0 && (
          <p className="gf-somafm__empty">No channels found</p>
        )}
      </div>

      {player.type === 'soma' && <PlayerBar
        isPlaying={player.isPlaying}
        isLoading={player.isLoading}
        title={player.playingTitle}
        subtitle={player.subtitle}
        volume={player.volume}
        onVolumeChange={player.setVolume}
        onStop={stopPlayback}
      />}
    </div>
  )
}
