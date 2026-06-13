import { GfIcon } from '../../framework/iconSystem'
import { usePlayerState } from '../../framework/PlayerContext'
import './NowPlayingWidget.css'

export default function NowPlayingWidget() {
  const { playingId, playingTitle, subtitle, isPlaying, isLoading } = usePlayerState()

  if (!playingId) {
    return (
      <div className="gf-widget-nowplaying">
        <span className="gf-widget-nowplaying__muted">
          <GfIcon name="music-note" size={16} />
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
