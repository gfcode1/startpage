import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { getAppById } from '../appRegistry'
import { useAppStorage } from '../persistence/useAppStorage'
import { useWindowManager } from '../WindowManager'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { WinState } from './AppWindow'
import './AppDock.css'

interface DockItemData {
  appId: string
  name: string
  icon: string
  color: string
  gradient: string
  open: boolean
  state: WinState | null
  favorite: boolean
}

interface ContextMenuState {
  appId: string
  x: number
  y: number
}

function DockContextMenu({ state, onClose }: { state: ContextMenuState; onClose: () => void }) {
  const { windows, openWindow, closeWindow, minimizeWindow, maximizeWindow, restoreWindow, focusWindow } = useWindowManager()
  const [favoriteApps, setFavoriteApps] = useAppStorage<string[]>('_framework', 'favoriteApps', [])
  const win = windows.find(w => w.appId === state.appId)
  const appOpen = !!win
  const isFav = favoriteApps.includes(state.appId)
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

  const menuActions: { label: string; action: () => void }[] = []

  if (appOpen) {
    if (win!.state === 'minimized') {
      menuActions.push({ label: 'Restore', action: () => { restoreWindow(state.appId); focusWindow(state.appId) } })
    } else {
      menuActions.push({ label: 'Minimize', action: () => minimizeWindow(state.appId) })
    }
    if (win!.state === 'maximized') {
      menuActions.push({ label: 'Restore Window', action: () => restoreWindow(state.appId) })
    } else {
      menuActions.push({ label: 'Maximize', action: () => maximizeWindow(state.appId) })
    }
    menuActions.push({ label: 'Close', action: () => closeWindow(state.appId) })
  } else {
    menuActions.push({ label: 'Open', action: () => openWindow(state.appId) })
  }

  return (
    <div className="gf-appdock__context-menu" ref={menuRef} style={{ left: state.x, top: state.y }}>
      {menuActions.map((item, i) => (
        <button key={i} className="gf-appdock__context-item" onClick={() => { item.action(); onClose() }}>
          {item.label}
        </button>
      ))}
      <div className="gf-appdock__context-sep" />
      {isFav ? (
        <button className="gf-appdock__context-item" onClick={() => { setFavoriteApps(prev => prev.filter(id => id !== state.appId)); onClose() }}>
          Remove from Dock
        </button>
      ) : (
        <button className="gf-appdock__context-item" onClick={() => { setFavoriteApps(prev => [...prev, state.appId]); onClose() }}>
          Keep in Dock
        </button>
      )}
    </div>
  )
}

function SortableDockItem({
  item,
  isOpening,
  onClick,
  onContextMenu,
  children,
}: {
  item: DockItemData
  isOpening: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.appId })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`gf-appdock__item ${item.open ? 'gf-appdock__item--open' : ''} ${item.state === 'minimized' ? 'gf-appdock__item--minimized' : ''} ${isOpening ? 'gf-appdock__item--opening' : ''} ${isDragging ? 'gf-appdock__item--dragging' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

function DockItem({
  item,
  isOpening,
  onClick,
  onContextMenu,
  children,
}: {
  item: DockItemData
  isOpening: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`gf-appdock__item ${item.open ? 'gf-appdock__item--open' : ''} ${item.state === 'minimized' ? 'gf-appdock__item--minimized' : ''} ${isOpening ? 'gf-appdock__item--opening' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
    >
      {children}
    </div>
  )
}

function DockIcon({ item, scale }: { item: DockItemData; scale: number }) {
  return (
    <div
      className="gf-appdock__icon"
      style={{
        background: item.gradient,
        transform: `scale(${scale})`,
      }}
    >
      <Icon icon={item.icon} width={18} height={18} />
    </div>
  )
}

function DragOverlayContent({ appId }: { appId: string }) {
  const app = getAppById(appId)
  if (!app) return null
  return (
    <div className="gf-appdock__overlay-icon" style={{ background: app.gradient }}>
      <Icon icon={app.icon} width={24} height={24} />
    </div>
  )
}

