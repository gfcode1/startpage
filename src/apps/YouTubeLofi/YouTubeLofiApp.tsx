import { useState, useMemo, useCallback, useEffect } from 'react'
import streamData from './data/streams.json'
import { MediaCard } from '../../framework/components/MediaCard'
import { AppHeader } from '../../framework/components/AppHeader'
import { PlayerBar } from '../../framework/components/PlayerBar'
import { VideoPlayer } from './components/VideoPlayer'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { usePlayer } from '../../framework/PlayerContext'
import type { Stream } from './types'
import './YouTubeLofiApp.css'

const APP_ID = 'youtubelofi'

const SOURCE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'lofigirl', label: 'Lofi Girl' },
  { value: 'chillhop', label: 'Chillhop' },
]

const SOURCE_META: Record<string, { label: string; color: string }> = {
  lofigirl: { label: 'Lofi Girl', color: '#7c3aed' },
  chillhop: { label: 'Chillhop', color: '#2d8a4e' },
}

export default function YouTubeLofiApp() {
  const player = usePlayer()
  const streams = useMemo(() => streamData as Stream[], [])
  const [sourceFilter, setSourceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useAppStorage<string[]>(APP_ID, 'favorites', [])
  const [playError, setPlayError] = useState<string | null>(null)

  const filteredStreams = useMemo(() => {
    return streams.filter(s => {
      const matchSource = sourceFilter === 'all' || s.source === sourceFilter
      const matchSearch = !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      return matchSource && matchSearch
    })
  }, [streams, sourceFilter, search])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }, [setFavorites])

  const stopPlayback = useCallback(() => {
    player.stop()
    setPlayError(null)
  }, [player])

  const handlePlay = useCallback((stream: Stream) => {
    if (player.playingId === stream.id && player.isPlaying) {
      stopPlayback()
      return
    }

    setPlayError(null)
    player.setLoading(true)
    player.play({ id: stream.id, title: stream.title, subtitle: '', type: 'youtube' })
  }, [player, stopPlayback])

  const handlePlayerError = useCallback(() => {
    setPlayError('Unable to play this stream. Try again.')
    player.stop()
  }, [player])

  const currentStream = streams.find(s => s.id === player.playingId)

  useEffect(() => {
    return () => player.stop()
  }, [])

  return (
    <div className="gf-youtubelofi">
      <AppHeader
        title="YouTube LoFi"
        badge={`${streams.length} streams`}
        gradient="linear-gradient(135deg, #7c3aed, #2d8a4e)"
        segments={SOURCE_FILTERS}
        segmentValue={sourceFilter}
        onSegmentChange={setSourceFilter}
        searchPlaceholder="Search stream..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {playError && (
        <p className="gf-youtubelofi__error">{playError}</p>
      )}

      <div className="gf-youtubelofi__grid">
        {filteredStreams.map((stream, i) => (
          <MediaCard
            key={stream.id}
            id={stream.id}
            index={i}
            image={stream.thumbnail}
            title={stream.title}
            description={stream.description}
            metadata={
              <span className="gf-youtubelofi__genre">{stream.genre}</span>
            }
            isPlaying={player.playingId === stream.id}
            isFavorite={favorites.includes(stream.id)}
            accentColor={stream.color}
            onPlay={() => handlePlay(stream)}
            onFavorite={toggleFavorite}
            renderBeforeTitle={() => {
              const meta = SOURCE_META[stream.source]
              return meta ? (
                <span className="gf-youtubelofi__source-tag" style={{ background: meta.color }}>
                  {meta.label}
                </span>
              ) : null
            }}
          />
        ))}
        {filteredStreams.length === 0 && (
          <p className="gf-youtubelofi__empty">No streams found</p>
        )}
      </div>

      {player.playingId && player.type === 'youtube' && (
        <>
          <div className="gf-youtubelofi__player-video">
            <VideoPlayer
              youtubeId={currentStream?.youtubeId}
              volume={player.volume}
              isPlaying={player.isPlaying}
              onError={handlePlayerError}
            />
          </div>
          <PlayerBar
            isPlaying={player.isPlaying}
            title={player.playingTitle}
            volume={player.volume}
            onVolumeChange={player.setVolume}
            onStop={stopPlayback}
            onPlayPause={() => player.setPlaying(!player.isPlaying)}
          />
        </>
      )}
    </div>
  )
}
