import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect, useRef } from 'react'
import { getAppById, AppDef } from './appRegistry'
import { AppWindow } from './components/AppWindow'
import type { OpenWindow } from './components/AppWindow'

interface Position { x: number; y: number }
interface Size { width: number; height: number }

type SnapRegion = 'left' | 'right' | 'full'

interface WindowManagerValue {
  windows: OpenWindow[]
  openWindow: (appId: string) => void
  closeWindow: (appId: string) => void
  focusWindow: (appId: string) => void
  minimizeWindow: (appId: string) => void
  maximizeWindow: (appId: string) => void
  restoreWindow: (appId: string) => void
  toggleWindow: (appId: string) => void
  snapWindow: (appId: string, region: SnapRegion) => void
  updatePosition: (appId: string, pos: Position) => void
  updateSize: (appId: string, size: Size) => void
  isOpen: (appId: string) => boolean
  getApp: (appId: string) => AppDef | undefined
  getFrontmostAppId: () => string | undefined
}

const WindowManagerContext = createContext<WindowManagerValue | null>(null)

const STORAGE_KEY = 'gf:windowManager'
const CASCADE_OFFSET = 28
const BASE_POS = { x: 48, y: 80 }
const BASE_SIZE = { width: 560, height: 420 }

function cascadePosition(index: number): Position {
  return {
    x: BASE_POS.x + (index % 8) * CASCADE_OFFSET,
    y: BASE_POS.y + (index % 8) * CASCADE_OFFSET,
  }
}

function loadPersisted(): OpenWindow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OpenWindow[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(w => getAppById(w.appId) !== undefined)
  } catch {
    return []
  }
}

