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
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="2" width="4" height="12" rx="1" fill="currentColor"/>
                  <rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 2l10 6-10 6V2z" fill="currentColor"/>
                </svg>
              )}
            </button>
          )}
          {isPlaying && (
            <button className="gf-playerbar__stop" onClick={onStop} aria-label="Stop">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor"/>
              </svg>
            </button>
          )}
          <div className="gf-playerbar__volume">
            <svg className="gf-playerbar__vol-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11l-4-3H1a1 1 0 01-1-1v-3a1 1 0 011-1h2l4-3z" fill="currentColor" opacity="0.6"/>
              <path d="M10 4.5a4 4 0 010 5M12 2.5a7 7 0 010 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <GfSlider value={volume} onChange={onVolumeChange} />
          </div>
        </div>
      </div>
    </div>
  )
}
