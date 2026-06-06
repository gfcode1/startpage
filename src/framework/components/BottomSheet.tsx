import { useRef, useEffect, useCallback, useState, ReactNode } from 'react'
import './BottomSheet.css'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
}

const THRESHOLD = 80
const VELOCITY_THRESHOLD = 0.5

export function GfBottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const [translateY, setTranslateY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const rafId = useRef<number>(0)

  const handleStart = useCallback((y: number) => {
    startY.current = y
    currentY.current = 0
    setDragging(true)
  }, [])

  const handleMove = useCallback((y: number) => {
    const diff = y - startY.current
    const clamped = Math.max(0, diff)
    currentY.current = clamped
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      setTranslateY(clamped)
    })
  }, [])

  const handleEnd = useCallback((velocity: number) => {
    cancelAnimationFrame(rafId.current)
    setDragging(false)

    if (currentY.current > THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      setTranslateY(0)
      onClose()
    } else {
      setTranslateY(0)
    }
  }, [onClose])

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setTranslateY(0)
        setDragging(false)
      })
    }
  }, [open])

  useEffect(() => {
    if (!open || !dragging) return

    const onTouchMove = (e: TouchEvent) => {
      handleMove(e.touches[0].clientY)
    }
    const onTouchEnd = (e: TouchEvent) => {
      const velocity = (e.changedTouches[0].clientY - startY.current) / 100
      handleEnd(velocity)
    }
    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY)
    }
    const onMouseUp = (e: MouseEvent) => {
      const velocity = (e.clientY - startY.current) / 100
      handleEnd(velocity)
    }

    if (dragging) {
      document.addEventListener('touchmove', onTouchMove, { passive: true })
      document.addEventListener('touchend', onTouchEnd, { passive: true })
      document.addEventListener('mousemove', onMouseMove, { passive: true })
      document.addEventListener('mouseup', onMouseUp, { passive: true })
    }

    return () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [open, dragging, handleMove, handleEnd])

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="gf-sheet-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Sheet'}
    >
      <div
        className={`gf-sheet${dragging ? ' gf-sheet--dragging' : ''}`}
        ref={sheetRef}
        style={{ transform: `translateY(${translateY}px)` }}
      >
        <div
          className="gf-sheet__handle-area"
          onTouchStart={(e) => handleStart(e.touches[0].clientY)}
          onMouseDown={(e) => handleStart(e.clientY)}
        >
          <div className="gf-sheet__handle" />
        </div>

        {title && (
          <div className="gf-sheet__header">
            <h2 className="gf-sheet__title">{title}</h2>
            <button className="gf-sheet__close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        <div className="gf-sheet__body">
          {children}
        </div>
      </div>
    </div>
  )
}
