import { usePlayer } from '../../framework/PlayerContext'
import './NowPlayingWidget.css'

export default function NowPlayingWidget() {
  const { playingId, playingTitle, subtitle, isPlaying, isLoading } = usePlayer()

  if (!playingId) {
    return (
      <div className="gf-widget-nowplaying">
        <span className="gf-widget-nowplaying__muted">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v10M6 3l7 4-7 4" />
          </svg>
          Nothing playing
        </span>
      </div>
    )
  }

  return (
    <div className="gf-widget-nowplaying">
      <span className="gf-widget-nowplaying__label">Now Playing</span>
      <div className="gf-widget-nowplaying__info">
        <span className="gf-widget-nowplaying__title">{isLoading ? 'Connecting...' : playingTitle}</span>
        {subtitle && <span className="gf-widget-nowplaying__sub">{subtitle}</span>}
      </div>
      <div className="gf-widget-nowplaying__indicator">
        <span className={`gf-widget-nowplaying__dot ${isPlaying ? 'gf-widget-nowplaying__dot--live' : ''}`} />
        {isPlaying ? 'Live' : 'Paused'}
      </div>
    </div>
  )
}