function savePersisted(windows: OpenWindow[]) {
  try {
    const clean = windows.map(w => ({
      id: w.id,
      appId: w.appId,
      state: w.state,
      position: w.position,
      size: w.size,
      zIndex: w.zIndex,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  } catch { /* noop */ }
}

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<OpenWindow[]>(() => loadPersisted())
  const zCounter = useRef(windows.reduce((max, w) => Math.max(max, w.zIndex), 0) + 1)

  useEffect(() => {
    savePersisted(windows)
  }, [windows])

  const closeWindow = useCallback((appId: string) => {
    setWindows(prev => prev.filter(w => w.appId !== appId))
  }, [])

  const focusWindow = useCallback((appId: string) => {
    const z = zCounter.current++
    setWindows(prev => prev.map(w =>
      w.appId === appId ? { ...w, zIndex: z } : w
    ))
  }, [])

  const openWindow = useCallback((appId: string) => {
    const existing = windows.find(w => w.appId === appId)
    if (existing) {
      focusWindow(appId)
      return
    }
    const app = getAppById(appId)
    if (!app) return

    const z = zCounter.current++
    const index = windows.length
    const isMobile = window.innerWidth < 640

    setWindows(prev => [...prev, {
      id: `${appId}-${Date.now()}`,
      appId,
      state: isMobile ? 'maximized' : 'normal',
      position: isMobile ? { x: 0, y: 0 } : cascadePosition(index),
      size: isMobile ? { width: window.innerWidth, height: window.innerHeight } : BASE_SIZE,
      zIndex: z,
    }])
  }, [windows, focusWindow])

  const minimizeWindow = useCallback((appId: string) => {
    setWindows(prev => prev.map(w =>
      w.appId === appId ? { ...w, state: 'minimized' } : w
    ))
  }, [])

  const maximizeWindow = useCallback((appId: string) => {
    const z = zCounter.current++
    setWindows(prev => prev.map(w =>
      w.appId === appId ? { ...w, state: 'maximized', zIndex: z } : w
    ))
  }, [])

  const restoreWindow = useCallback((appId: string) => {
    const z = zCounter.current++
    setWindows(prev => prev.map(w =>
      w.appId === appId ? { ...w, state: 'normal', zIndex: z } : w
    ))
  }, [])

  const toggleWindow = useCallback((appId: string) => {
    const existing = windows.find(w => w.appId === appId)
    if (!existing) {
      openWindow(appId)
    } else if (existing.state === 'minimized') {
      restoreWindow(appId)
    } else {
      minimizeWindow(appId)
    }
  }, [windows, openWindow, restoreWindow, minimizeWindow])

  const snapWindow = useCallback((appId: string, region: SnapRegion) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const z = zCounter.current++

    setWindows(prev => prev.map(w => {
      if (w.appId !== appId) return w
      if (region === 'full') {
        return { ...w, state: 'maximized', zIndex: z }
      }
      const halfW = Math.round(vw / 2)
      const state = w.state === 'minimized' ? 'normal' : w.state
      return {
        ...w,
        state,
        position: { x: region === 'left' ? 0 : halfW, y: 0 },
        size: { width: halfW, height: vh },
        zIndex: z,
      }
    }))
  }, [])

  const updatePosition = useCallback((appId: string, position: Position) => {
    setWindows(prev => prev.map(w =>
      w.appId === appId ? { ...w, position } : w
    ))
  }, [])

  const updateSize = useCallback((appId: string, size: Size) => {
    setWindows(prev => prev.map(w =>
      w.appId === appId ? { ...w, size } : w
    ))
  }, [])

  const isOpen = useCallback((appId: string) => {
    return windows.some(w => w.appId === appId)
  }, [windows])

  const getApp = useCallback((appId: string) => {
    return getAppById(appId)
  }, [])

  const getFrontmostAppId = useCallback(() => {
    if (windows.length === 0) return undefined
    return windows.reduce((a, b) => a.zIndex > b.zIndex ? a : b).appId
  }, [windows])

  const getFrontmostWindow = useCallback(() => {
    if (windows.length === 0) return undefined
    return windows.reduce((a, b) => a.zIndex > b.zIndex ? a : b)
  }, [windows])

  const cycleWindowFocus = useCallback((direction: 1 | -1) => {
    if (windows.length === 0) return
    const sorted = [...windows].sort((a, b) => a.zIndex - b.zIndex)
    const frontmost = getFrontmostWindow()
    const currentIdx = frontmost ? sorted.findIndex(w => w.appId === frontmost.appId) : sorted.length - 1
    const nextIdx = (currentIdx + direction + sorted.length) % sorted.length
    focusWindow(sorted[nextIdx].appId)
  }, [windows, focusWindow, getFrontmostWindow])

  useEffect(() => {
    const onResize = () => {
      const isMobile = window.innerWidth < 640
      setWindows(prev => prev.map((w, idx) => {
        if (isMobile) {
          return { ...w, state: 'maximized', position: { x: 0, y: 0 }, size: { width: window.innerWidth, height: window.innerHeight } }
        }
        if (w.state === 'maximized') {
          return { ...w, state: 'normal', position: cascadePosition(idx) }
        }
        return w
      }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const front = getFrontmostWindow()
      if (!front) return

      if (e.key === 'Tab' && e.altKey && !e.shiftKey) {
        e.preventDefault()
        cycleWindowFocus(1)
        return
      }
      if (e.key === 'Tab' && e.altKey && e.shiftKey) {
        e.preventDefault()
        cycleWindowFocus(-1)
        return
      }

      if (e.key === 'w' && mod && !e.shiftKey) {
        e.preventDefault()
        closeWindow(front.appId)
        return
      }
      if (e.key === 'F4' && (e.altKey || mod)) {
        e.preventDefault()
        closeWindow(front.appId)
        return
      }

      if (mod && e.shiftKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          maximizeWindow(front.appId)
          return
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          if (front.state === 'maximized') {
            restoreWindow(front.appId)
          } else {
            minimizeWindow(front.appId)
          }
          return
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          snapWindow(front.appId, 'left')
          return
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          snapWindow(front.appId, 'right')
          return
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [
    getFrontmostWindow, closeWindow, focusWindow,
    minimizeWindow, maximizeWindow, restoreWindow, snapWindow,
    cycleWindowFocus,
  ])

  const value = useMemo<WindowManagerValue>(() => ({
    windows,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    toggleWindow,
    snapWindow,
    updatePosition,
    updateSize,
    isOpen,
    getApp,
    getFrontmostAppId,
  }), [windows, openWindow, closeWindow, focusWindow, minimizeWindow,
      maximizeWindow, restoreWindow, toggleWindow, snapWindow, updatePosition, updateSize, isOpen, getApp, getFrontmostAppId])

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
      <WindowLayer />
    </WindowManagerContext.Provider>
  )
}

function WindowLayer() {
  const ctx = useContext(WindowManagerContext)
  if (!ctx) return null

  const sorted = [...ctx.windows].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div className="gf-window-layer" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500 }}>
      {sorted.map(w => {
        const app = ctx.getApp(w.appId)
        if (!app) return null
        return (
          <AppWindow
            key={w.id}
            appDef={app}
            windowState={w}
            onClose={() => ctx.closeWindow(w.appId)}
            onFocus={() => ctx.focusWindow(w.appId)}
            onMinimize={() => ctx.minimizeWindow(w.appId)}
            onMaximize={() => ctx.maximizeWindow(w.appId)}
            onRestore={() => ctx.restoreWindow(w.appId)}
            onPositionChange={(pos) => ctx.updatePosition(w.appId, pos)}
            onSizeChange={(size) => ctx.updateSize(w.appId, size)}
          />
        )
      })}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWindowManager(): WindowManagerValue {
  const ctx = useContext(WindowManagerContext)
  if (!ctx) throw new Error('useWindowManager must be used within WindowManagerProvider')
  return ctx
}
