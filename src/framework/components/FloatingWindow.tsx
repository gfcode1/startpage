import { useState, useRef, useCallback, useEffect, ReactNode, createPortal } from 'react'
import { GfIcon } from '../iconSystem'
import type { TopbarAction, TopbarSearch as TopbarSearchType } from '../TopbarContext'
import { TopbarSearch } from './TopbarSearch'
import './FloatingWindow.css'

export type WindowState = 'normal' | 'minimized' | 'maximized'

interface Position { x: number; y: number }
interface Size { width: number; height: number }

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

type SnapRegion = 'full' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface FloatingWindowProps {
  open: boolean
  onClose: () => void
  onFocus?: () => void
  title: string
  children: ReactNode
  state?: WindowState
  onStateChange?: (state: WindowState) => void
  zIndex?: number
  controlledPosition?: Position
  controlledSize?: Size
  onPositionChange?: (pos: Position) => void
  onSizeChange?: (size: Size) => void
  titlebarActions?: TopbarAction[]
  titlebarSearch?: TopbarSearchType | null
  titlebarCustomSearch?: ReactNode | null
  accentGradient?: string
  accentColor?: string
  minWidth?: number
  minHeight?: number
  initialPosition?: Position
  initialSize?: Size
}

const DEFAULT_SIZE: Size = { width: 560, height: 420 }
const MIN_W = 280
const MIN_H = 200
const SNAP_THRESHOLD = 50
const SHELF_BOTTOM_GAP = 72

function getSnapRegion(
  x: number, y: number, w: number, h: number,
  vw: number, vh: number,
): { region: SnapRegion; pos: Position; size: Size } | null {
  const nearLeft = x <= SNAP_THRESHOLD
  const nearRight = x + w >= vw - SNAP_THRESHOLD
  const nearTop = y <= SNAP_THRESHOLD
  const cx = x + w / 2

  if (nearTop && cx > vw * 0.25 && cx < vw * 0.75) {
    return { region: 'full', pos: { x: 0, y: 0 }, size: { width: vw, height: vh } }
  }
  if (nearTop) {
    if (nearRight) {
      return { region: 'top-right', pos: { x: vw / 2, y: 0 }, size: { width: vw / 2, height: vh / 2 } }
    }
    if (nearLeft) {
      return { region: 'top-left', pos: { x: 0, y: 0 }, size: { width: vw / 2, height: vh / 2 } }
    }
    return null
  }

  if (nearLeft) {
    if (nearBottom) {
      return { region: 'bottom-left', pos: { x: 0, y: vh / 2 }, size: { width: vw / 2, height: vh / 2 } }
    }
    return { region: 'left', pos: { x: 0, y: 0 }, size: { width: vw / 2, height: vh } }
  }

  if (nearRight) {
    if (nearBottom) {
      return { region: 'bottom-right', pos: { x: vw / 2, y: vh / 2 }, size: { width: vw / 2, height: vh / 2 } }
    }
    return { region: 'right', pos: { x: vw / 2, y: 0 }, size: { width: vw / 2, height: vh } }
  }

  if (nearBottom) {
    return null
  }

  return null
}

function clampPos(pos: Position, size: Size, vw: number, vh: number): Position {
  return {
    x: Math.max(0, Math.min(pos.x, vw - size.width)),
    y: Math.max(0, Math.min(pos.y, vh - size.height - SHELF_BOTTOM_GAP)),
  }
}

const EDGE_HANDLES: { edge: ResizeEdge; className: string }[] = [
  { edge: 'n', className: 'gf-floating__handle--n' },
  { edge: 's', className: 'gf-floating__handle--s' },
  { edge: 'e', className: 'gf-floating__handle--e' },
  { edge: 'w', className: 'gf-floating__handle--w' },
  { edge: 'ne', className: 'gf-floating__handle--ne' },
  { edge: 'nw', className: 'gf-floating__handle--nw' },
  { edge: 'se', className: 'gf-floating__handle--se' },
  { edge: 'sw', className: 'gf-floating__handle--sw' },
]

