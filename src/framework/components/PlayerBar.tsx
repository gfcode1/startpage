import { useState, useEffect } from 'react'
import { GfIcon } from '../iconSystem'
import { GfSlider } from './Slider'
import { GfBottomSheet } from './BottomSheet'
import type { QueueItem } from '../PlayerContext'
import './PlayerBar.css'

interface PlayerBarProps {
  isPlaying?: boolean
  isLoading?: boolean
  title?: string
  subtitle?: string
  volume?: number
  queue?: QueueItem[]
  sleepTimer?: number | null
  onVolumeChange?: (volume: number) => void
  onStop?: () => void
  onPlayPause?: () => void
  onRemoveFromQueue?: (index: number) => void
  onSetSleepTimer?: (minutes: number | null) => void
  onExpand?: () => void
}

export function PlayerBar({
  isPlaying,
  isLoading,
  title,
  subtitle,
  volume = 0.75,
  queue = [],
  sleepTimer,
  onVolumeChange,
  onStop,
  onPlayPause,
  onRemoveFromQueue,
  onSetSleepTimer,
  onExpand,
}: PlayerBarProps) {
  const [showQueue, setShowQueue] = useState(false)
  const [showSleep, setShowSleep] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!sleepTimer) return
    const id = setInterval(() => setNow(Date.now()), 10000)
    return () => clearInterval(id)
  }, [sleepTimer])

  const sleepRemaining = sleepTimer ? Math.max(0, Math.round((sleepTimer - now) / 60000)) : null

  return (
    <>
      <div className={`gf-playerbar ${isPlaying ? 'gf-playerbar--active' : ''}`}>
        <div className="gf-playerbar__inner">
          <div className="gf-playerbar__left">
            {onExpand && (
              <button
                className="gf-playerbar__expand"
                onClick={onExpand}
                aria-label="Show video"
                title="Show video"
              >
                <GfIcon name="chevron-up" size={14} />
              </button>
            )}
            <div className="gf-playerbar__status">
              <span className={`gf-playerbar__indicator ${isPlaying ? 'gf-playerbar__indicator--live' : ''}`}>
                {isLoading ? (
                  <span className="gf-playerbar__spinner" />
                ) : isPlaying ? (
                  <span className="gf-playerbar__pulse" />
                ) : null}
                {isLoading ? 'CONNECTING...' : isPlaying ? 'ON AIR' : 'OFFLINE'}
              </span>
            </div>
            <div className="gf-playerbar__info">
              <span className="gf-playerbar__title">{title || 'No stream'}</span>
              {subtitle && (
                <span className="gf-playerbar__subtitle">{subtitle}</span>
              )}
            </div>
          </div>

          <div className="gf-playerbar__right">
            <div className="gf-playerbar__extras">
              <button
                className={`gf-playerbar__extra-btn ${queue.length > 0 ? 'gf-playerbar__extra-btn--has-items' : ''}`}
                onClick={() => setShowQueue(true)}
                aria-label={`Queue (${queue.length} items)`}
                title={`Queue (${queue.length} items)`}
              >
                <GfIcon name="queue" size={14} />
                {queue.length > 0 && <span className="gf-playerbar__extra-count">{queue.length}</span>}
              </button>
              <button
                className={`gf-playerbar__extra-btn ${sleepTimer ? 'gf-playerbar__extra-btn--active' : ''}`}
                onClick={() => setShowSleep(true)}
                aria-label={sleepTimer ? `Sleep in ${sleepRemaining}m` : 'Sleep timer'}
                title={sleepTimer ? `Sleep in ${sleepRemaining}m` : 'Sleep timer'}
              >
                <GfIcon name="moon" size={14} />
                {sleepTimer && <span className="gf-playerbar__extra-dot" />}
              </button>
            </div>

            {onPlayPause && (
              <button
                className="gf-playerbar__play"
                onClick={onPlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <GfIcon name="pause" size={16} /> : <GfIcon name="play" size={16} />}
              </button>
            )}
            {isPlaying && (
              <button className="gf-playerbar__stop" onClick={onStop} aria-label="Stop">
                <GfIcon name="stop" size={12} />
              </button>
            )}
            <div className="gf-playerbar__volume">
              <GfIcon name="volume" size={14} />
              <GfSlider value={volume} onChange={onVolumeChange} />
            </div>
          </div>
        </div>
      </div>

      <GfBottomSheet open={showQueue} onClose={() => setShowQueue(false)} title="Play Queue">
        <div className="gf-playerbar__queue-sheet">
          {queue.length === 0 && (
            <p className="gf-playerbar__queue-empty">Queue is empty. Add items from music apps.</p>
          )}
          {queue.map((item, i) => (
            <div key={`${item.id}-${i}`} className="gf-playerbar__queue-item">
              <div className="gf-playerbar__queue-info">
                <span className="gf-playerbar__queue-title">{item.title}</span>
                {item.subtitle && <span className="gf-playerbar__queue-sub">{item.subtitle}</span>}
              </div>
              {onRemoveFromQueue && (
                <button
                  className="gf-playerbar__queue-remove"
                  onClick={() => onRemoveFromQueue(i)}
                  aria-label={`Remove ${item.title} from queue`}
                >
                  <GfIcon name="close" size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </GfBottomSheet>

      <GfBottomSheet open={showSleep} onClose={() => setShowSleep(false)} title="Sleep Timer">
        <div className="gf-playerbar__sleep-sheet">
          {sleepTimer ? (
            <div className="gf-playerbar__sleep-active">
              <p>Sleeping in <strong>{sleepRemaining} minutes</strong></p>
              <button
                className="gf-playerbar__sleep-cancel"
                onClick={() => { onSetSleepTimer?.(null); setShowSleep(false) }}
              >
                Cancel Timer
              </button>
            </div>
          ) : (
            <>
              <p className="gf-playerbar__sleep-hint">Stop playback after:</p>
              <div className="gf-playerbar__sleep-options">
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    className="gf-playerbar__sleep-option"
                    onClick={() => { onSetSleepTimer?.(mins); setShowSleep(false) }}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </GfBottomSheet>
    </>
  )
}