function useDockState() {
  const { windows, openWindow, focusWindow, minimizeWindow, restoreWindow, getFrontmostAppId } = useWindowManager()
  const [favoriteApps, setFavoriteApps] = useAppStorage<string[]>('_framework', 'favoriteApps', [])
  const [openingApps, setOpeningApps] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const dockApps = useMemo(() => {
    const openIds = new Set(windows.map(w => w.appId))
    const stateMap = new Map(windows.map(w => [w.appId, w.state]))
    const result: DockItemData[] = []
    const seen = new Set<string>()

    for (const favId of favoriteApps) {
      const app = getAppById(favId)
      if (app) {
        result.push({
          appId: app.id, name: app.name, icon: app.icon, color: app.color,
          gradient: app.gradient, open: openIds.has(favId),
          state: stateMap.get(favId) ?? null, favorite: true,
        })
        seen.add(favId)
      }
    }

    for (const w of windows) {
      if (!seen.has(w.appId)) {
        const app = getAppById(w.appId)
        if (app) {
          result.push({
            appId: app.id, name: app.name, icon: app.icon, color: app.color,
            gradient: app.gradient, open: true,
            state: w.state, favorite: false,
          })
          seen.add(w.appId)
        }
      }
    }
    return result
  }, [windows, favoriteApps])

  const favoriteIds = useMemo(() => dockApps.filter(a => a.favorite).map(a => a.appId), [dockApps])
  const favoriteItems = useMemo(() => dockApps.filter(a => a.favorite), [dockApps])
  const openItems = useMemo(() => dockApps.filter(a => !a.favorite), [dockApps])

  const handleClick = useCallback((appId: string) => {
    const win = windows.find(w => w.appId === appId)
    if (!win) {
      openWindow(appId)
      setOpeningApps(prev => new Set(prev).add(appId))
      setTimeout(() => setOpeningApps(prev => { const n = new Set(prev); n.delete(appId); return n }), 500)
    } else if (win.state === 'minimized') {
      restoreWindow(appId)
      focusWindow(appId)
    } else if (getFrontmostAppId() === appId) {
      minimizeWindow(appId)
    } else {
      focusWindow(appId)
    }
  }, [windows, openWindow, focusWindow, minimizeWindow, restoreWindow, getFrontmostAppId])

  const handleContextMenu = useCallback((e: React.MouseEvent, appId: string) => {
    e.preventDefault()
    setContextMenu({ appId, x: e.clientX, y: e.clientY })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = favoriteApps.indexOf(String(active.id))
    const newIndex = favoriteApps.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    setFavoriteApps(arrayMove(favoriteApps, oldIndex, newIndex))
  }, [favoriteApps, setFavoriteApps])

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null)
  }, [])

  const handleDockMouseMove = useCallback((e: React.MouseEvent) => {
    const mouseX = e.clientX
    const items = (e.currentTarget as HTMLElement).querySelectorAll('[data-app-id]')
    items.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const dist = Math.abs(centerX - mouseX)
      const scale = 1 + 0.25 * Math.max(0, 1 - dist / 80)
      (el as HTMLElement).style.setProperty('--gf-scale', String(scale))
    })
  }, [])

  const handleDockMouseLeave = useCallback((e: React.MouseEvent) => {
    const items = (e.currentTarget as HTMLElement).querySelectorAll('[data-app-id]')
    items.forEach((el) => {
      (el as HTMLElement).style.removeProperty('--gf-scale')
    })
  }, [])

  const renderItem = useCallback((item: DockItemData) => {
    const isOpening = openingApps.has(item.appId)
    const icon = <DockIcon item={item} scale={1} />
    const children = (
      <>
        {icon}
        {item.open && (
          <span className={`gf-appdock__dot ${item.state === 'minimized' ? 'gf-appdock__dot--minimized' : ''}`} />
        )}
      </>
    )
    const inner = <div data-app-id={item.appId}>{children}</div>

    if (item.favorite) {
      return (
        <SortableDockItem
          key={item.appId}
          item={item}
          isOpening={isOpening}
          onClick={() => handleClick(item.appId)}
          onContextMenu={(e) => handleContextMenu(e, item.appId)}
        >
          {inner}
        </SortableDockItem>
      )
    }

    return (
      <DockItem
        key={item.appId}
        item={item}
        isOpening={isOpening}
        onClick={() => handleClick(item.appId)}
        onContextMenu={(e) => handleContextMenu(e, item.appId)}
      >
        {inner}
      </DockItem>
    )
  }, [openingApps, handleClick, handleContextMenu])

  return {
    dockApps, favoriteIds, favoriteItems, openItems,
    sensors, activeDragId, contextMenu,
    handleDragStart, handleDragEnd, handleDragCancel,
    handleDockMouseMove, handleDockMouseLeave,
    closeContextMenu, renderItem,
  }
}

export function DockContent() {
  const {
    dockApps, favoriteIds, favoriteItems, openItems,
    sensors, activeDragId, contextMenu,
    handleDragStart, handleDragEnd, handleDragCancel,
    handleDockMouseMove, handleDockMouseLeave,
    closeContextMenu, renderItem,
  } = useDockState()
  const dockRef = useRef<HTMLDivElement>(null)

  if (dockApps.length === 0) return null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="gf-appdock__inner"
        ref={dockRef}
        onMouseMove={handleDockMouseMove}
        onMouseLeave={handleDockMouseLeave}
      >
        <SortableContext items={favoriteIds} strategy={horizontalListSortingStrategy}>
          {favoriteItems.map(renderItem)}
        </SortableContext>

        {favoriteItems.length > 0 && openItems.length > 0 && (
          <div className="gf-appdock__sep" />
        )}

        {openItems.map(renderItem)}
      </div>

      <DragOverlay>
        {activeDragId && <DragOverlayContent appId={activeDragId} />}
      </DragOverlay>

      {contextMenu && (
        <DockContextMenu state={contextMenu} onClose={closeContextMenu} />
      )}
    </DndContext>
  )
}


