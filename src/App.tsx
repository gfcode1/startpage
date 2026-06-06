import { Suspense, ReactNode, useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { flushSync } from 'react-dom'
import { GfThemeProvider } from './framework/ThemeProvider'
import { AppShell } from './framework/AppShell'
import { ErrorBoundary } from './framework/ErrorBoundary'
import { PlayerProvider } from './framework/PlayerContext'
import { ToastProvider } from './framework/ToastContext'
import { AppBadgeProvider } from './framework/AppBadgeContext'
import { apps } from './framework/appRegistry'
import { Launcher } from './apps/Launcher/Launcher'
import { SkeletonGrid } from './framework/components/Skeleton'
import { NotFound } from './apps/NotFound/NotFound'
import { CommandPalette } from './framework/components/CommandPalette'
import { useCommandPalette } from './framework/hooks/useCommandPalette'

function AppShellWrapper({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<SkeletonGrid count={6} />}>
        {children}
      </Suspense>
    </AppShell>
  )
}

function useViewTransitionLocation() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const prevLocKey = useRef(`${location.pathname}${location.search}`)

  useEffect(() => {
    const locKey = `${location.pathname}${location.search}`
    const displayKey = `${displayLocation.pathname}${displayLocation.search}`
    if (locKey === displayKey) return

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setDisplayLocation(location))
      })
    } else {
      requestAnimationFrame(() => {
        setDisplayLocation(location)
      })
    }

    prevLocKey.current = locKey
  }, [location, displayLocation.pathname, displayLocation.search])

  return displayLocation
}

function AnimatedRoutes() {
  const displayLocation = useViewTransitionLocation()

  return (
    <Routes location={displayLocation}>
      <Route path="/" element={
        <AppShell>
          <Launcher />
        </AppShell>
      } />
      {apps.map(app => (
        <Route key={app.id} path={app.path} element={
          <ErrorBoundary key={`eb-${app.id}`} appName={app.name}>
            <AppShellWrapper>
              <app.component />
            </AppShellWrapper>
          </ErrorBoundary>
        } />
      ))}
      <Route path="*" element={
        <AppShell>
          <NotFound />
        </AppShell>
      } />
    </Routes>
  )
}

export default function App() {
  const { open: cmdkOpen, close: cmdkClose } = useCommandPalette()

  return (
    <BrowserRouter basename="/startpage">
      <GfThemeProvider>
        <PlayerProvider>
        <ToastProvider>
        <ErrorBoundary>
        <AppBadgeProvider>
        <AnimatedRoutes />
        <CommandPalette open={cmdkOpen} onClose={cmdkClose} />
        </AppBadgeProvider>
        </ErrorBoundary>
        </ToastProvider>
        </PlayerProvider>
      </GfThemeProvider>
    </BrowserRouter>
  )
}
