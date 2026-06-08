import { useState, useCallback, useRef } from 'react'
import { GfBottomSheet } from '../../../framework/components/BottomSheet'
import { GfButton } from '../../../framework/components/Button'
import { GfIcon } from '../../../framework/iconSystem'
import type { Stream } from '../types'

interface AddStreamDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (stream: Stream) => void
}

const COLOR_PALETTE = [
  '#7c3aed', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#06b6d4', '#f97316',
]

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function randomColor() {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
}

export function AddStreamDialog({ open, onClose, onAdd }: AddStreamDialogProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const addingRef = useRef(false)

  const handleAdd = useCallback(async () => {
    if (addingRef.current) return
    setError('')
    if (!url.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    const youtubeId = extractYoutubeId(url.trim())
    if (!youtubeId) {
      setError('Invalid YouTube URL. Use youtube.com/watch?v=... or youtu.be/...')
      return
    }

    addingRef.current = true
    setLoading(true)
    let title = `YouTube Stream (${youtubeId})`
    let thumbnail = ''
    let description = ''

    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`)
      if (res.ok) {
        const data = await res.json()
        title = data.title || title
        thumbnail = data.thumbnail_url || ''
        description = data.author_name ? `Stream by ${data.author_name}` : ''
      }
    } catch {
      // fallback: use default values
    }

    try {
      const stream: Stream = {
        id: `custom-${Date.now()}`,
        title,
        description,
        youtubeId,
        thumbnail,
        color: randomColor(),
        genre: 'custom',
        isDefault: false,
      }

      onAdd(stream)
      setUrl('')
      onClose()
    } finally {
      setLoading(false)
      addingRef.current = false
    }
  }, [url, onAdd, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }, [handleAdd])

  return (
    <GfBottomSheet open={open} onClose={onClose} title="Add YouTube Stream">
      <div className="gf-yt-addstream">
        <input
          className="gf-yt-addstream__input"
          type="text"
          placeholder="Paste YouTube URL…"
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {error && (
          <p className="gf-yt-addstream__error">{error}</p>
        )}
        <div className="gf-yt-addstream__actions">
          <GfButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </GfButton>
          <GfButton
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <><GfIcon name="loading" size={14} /> Adding…</>
            ) : (
              <><GfIcon name="plus" size={14} /> Add Stream</>
            )}
          </GfButton>
        </div>
      </div>
    </GfBottomSheet>
  )
}
