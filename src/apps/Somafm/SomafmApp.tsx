import { useCallback, useEffect, useRef } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { AppHeader } from '../../framework/components/AppHeader'
import { PlayerBar } from '../../framework/components/PlayerBar'
import { GfEmptyState } from '../../framework/components/EmptyState'
import { ChannelList } from './components/ChannelList'
import { useChannels, useChannelFiltering, useFavorites, useSomaFMPlayer } from './hooks'
import './SomafmApp.css'

export default function SomafmApp() {
  const { channels, genres, loading, loadError } = useChannels()
  const { genreFilter, setGenreFilter, filteredChannels, genreSegments } = useChannelFiltering(channels, genres)
  const [favorites, setFavorites] = useFavorites()
  const { player, playError, setPlayError, handlePlay, stopPlayback, togglePlayPause } = useSomaFMPlayer()

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }, [setFavorites])

  const errorMessage = loadError || playError

  const selectedRef = useRef(0)
  const gridRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' && e.target instanceof HTMLElement && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      togglePlayPause()
      return
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const len = filteredChannels.length
      if (len === 0) return
      const delta = e.key === 'ArrowUp' ? -1 : 1
      selectedRef.current = (selectedRef.current + delta + len) % len
      const channel = filteredChannels[selectedRef.current]
      const cards = gridRef.current?.querySelectorAll('.gf-media-card')
      if (cards && cards[selectedRef.current]) {
        (cards[selectedRef.current] as HTMLElement).focus()
      }
      if (e.key === 'Enter' && channel) {
        handlePlay(channel)
      }
    }

    if (e.key === 'Enter') {
      const channel = filteredChannels[selectedRef.current]
      if (channel) handlePlay(channel)
    }
  }, [filteredChannels, togglePlayPause, handlePlay])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const clearError = useCallback(() => setPlayError(null), [setPlayError])

  return (
    <div className="gf-somafm">
      <AppHeader
        badge={`${channels.length} channels`}
        segments={genreSegments}
        segmentValue={genreFilter}
        onSegmentChange={setGenreFilter}
      />

      {errorMessage && (
        <div className="gf-somafm__error-bar">
          <p className="gf-somafm__error">{errorMessage}</p>
          {playError && (
            <button className="gf-somafm__retry-btn" onClick={clearError}>
              Dismiss
            </button>
          )}
        </div>
      )}

      <div ref={gridRef}>
        {loading ? (
          <div className="gf-somafm__grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="gf-somafm__skeleton" />
            ))}
          </div>
        ) : filteredChannels.length === 0 ? (
          <GfEmptyState
            icon={<GfIcon name="music-note" size={24} />}
            title="No channels found"
            description="Try adjusting your search or filter"
          />
        ) : (
          <ChannelList
            channels={filteredChannels}
            playingId={player.playingId}
            isLoading={player.isLoading}
            favorites={favorites}
            onPlay={handlePlay}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </div>

      {player.type === 'soma' && (
        <PlayerBar
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
        />
      )}
    </div>
  )
}