const CURSOR_MAP: Record<ResizeEdge, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
}

function WindowContextMenu({
  x, y,
  onClose, onRestore, onMinimize, onMaximize, onCloseWindow,
  state,
}: {
  x: number; y: number
  onClose: () => void
  onRestore: () => void
  onMinimize: () => void
  onMaximize: () => void
  onCloseWindow: () => void
  state: WindowState
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [onClose])

  return (
    <div className="gf-floating__ctx-menu" ref={menuRef} style={{ left: x, top: y }}>
      {state !== 'normal' && (
        <button className="gf-floating__ctx-item" onClick={() => { onRestore(); onClose() }}>
          <GfIcon name="check" size={14} /> Ripristina
        </button>
      )}
      <button className="gf-floating__ctx-item" onClick={() => { onMinimize(); onClose() }}>
        <GfIcon name="chevron-down" size={14} /> Minimizza
      </button>
      {state !== 'maximized' && (
        <button className="gf-floating__ctx-item" onClick={() => { onMaximize(); onClose() }}>
          <GfIcon name="popup" size={14} /> Massimizza
        </button>
      )}
      <div className="gf-floating__ctx-sep" />
      <button className="gf-floating__ctx-item gf-floating__ctx-item--danger" onClick={() => { onCloseWindow(); onClose() }}>
        <GfIcon name="close" size={14} /> Chiudi
      </button>
    </div>
  )
}

