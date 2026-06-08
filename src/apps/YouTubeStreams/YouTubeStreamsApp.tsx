import { useState, useCallback, useEffect, useMemo } from 'react'
import streamData from './data/streams.json'
import { MediaCard } from '../../framework/components/MediaCard'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfConfirmDialog } from '../../framework/components/ConfirmDialog'
import { GfEmptyState } from '../../framework/components/EmptyState'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { usePlayer } from '../../framework/PlayerContext'
import { useTopbar } from '../../framework/TopbarContext'
import { AddStreamDialog } from './components/AddStreamDialog'
import { VideoPopup } from './components/VideoPopup'
import type { Stream } from './types'
import './YouTubeStreamsApp.css'

const APP_ID = 'youtubestreams'

export default function YouTubeStreamsApp() {
  const player = usePlayer()
  const defaultStreams = streamData as Stream[]
  const [customStreams, setCustomStreams] = useAppStorage<Stream[]>(APP_ID, 'streams', [])
  const [search, setSearch] = useState('')
  const [playError, setPlayError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [errorStreamId, setErrorStreamId] = useState<string | null>(null)
  const { setActions, setSearch: setTopbarSearch, clearConfig } = useTopbar()

  useEffect(() => {
    setActions([
      { id: 'add-stream', icon: 'plus', label: 'Add Stream', onClick: () => setShowAddDialog(true), variant: 'primary' },
    ])
    setTopbarSearch({ placeholder: 'Search streams...', value: search, onChange: setSearch })
    return () => { clearConfig() }
  }, [search, setActions, setTopbarSearch, clearConfig])

  const allStreams = useMemo(() => [...defaultStreams, ...customStreams], [customStreams, defaultStreams])

  const filteredStreams = allStreams.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.genre.toLowerCase().includes(q)
    )
  })

  const stopPlayback = useCallback(() => {
    player.stop()
    setPlayError(null)
    setErrorStreamId(null)
  }, [player])

  const handlePlay = useCallback((stream: Stream) => {
    if (player.playingId === stream.id && player.isPlaying) {
      stopPlayback()
      return
    }

    setPlayError(null)
    setErrorStreamId(null)
    player.play({
      id: stream.id,
      title: stream.title,
      subtitle: stream.genre,
      type: 'youtube',
    })
  }, [player, stopPlayback])

  const handlePlayerError = useCallback(() => {
    const failedId = player.playingId
    if (!failedId) return

    player.stop()

    const stream = allStreams.find(s => s.id === failedId)
    if (!stream) return

    if (stream.isDefault) {
      setPlayError('This stream is temporarily unavailable. Try again later.')
    } else {
      setErrorStreamId(failedId)
    }
  }, [player, allStreams])

  const confirmRemove = useCallback(() => {
    if (!errorStreamId) return
    setCustomStreams(prev => prev.filter(s => s.id !== errorStreamId))
    setErrorStreamId(null)
  }, [errorStreamId, setCustomStreams])

  const cancelRemove = useCallback(() => {
    setErrorStreamId(null)
  }, [])

  const handleAddStream = useCallback((stream: Stream) => {
    setCustomStreams(prev => [...prev, stream])
  }, [setCustomStreams])

  const handleDeleteCustom = useCallback((id: string) => {
    setRemoveTarget(id)
  }, [])

  const confirmDeleteCustom = useCallback(() => {
    if (!removeTarget) return
    setCustomStreams(prev => prev.filter(s => s.id !== removeTarget))
    if (player.playingId === removeTarget) {
      player.stop()
    }
    setRemoveTarget(null)
  }, [removeTarget, setCustomStreams, player])

  const currentStream = allStreams.find(s => s.id === player.playingId)

  useEffect(() => {
    return () => player.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only
  }, [])

  return (
    <div className="gf-youtubestreams">
      <AppHeader badge={`${allStreams.length} streams`} />

      {playError && (
        <p className="gf-youtubestreams__error">{playError}</p>
      )}

      <div className="gf-youtubestreams__grid">
        {filteredStreams.map((stream, i) => (
          <MediaCard
            key={stream.id}
            id={stream.id}
            index={i}
            image={stream.thumbnail}
            title={stream.title}
            description={stream.description}
            isPlaying={player.playingId === stream.id}
            accentColor={stream.color}
            onClick={() => handlePlay(stream)}
            renderBeforeTitle={() => (
              !stream.isDefault ? (
                <button
                  className="gf-youtubestreams__delete-btn"
                  onClick={(e) => { e.stopPropagation(); handleDeleteCustom(stream.id) }}
                  aria-label="Remove stream"
                >
                  <GfIcon name="trash" size={12} />
                </button>
              ) : null
            )}
          />
        ))}
      </div>

      {filteredStreams.length === 0 && (
        <GfEmptyState
          icon={<GfIcon name="music-note" size={24} />}
          title="No streams found"
          description={search ? 'Try adjusting your search' : 'Add a YouTube stream to get started'}
          action={!search ? { label: 'Add Stream', onClick: () => setShowAddDialog(true) } : undefined}
        />
      )}

      {player.playingId && player.type === 'youtube' && (
        <VideoPopup stream={currentStream} onError={handlePlayerError} />
      )}

      <AddStreamDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddStream}
      />

      <GfConfirmDialog
        open={errorStreamId !== null}
        onClose={cancelRemove}
        onConfirm={confirmRemove}
        title="Stream unavailable"
        message="This stream is no longer available. Would you like to remove it from your list?"
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="danger"
      />

      <GfConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmDeleteCustom}
        title="Remove stream"
        message="Are you sure you want to remove this stream from your list?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  )
}
