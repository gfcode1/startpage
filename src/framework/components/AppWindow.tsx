import { Suspense, useEffect } from 'react'
import { FloatingWindow } from './FloatingWindow'
import { ErrorBoundary } from '../ErrorBoundary'
import { TopbarProvider, useTopbar } from '../TopbarContext'
import type { AppDef } from '../appRegistry'

interface Position { x: number; y: number }
interface Size { width: number; height: number }

export type WinState = 'normal' | 'minimized' | 'maximized'

export interface OpenWindow {
  id: string
  appId: string
  state: WinState
  position: Position
  size: Size
  zIndex: number
}

interface AppWindowProps {
  appDef: AppDef
  windowState: OpenWindow
  onClose: () => void
  onFocus: () => void
  onMinimize: () => void
  onMaximize: () => void
  onRestore: () => void
  onPositionChange: (pos: Position) => void
  onSizeChange: (size: Size) => void
}

function AppWindowInner({ appDef, windowState, onClose, onFocus, onMinimize, onMaximize, onRestore, onPositionChange, onSizeChange }: AppWindowProps) {
  const { actions, search, customSearch, clearConfig } = useTopbar()

  useEffect(() => {
    return () => clearConfig()
  }, [clearConfig])

  const Component = appDef.component

  return (
    <FloatingWindow
      open
      onClose={onClose}
      onFocus={onFocus}
      title={appDef.name}
      titlebarActions={actions}
      titlebarSearch={search}
      titlebarCustomSearch={customSearch}
      zIndex={windowState.zIndex}
      state={windowState.state}
      onStateChange={(s) => {
        if (s === 'minimized') onMinimize()
        else if (s === 'maximized') onMaximize()
        else onRestore()
      }}
      controlledPosition={windowState.position}
      controlledSize={windowState.size}
      onPositionChange={onPositionChange}
      onSizeChange={onSizeChange}
      accentGradient={appDef.gradient}
      accentColor={appDef.color}
    >
      <ErrorBoundary appName={appDef.name}>
        <Suspense fallback={<div className="gf-appwindow-loading" />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    </FloatingWindow>
  )
}

export function AppWindow(props: AppWindowProps) {
  return (
    <TopbarProvider>
      <AppWindowInner {...props} />
    </TopbarProvider>
  )
}
