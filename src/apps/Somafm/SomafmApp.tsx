import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import channelData from './data/channels.json'
import { MediaCard } from '../../framework/components/MediaCard'
import { AppHeader } from '../../framework/components/AppHeader'
import { PlayerBar } from '../../framework/components/PlayerBar'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { usePlayer } from '../../framework/PlayerContext'
import { useTopbar } from '../../framework/TopbarContext'
import { GfBadge } from '../../framework/components/Badge'
import { GfEmptyState } from '../../framework/components/EmptyState'
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
  const channels = useMemo(() => [...channelData].sort((a, b) => b.listeners - a.listeners), [])
  const genres = useMemo(() => getGenres(channels), [channels])
  const [genreFilter, setGenreFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useAppStorage<string[]>(APP_ID, 'favorites', [])
  const [playError, setPlayError] = useState<string | null>(null)
  const { setSearch: setTopbarSearch, clearConfig } = useTopbar()

  useEffect(() => {
    setTopbarSearch({ placeholder: 'Search channel...', value: search, onChange: setSearch })
    return () => { clearConfig() }
  }, [search, setTopbarSearch, clearConfig])
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

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return
    if (player.isPlaying) {
      audioRef.current.pause()
      player.setPlaying(false)
    } else {
      audioRef.current.play()
        .then(() => player.setPlaying(true))
        .catch(() => {})
    }
  }, [player])

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
    audioRef.current.pause()
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

  const handleAudioError = useCallback(() => {
    player.stop()
    setPlayError('Stream lost. Try again.')
  }, [player])

  useEffect(() => {
    const audio = new Audio()
    audio.addEventListener('error', handleAudioError)
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audio.removeEventListener('error', handleAudioError)
      audioRef.current = null
      if (playerTypeRef.current === 'soma') {
        player.stop()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only, stop on unmount
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
        badge={`${channels.length} channels`}
        segments={genreSegments}
        segmentValue={genreFilter}
        onSegmentChange={setGenreFilter}
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
                  <GfIcon name="headphones" size={10} />
                  {channel.listeners >= 1000
                    ? `${(channel.listeners / 1000).toFixed(1)}k`
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
      </div>
      {filteredChannels.length === 0 && (
        <GfEmptyState
          icon={<GfIcon name="music-note" size={24} />}
          title="No channels found"
          description="Try adjusting your search or filter"
        />
      )}

      {player.type === 'soma' && <PlayerBar
        isPlaying={player.isPlaying}
        isLoading={player.isLoading}
        title={player.playingTitle}
        subtitle={player.subtitle}
        volume={player.volume}
        queue={player.queue}
        sleepTimer={player.sleepTimer}
        onVolumeChange={player.setVolume}
        onPlayPause={togglePlayPause}
        onStop={stopPlayback}
        onRemoveFromQueue={player.removeFromQueue}
        onSetSleepTimer={player.setSleepTimer}
      />}
    </div>
  )
}
