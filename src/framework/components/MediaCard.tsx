import { ReactNode, useState } from 'react'
import { GfIcon } from '../iconSystem'
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
  onClick?: () => void
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
  onClick,
  onPlay,
  onFavorite,
  renderBeforeTitle,
}: MediaCardProps) {
  const [imgError, setImgError] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={`gf-media-card ${isPlaying ? 'gf-media-card--playing' : ''} ${onClick ? 'gf-media-card--clickable' : ''}`}
      style={{
        '--card-accent': accentColor,
        '--card-index': index,
      } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
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
        {onPlay && (
          <button
            className={`gf-media-card__play ${isPlaying ? 'gf-media-card__play--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onPlay() }}
            aria-label={isPlaying ? 'Stop' : 'Play'}
          >
            {isLoading ? (
              <span className="gf-media-card__spinner" />
            ) : isPlaying ? (
              <GfIcon name="pause" size={14} />
            ) : (
              <GfIcon name="play" size={14} />
            )}
          </button>
        )}
        {onFavorite && (
          <button
            className={`gf-media-card__fav ${isFavorite ? 'gf-media-card__fav--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onFavorite?.(id) }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <GfIcon name={isFavorite ? 'heart' : 'heart-outline'} size={14} />
          </button>
        )}
      </div>

      {isPlaying && (
        <div className="gf-media-card__equalizer">
          <span /><span /><span /><span />
        </div>
      )}
    </div>
  )
}
