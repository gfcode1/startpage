import { useState, useRef } from 'react'
import { usePhotoFetcher } from '../hooks/usePhotoFetcher'
import type { PhotoInfo } from '../hooks/usePhotoFetcher'
import { GfButton } from './Button'
import './PhotoGallery.css'

interface PhotoGalleryProps {
  difficulty: string
  difficulties: { key: string; label: string }[]
  onDifficultyChange: (key: string) => void
  onPlay: (img: HTMLImageElement) => void
  bestScores?: Record<string, number>
}

export function PhotoGallery({
  difficulty, difficulties, onDifficultyChange, onPlay, bestScores,
}: PhotoGalleryProps) {
  const { photos, loading, error, searchQuery, setSearchQuery, loadMore, loadingMore, hasMore, retry } = usePhotoFetcher()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoInfo | null>(null)
  const [playError, setPlayError] = useState('')

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setSelectedPhoto({
        id: 'upload-' + Date.now(),
        author: file.name,
        downloadUrl: ev.target?.result as string,
      })
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePhotoClick = (photo: PhotoInfo) => {
    setSelectedPhoto(photo)
  }

  const handleCancel = () => {
    setSelectedPhoto(null)
  }

  const handlePlay = () => {
    if (!selectedPhoto) return
    setPlayError('')
    const img = new Image()
    if (!selectedPhoto.id.startsWith('upload-')) {
      img.crossOrigin = 'anonymous'
    }
    const timeout = setTimeout(() => {
      img.src = ''
      setPlayError('Image load timed out. Try another photo.')
    }, 15000)
    img.onload = () => {
      clearTimeout(timeout)
      setSelectedPhoto(null)
      onPlay(img)
    }
    img.onerror = () => {
      clearTimeout(timeout)
      setPlayError('Failed to load image. Try another photo.')
    }
    img.src = selectedPhoto.downloadUrl
  }

  return (
    <div className="gf-photo-gallery">
      <div className="gf-photo-gallery__search">
        <svg className="gf-photo-gallery__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="gf-photo-gallery__search-input"
          type="text"
          placeholder="Search by author name…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search photos by author"
        />
      </div>

      {error && (
        <div className="gf-photo-gallery__status">
          <p>Failed to load photos</p>
          <GfButton variant="primary" size="sm" onClick={retry}>Retry</GfButton>
        </div>
      )}

      {loading && <p className="gf-photo-gallery__status">Loading photos…</p>}

      {!loading && !error && photos.length === 0 && (
        <p className="gf-photo-gallery__status">No photos found</p>
      )}

      {!loading && !error && photos.length > 0 && (
        <div className="gf-photo-gallery__grid">
          {photos.map(photo => (
            <button
              key={photo.id}
              className={`gf-photo-gallery__card${selectedPhoto?.id === photo.id ? ' gf-photo-gallery__card--selected' : ''}`}
              onClick={() => handlePhotoClick(photo)}
            >
              <img
                src={selectedPhoto?.id === photo.id
                  ? photo.downloadUrl
                  : `https://picsum.photos/id/${photo.id}/200/200`
                }
                alt={`Photo by ${photo.author}`}
                className="gf-photo-gallery__thumb"
                loading="lazy"
              />
              <span className="gf-photo-gallery__author">{photo.author}</span>
            </button>
          ))}
        </div>
      )}

      {!error && !loading && hasMore && (
        <div className="gf-photo-gallery__load-more-wrap">
          <GfButton variant="ghost" size="md" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more photos'}
          </GfButton>
        </div>
      )}

      <div className="gf-photo-gallery__upload">
        <button className="gf-photo-gallery__upload-btn" onClick={() => fileInputRef.current?.click()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload your photo
        </button>
        <input ref={fileInputRef} type="file" className="gf-photo-gallery__upload-input" accept="image/*" onChange={handleUpload} />
      </div>

      {selectedPhoto && (
        <div className="gf-photo-gallery__selection">
          <div className="gf-photo-gallery__selection-preview">
            <img
              src={selectedPhoto.downloadUrl}
              alt={selectedPhoto.author}
              className="gf-photo-gallery__selection-thumb"
            />
            <div className="gf-photo-gallery__selection-info">
              <span className="gf-photo-gallery__selection-name">{selectedPhoto.author}</span>
            </div>
          </div>
          <div className="gf-photo-gallery__selection-diffs">
            {difficulties.map(({ key, label }) => (
              <GfButton key={key} variant={difficulty === key ? 'primary' : 'ghost'} size="sm" onClick={() => onDifficultyChange(key)}>
                {label}
              </GfButton>
            ))}
          </div>
          <div className="gf-photo-gallery__selection-actions">
            <GfButton variant="primary" size="md" onClick={handlePlay}>
              Play
            </GfButton>
            <GfButton variant="ghost" size="md" onClick={handleCancel}>
              Cancel
            </GfButton>
          </div>
          {playError && <p className="gf-photo-gallery__play-error">{playError}</p>}
        </div>
      )}

      {bestScores && (
        <div className="gf-photo-gallery__bests">
          {difficulties.map(({ key, label }) => {
            const score = bestScores[key]
            return (
              <div key={key} className="gf-photo-gallery__best-box">
                <span className="gf-photo-gallery__best-label">{label}</span>
                <span className="gf-photo-gallery__best-value">{score > 0 ? score : '—'}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
