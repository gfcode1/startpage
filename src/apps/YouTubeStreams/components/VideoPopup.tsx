import { useCallback, useState } from 'react'
import { FloatingWindow } from '../../../framework/components/FloatingWindow'
import { PlayerBar } from '../../../framework/components/PlayerBar'
import { VideoPlayer } from './VideoPlayer'
import { useAppStorage } from '../../../framework/persistence/useAppStorage'
import { usePlayer } from '../../../framework/PlayerContext'
import type { Stream } from '../types'
import type { WindowState } from '../../../framework/components/FloatingWindow'

interface VideoPopupProps {
  stream: Stream | undefined
  onError: () => void
}

interface Position { x: number; y: number }
interface Size { width: number; height: number }

const APP_ID = 'youtubestreams'

export function VideoPopup({ stream, onError }: VideoPopupProps) {
  const player = usePlayer()
  const [savedPos, setSavedPos] = useAppStorage<Position | null>(APP_ID, 'windowPos', null)
  const [savedSize, setSavedSize] = useAppStorage<Size | null>(APP_ID, 'windowSize', null)
  const [windowState, setWindowState] = useState<WindowState>('normal')

  const handlePositionChange = useCallback((pos: Position) => {
    setSavedPos(pos)
  }, [setSavedPos])

  const handleSizeChange = useCallback((size: Size) => {
    setSavedSize(size)
  }, [setSavedSize])

  const stopPlayback = useCallback(() => {
    player.stop()
  }, [player])

  const handleClose = useCallback(() => {
    player.stop()
  }, [player])

  const handleExpand = useCallback(() => {
    setWindowState('normal')
  }, [])

  if (!player.playingId || player.type !== 'youtube') return null

  const isMinimized = windowState === 'minimized'
  const playerBarProps = {
    isPlaying: player.isPlaying,
    isLoading: player.isLoading,
    title: player.playingTitle,
    subtitle: player.subtitle,
    volume: player.volume,
    queue: player.queue,
    sleepTimer: player.sleepTimer,
    onVolumeChange: player.setVolume,
    onStop: stopPlayback,
    onPlayPause: () => player.setPlaying(!player.isPlaying),
    onRemoveFromQueue: player.removeFromQueue,
    onSetSleepTimer: player.setSleepTimer,
  }

  return (
    <>
      <div style={isMinimized ? { display: 'none' } : undefined}>
        <FloatingWindow
          key={player.playingId}
          open
          state={windowState}
          onClose={handleClose}
          title={player.playingTitle || 'YouTube Stream'}
          initialPosition={savedPos ?? undefined}
          initialSize={savedSize ?? undefined}
          onPositionChange={handlePositionChange}
          onSizeChange={handleSizeChange}
          onStateChange={setWindowState}
        >
          <div className="gf-yt-popup__player">
            <VideoPlayer
              key={stream?.youtubeId}
              youtubeId={stream?.youtubeId}
              volume={player.volume}
              isPlaying={player.isPlaying}
              onError={onError}
            />
          </div>
          <PlayerBar {...playerBarProps} />
        </FloatingWindow>
      </div>
      {isMinimized && <PlayerBar {...playerBarProps} onExpand={handleExpand} />}
    </>
  )
}
