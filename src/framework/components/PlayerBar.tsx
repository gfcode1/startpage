import { GfIcon } from '../iconSystem'
import { GfSlider } from './Slider'
import './PlayerBar.css'

interface PlayerBarProps {
  isPlaying?: boolean
  isLoading?: boolean
  title?: string
  subtitle?: string
  volume?: number
  onVolumeChange?: (volume: number) => void
  onStop?: () => void
  onPlayPause?: () => void
}

export function PlayerBar({
  isPlaying,
  isLoading,
  title,
  subtitle,
  volume = 0.75,
  onVolumeChange,
  onStop,
  onPlayPause,
}: PlayerBarProps) {
  return (
    <div className={`gf-playerbar ${isPlaying ? 'gf-playerbar--active' : ''}`}>
      <div className="gf-playerbar__inner">
        <div className="gf-playerbar__left">
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
  )
}