export function FloatingWindow({
  open,
  onClose,
  onFocus,
  title,
  children,
  state: controlledState,
  onStateChange,
  zIndex = 1000,
  controlledPosition,
  controlledSize,
  onPositionChange,
  onSizeChange,
  titlebarActions = [],
  titlebarSearch = null,
  titlebarCustomSearch = null,
  accentGradient,
  accentColor,
  minWidth = MIN_W,
  minHeight = MIN_H,
  initialPosition,
  initialSize,
}: FloatingWindowProps) {
  const [internalState, setInternalState] = useState<WindowState>('normal')
  const state = controlledState ?? internalState
  const [internalPos, setInternalPos] = useState<Position>(initialPosition ?? { x: 48, y: 80 })
  const [internalSize, setInternalSize] = useState<Size>(initialSize ?? DEFAULT_SIZE)

  const position = controlledPosition ?? internalPos
  const size = controlledSize ?? internalSize

  const [dragging, setDragging] = useState(false)
  const [resizeEdge, setResizeEdge] = useState<ResizeEdge | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [snapPreview, setSnapPreview] = useState<{ region: SnapRegion; pos: Position; size: Size } | null>(null)

  const dragStart = useRef({ x: 0, y: 0, pos: { x: 0, y: 0 } })
  const resizeStart = useRef({ x: 0, y: 0, pos: { x: 0, y: 0 }, size: { width: 0, height: 0 } })
  const posRef = useRef(position)
  const sizeRef = useRef(size)
  const stateRef = useRef(state)
  const winRef = useRef<HTMLDivElement>(null)
  const snapRef = useRef<{ region: SnapRegion; pos: Position; size: Size } | null>(null)

  const controlledPosRef = useRef(controlledPosition)
  const controlledSizeRef = useRef(controlledSize)
  const onPosCbRef = useRef(onPositionChange)
  const onSizeCbRef = useRef(onSizeChange)
  const mwRef = useRef(minWidth)
  const mhRef = useRef(minHeight)

  useEffect(() => { posRef.current = position }, [position])
  useEffect(() => { sizeRef.current = size }, [size])
  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { controlledPosRef.current = controlledPosition }, [controlledPosition])
  useEffect(() => { controlledSizeRef.current = controlledSize }, [controlledSize])
  useEffect(() => { onPosCbRef.current = onPositionChange }, [onPositionChange])
  useEffect(() => { onSizeCbRef.current = onSizeChange }, [onSizeChange])
  useEffect(() => { mwRef.current = minWidth; mhRef.current = minHeight }, [minWidth, minHeight])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (stateRef.current !== 'normal') return
    setDragging(true)
    setSnapPreview(null)
    snapRef.current = null
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStart.current = { x: clientX, y: clientY, pos: { ...posRef.current } }
    e.preventDefault()
  }, [])

  const handleResizeStart = useCallback((edge: ResizeEdge) => (e: React.MouseEvent | React.TouchEvent) => {
    if (stateRef.current !== 'normal') return
    e.stopPropagation()
    setResizeEdge(edge)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    resizeStart.current = {
      x: clientX, y: clientY,
      pos: { ...posRef.current },
      size: { ...sizeRef.current },
    }
    e.preventDefault()
  }, [])

  const handleMouseDown = useCallback(() => {
    onFocus?.()
  }, [onFocus])

  const handleDoubleClick = useCallback(() => {
    const next = stateRef.current === 'maximized' ? 'normal' : 'maximized'
    onStateChange?.(next)
    if (controlledState === undefined) setInternalState(next)
  }, [onStateChange, controlledState, setInternalState])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [setContextMenu])

  useEffect(() => {
    if (!dragging && resizeEdge === null) return

    const cp = controlledPosRef.current
    const cs = controlledSizeRef.current
    const posCb = onPosCbRef.current
    const sizeCb = onSizeCbRef.current
    const mw = mwRef.current
    const mh = mhRef.current

    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        const newPos: Position = { x: dragStart.current.pos.x + dx, y: dragStart.current.pos.y + dy }

        const vw = window.innerWidth
        const vh = window.innerHeight
        const snapResult = getSnapRegion(newPos.x, newPos.y, sizeRef.current.width, sizeRef.current.height, vw, vh)

        if (snapResult) {
          snapRef.current = snapResult
          setSnapPreview(snapResult)
        } else {
          snapRef.current = null
          setSnapPreview(null)
          const clamped = clampPos(newPos, sizeRef.current, vw, vh)
          if (cp) {
            posCb?.(clamped)
          } else {
            setInternalPos(clamped)
          }
        }
      }

      if (resizeEdge) {
        const edge = resizeEdge
        const dx = e.clientX - resizeStart.current.x
        const dy = e.clientY - resizeStart.current.y
        let newX = resizeStart.current.pos.x
        let newY = resizeStart.current.pos.y
        let newW = resizeStart.current.size.width
        let newH = resizeStart.current.size.height

        if (edge.includes('e')) {
          newW = Math.max(mw, resizeStart.current.size.width + dx)
        }
        if (edge.includes('w')) {
          const maxDx = resizeStart.current.size.width - mw
          const clampedDx = Math.min(dx, maxDx)
          newX = resizeStart.current.pos.x + clampedDx
          newW = resizeStart.current.size.width - clampedDx
        }
        if (edge.includes('s')) {
          newH = Math.max(mh, resizeStart.current.size.height + dy)
        }
        if (edge.includes('n')) {
          const maxDy = resizeStart.current.size.height - mh
          const clampedDy = Math.min(dy, maxDy)
          newY = resizeStart.current.pos.y + clampedDy
          newH = resizeStart.current.size.height - clampedDy
        }

        const updateSize: Size = { width: newW, height: newH }
        const updatePos: Position = { x: newX, y: newY }

        if (cs) {
          sizeCb?.(updateSize)
        } else {
          setInternalSize(updateSize)
        }
        if (cp) {
          posCb?.(updatePos)
        } else {
          setInternalPos(updatePos)
        }
      }
    }

    const onMouseUp = () => {
      if (dragging) {
        const snap = snapRef.current
        if (snap) {
          snapRef.current = null
          setSnapPreview(null)
          const nextState = snap.region === 'full' ? 'maximized' : 'normal'
          if (nextState === 'maximized') {
            onStateChange?.('maximized')
            if (controlledState === undefined) setInternalState('maximized')
          } else {
            if (cp) {
              posCb?.(snap.pos)
              sizeCb?.(snap.size)
            } else {
              setInternalPos(snap.pos)
              setInternalSize(snap.size)
            }
          }
        }
        setDragging(false)
      }
      if (resizeEdge) {
        setResizeEdge(null)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (dragging) {
        const dx = e.touches[0].clientX - dragStart.current.x
        const dy = e.touches[0].clientY - dragStart.current.y
        const newPos: Position = { x: dragStart.current.pos.x + dx, y: dragStart.current.pos.y + dy }

        const vw = window.innerWidth
        const vh = window.innerHeight
        const snapResult = getSnapRegion(newPos.x, newPos.y, sizeRef.current.width, sizeRef.current.height, vw, vh)

        if (snapResult) {
          snapRef.current = snapResult
          setSnapPreview(snapResult)
        } else {
          snapRef.current = null
          setSnapPreview(null)
          const clamped = clampPos(newPos, sizeRef.current, vw, vh)
          if (cp) {
            posCb?.(clamped)
          } else {
            setInternalPos(clamped)
          }
        }
      }
      if (resizeEdge) {
        const edge = resizeEdge
        const dx = e.touches[0].clientX - resizeStart.current.x
        const dy = e.touches[0].clientY - resizeStart.current.y
        let newX = resizeStart.current.pos.x
        let newY = resizeStart.current.pos.y
        let newW = resizeStart.current.size.width
        let newH = resizeStart.current.size.height

        if (edge.includes('e')) {
          newW = Math.max(mw, resizeStart.current.size.width + dx)
        }
        if (edge.includes('w')) {
          const maxDx = resizeStart.current.size.width - mw
          const clampedDx = Math.min(dx, maxDx)
          newX = resizeStart.current.pos.x + clampedDx
          newW = resizeStart.current.size.width - clampedDx
        }
        if (edge.includes('s')) {
          newH = Math.max(mh, resizeStart.current.size.height + dy)
        }
        if (edge.includes('n')) {
          const maxDy = resizeStart.current.size.height - mh
          const clampedDy = Math.min(dy, maxDy)
          newY = resizeStart.current.pos.y + clampedDy
          newH = resizeStart.current.size.height - clampedDy
        }

        const updateSize: Size = { width: newW, height: newH }
        const updatePos: Position = { x: newX, y: newY }

        if (cs) {
          sizeCb?.(updateSize)
        } else {
          setInternalSize(updateSize)
        }
        if (cp) {
          posCb?.(updatePos)
        } else {
          setInternalPos(updatePos)
        }
      }
    }

    const onTouchEnd = () => {
      if (dragging) {
        const snap = snapRef.current
        if (snap) {
          snapRef.current = null
          setSnapPreview(null)
          const nextState = snap.region === 'full' ? 'maximized' : 'normal'
          if (nextState === 'maximized') {
            onStateChange?.('maximized')
            if (controlledState === undefined) setInternalState('maximized')
          } else {
            if (cp) {
              posCb?.(snap.pos)
              sizeCb?.(snap.size)
            } else {
              setInternalPos(snap.pos)
              setInternalSize(snap.size)
            }
          }
        }
        setDragging(false)
      }
      if (resizeEdge) {
        setResizeEdge(null)
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
  }, [dragging, resizeEdge, onStateChange, controlledState])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || state === 'minimized') return null

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

  const isMobile = window.innerWidth < 640
  const maximized = state === 'maximized' || isMobile

  const showTitleActions = titlebarActions.length > 0
  const actionsToShow = isMobile ? titlebarActions.filter(a => a.variant === 'primary').slice(0, 2) : titlebarActions.slice(0, 5)
  const hasMoreActions = titlebarActions.length > actionsToShow.length

  const resizing = resizeEdge !== null

  return (
    <div
      ref={winRef}
      className={`gf-floating ${dragging ? 'gf-floating--dragging' : ''} ${maximized ? 'gf-floating--maximized' : ''} ${isMobile ? 'gf-floating--mobile' : ''} ${resizing ? 'gf-floating--resizing' : ''}`}
      style={
        maximized
          ? { zIndex, top: 0, left: 0, width: '100%', height: '100%' }
          : { zIndex, top: position.y, left: position.x, width: size.width, height: size.height }
      }
      role="dialog"
      aria-modal={maximized || isMobile}
      aria-label={title}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`gf-floating__titlebar ${accentGradient ? 'gf-floating__titlebar--app' : ''}`}
        style={accentGradient ? {
          background: accentGradient,
        } : undefined}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="gf-floating__title-left">
          <span className={`gf-floating__title ${accentGradient ? 'gf-floating__title--app' : ''}`}>
            {title}
          </span>
        </div>

        <div className="gf-floating__title-center">
          {showTitleActions && actionsToShow.length > 0 && (
            <div className="gf-floating__window-actions">
              {actionsToShow.map(action => (
                <button
                  key={action.id}
                  className={`gf-floating__action-btn ${action.variant === 'primary' ? 'gf-floating__action-btn--primary' : ''}`}
                  onClick={action.onClick}
                  aria-label={action.label}
                  title={action.label}
                >
                  <GfIcon name={action.icon} size={14} />
                </button>
              ))}
              {hasMoreActions && (
                <button
                  className="gf-floating__action-btn"
                  onClick={() => setShowActions(a => !a)}
                  aria-label="More actions"
                >
                  <GfIcon name="menu" size={14} />
                </button>
              )}
            </div>
          )}
          {titlebarSearch && (
            <div className="gf-floating__window-search">
              <TopbarSearch search={titlebarSearch} />
            </div>
          )}
          {titlebarCustomSearch && (
            <div className="gf-floating__window-custom-search">
              {titlebarCustomSearch}
            </div>
          )}
        </div>

        <div className="gf-floating__actions">
          <button
            className="gf-floating__btn"
            onClick={toggleMinimize}
            aria-label="Minimize"
          >
            <GfIcon name="chevron-down" size={14} />
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

      {hasMoreActions && showActions && (
        <div className="gf-floating__overflow">
          {titlebarActions.slice(actionsToShow.length).map(action => (
            <button
              key={action.id}
              className="gf-floating__overflow-btn"
              onClick={() => { action.onClick(); setShowActions(false) }}
            >
              <GfIcon name={action.icon} size={14} />
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="gf-floating__body" style={accentColor ? { borderTop: `1px solid ${accentColor}20` } : undefined}>
        {children}
      </div>

      {!maximized && EDGE_HANDLES.map(({ edge, className }) => (
        <div
          key={edge}
          className={`gf-floating__resize-handle ${className}`}
          style={{ cursor: CURSOR_MAP[edge] }}
          onMouseDown={handleResizeStart(edge)}
          onTouchStart={handleResizeStart(edge)}
        />
      ))}

      {snapPreview && createPortal(
        <div
          className="gf-floating__snap-preview"
          style={{
            top: snapPreview.pos.y,
            left: snapPreview.pos.x,
            width: snapPreview.size.width,
            height: snapPreview.size.height,
          }}
        />,
        document.body
      )}

      {contextMenu && (
        <WindowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRestore={() => {
            onStateChange?.('normal')
            if (controlledState === undefined) setInternalState('normal')
          }}
          onMinimize={toggleMinimize}
          onMaximize={toggleMaximize}
          onCloseWindow={onClose}
          state={state}
        />
      )}
    </div>
  )
}
