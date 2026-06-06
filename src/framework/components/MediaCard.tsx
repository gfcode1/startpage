import { ReactNode, useState } from 'react'
import './MediaCard.css'

interface MediaCardProps {
  id: string
  index?: number
  image?: string
  title: string
  description?: string
  metadata?: ReactNode
  nowPlaying?: string
  isPlaying?: boolean
  isLoading?: boolean
  isFavorite?: boolean
  accentColor?: string
  onPlay?: () => void
  onFavorite?: (id: string) => void
  renderBeforeTitle?: () => ReactNode | null
}

export function MediaCard({
  id,
  index = 0,
  image,
  title,
  description,
  metadata,
  nowPlaying,
  isPlaying,
  isLoading,
  isFavorite,
  accentColor,
  onPlay,
  onFavorite,
  renderBeforeTitle,
}: MediaCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={`gf-media-card ${isPlaying ? 'gf-media-card--playing' : ''}`}
      style={{
        '--card-accent': accentColor,
        '--card-index': index,
      } as React.CSSProperties}
    >
      <div className="gf-media-card__top">
        {image && !imgError && (
          <div className="gf-media-card__img-wrap">
            <img
              className="gf-media-card__img"
              src={image}
              alt={title}
              loading="lazy"
              onError={() => setImgError(true)}
            />
            {renderBeforeTitle?.()}
          </div>
        )}
        {(image && imgError) || !image ? (
          <div className="gf-media-card__img-wrap gf-media-card__img-fallback">
            <span className="gf-media-card__img-initial">{title.charAt(0).toUpperCase()}</span>
            {renderBeforeTitle?.()}
          </div>
        ) : null}
        <div className="gf-media-card__info">
          <h3 className="gf-media-card__title">{title}</h3>
          {description && <p className="gf-media-card__desc">{description}</p>}
        </div>
      </div>

      {metadata && (
        <div className="gf-media-card__meta">
          {metadata}
        </div>
      )}

      {nowPlaying && (
        <div className="gf-media-card__now">
          <span className="gf-media-card__now-label">now playing</span>
          <span className="gf-media-card__now-track">{nowPlaying}</span>
        </div>
      )}

      <div className="gf-media-card__actions">
        <button
          className={`gf-media-card__play ${isPlaying ? 'gf-media-card__play--active' : ''}`}
          onClick={onPlay}
          aria-label={isPlaying ? 'Stop' : 'Play'}
        >
          {isLoading ? (
            <span className="gf-media-card__spinner" />
          ) : isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="1" width="3.5" height="12" rx="1" fill="currentColor"/>
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 1.5l8 5.5-8 5.5V1.5z" fill="currentColor"/>
            </svg>
          )}
        </button>
        <button
          className={`gf-media-card__fav ${isFavorite ? 'gf-media-card__fav--active' : ''}`}
          onClick={() => onFavorite?.(id)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 12.5l-5.5-5A3.5 3.5 0 017 2.5a3.5 3.5 0 015.5 5L7 12.5z"
              stroke="currentColor" strokeWidth="1.3" fill={isFavorite ? 'currentColor' : 'none'} />
          </svg>
        </button>
      </div>

      {isPlaying && (
        <div className="gf-media-card__equalizer">
          <span /><span /><span /><span />
        </div>
      )}
    </div>
  )
}
