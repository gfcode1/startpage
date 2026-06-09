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
  const { photos, loading, error, loadMore, loadingMore, hasMore, retry } = usePhotoFetcher()
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
      <div className="gf-photo-gallery__upload">
        <input ref={fileInputRef} type="file" className="gf-photo-gallery__upload-input" accept="image/*" onChange={handleUpload} />
        <GfButton variant="primary" size="md" onClick={() => fileInputRef.current?.click()}>
          Upload your photo
        </GfButton>
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

      {!loading && !error && photos.length > 0 && !selectedPhoto && (
        <p className="gf-photo-gallery__status">Select a photo to play</p>
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
                src={photo.downloadUrl}
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
