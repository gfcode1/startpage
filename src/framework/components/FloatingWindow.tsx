import { useState, useRef, useCallback, useEffect, ReactNode } from 'react'
import { GfIcon } from '../iconSystem'
import './FloatingWindow.css'

export type WindowState = 'normal' | 'minimized' | 'maximized'

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface FloatingWindowProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  defaultPosition?: Position
  defaultSize?: Size
  minWidth?: number
  minHeight?: number
  onPositionChange?: (pos: Position) => void
  onSizeChange?: (size: Size) => void
  state?: WindowState
  onStateChange?: (state: WindowState) => void
  initialPosition?: Position
  initialSize?: Size
}

const DEFAULT_POS: Position = { x: 16, y: 80 }
const DEFAULT_SIZE: Size = { width: 480, height: 360 }
const MIN_W = 280
const MIN_H = 200

export function FloatingWindow({
  open,
  onClose,
  title,
  children,
  defaultPosition = DEFAULT_POS,
  defaultSize = DEFAULT_SIZE,
  minWidth = MIN_W,
  minHeight = MIN_H,
  onPositionChange,
  onSizeChange,
  state: controlledState,
  onStateChange,
  initialPosition,
  initialSize,
}: FloatingWindowProps) {
  const [internalState, setInternalState] = useState<WindowState>('normal')
  const state = controlledState ?? internalState
  const [position, setPosition] = useState<Position>(initialPosition ?? defaultPosition)
  const [size, setSize] = useState<Size>(initialSize ?? defaultSize)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)

  const dragStart = useRef({ x: 0, y: 0, pos: { x: 0, y: 0 } })
  const resizeStart = useRef({ x: 0, y: 0, size: { width: 0, height: 0 } })
  const posRef = useRef(position)
  const sizeRef = useRef(size)
  const stateRef = useRef(state)

  useEffect(() => { posRef.current = position }, [position])
  useEffect(() => { sizeRef.current = size }, [size])
  useEffect(() => { stateRef.current = state }, [state])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (stateRef.current !== 'normal') return
    setDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStart.current = { x: clientX, y: clientY, pos: { ...posRef.current } }
    e.preventDefault()
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (stateRef.current !== 'normal') return
    e.stopPropagation()
    setResizing(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    resizeStart.current = { x: clientX, y: clientY, size: { ...sizeRef.current } }
    e.preventDefault()
  }, [])

  useEffect(() => {
    if (!dragging && !resizing) return

    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        setPosition({ x: dragStart.current.pos.x + dx, y: dragStart.current.pos.y + dy })
      }
      if (resizing) {
        const dx = e.clientX - resizeStart.current.x
        const dy = e.clientY - resizeStart.current.y
        setSize({
          width: Math.max(minWidth, resizeStart.current.size.width + dx),
          height: Math.max(minHeight, resizeStart.current.size.height + dy),
        })
      }
    }

    const onMouseUp = () => {
      if (dragging) {
        setDragging(false)
        onPositionChange?.(posRef.current)
      }
      if (resizing) {
        setResizing(false)
        onSizeChange?.(sizeRef.current)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (dragging) {
        const dx = e.touches[0].clientX - dragStart.current.x
        const dy = e.touches[0].clientY - dragStart.current.y
        setPosition({ x: dragStart.current.pos.x + dx, y: dragStart.current.pos.y + dy })
      }
      if (resizing) {
        const dx = e.touches[0].clientX - resizeStart.current.x
        const dy = e.touches[0].clientY - resizeStart.current.y
        setSize({
          width: Math.max(minWidth, resizeStart.current.size.width + dx),
          height: Math.max(minHeight, resizeStart.current.size.height + dy),
        })
      }
    }

    const onTouchEnd = () => {
      if (dragging) {
        setDragging(false)
        onPositionChange?.(posRef.current)
      }
      if (resizing) {
        setResizing(false)
        onSizeChange?.(sizeRef.current)
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [dragging, resizing, minWidth, minHeight, onPositionChange, onSizeChange])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const toggleMaximize = () => {
    const next = state === 'maximized' ? 'normal' : 'maximized'
    onStateChange?.(next)
    if (controlledState === undefined) setInternalState(next)
  }

  const toggleMinimize = () => {
    const next = state === 'minimized' ? 'normal' : 'minimized'
    onStateChange?.(next)
    if (controlledState === undefined) setInternalState(next)
  }

  const minimized = state === 'minimized'
  const maximized = state === 'maximized'

  return (
    <div
      className={`gf-floating ${dragging ? 'gf-floating--dragging' : ''} ${maximized ? 'gf-floating--maximized' : ''} ${minimized ? 'gf-floating--minimized' : ''}`}
      style={
        maximized
          ? { top: 0, left: 0, width: '100%', height: '100%' }
          : minimized
            ? { bottom: 'var(--gf-playerbar-height, 72px)', right: 16, left: 'auto', top: 'auto', width: 280, height: 44 }
            : { top: position.y, left: position.x, width: size.width, height: size.height }
      }
      role="dialog"
      aria-modal="false"
      aria-label={title}
    >
      <div
        className="gf-floating__titlebar"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <span className="gf-floating__title">{minimized ? `▶ ${title}` : title}</span>
        <div className="gf-floating__actions">
          <button
            className="gf-floating__btn"
            onClick={toggleMinimize}
            aria-label={minimized ? 'Restore' : 'Minimize'}
          >
            <GfIcon name={minimized ? 'chevron-up' : 'chevron-down'} size={14} />
          </button>
          <button
            className="gf-floating__btn"
            onClick={toggleMaximize}
            aria-label={maximized ? 'Restore' : 'Maximize'}
          >
            <GfIcon name="popup" size={14} />
          </button>
          <button
            className="gf-floating__btn gf-floating__btn--close"
            onClick={onClose}
            aria-label="Close"
          >
            <GfIcon name="close" size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="gf-floating__body">
          {children}
        </div>
      )}

      {!minimized && !maximized && (
        <div
          className="gf-floating__resize-handle"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        />
      )}
    </div>
  )
}
