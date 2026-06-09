import { Suspense, ReactNode, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { flushSync } from 'react-dom'
import { GfThemeProvider } from './framework/ThemeProvider'
import { AppShell } from './framework/AppShell'
import { ErrorBoundary } from './framework/ErrorBoundary'
import { PlayerProvider } from './framework/PlayerContext'
import { ToastProvider } from './framework/ToastContext'
import { AppBadgeProvider } from './framework/AppBadgeContext'
import { AuthProvider, useAuth } from './framework/auth/AuthContext'
import { SyncProvider } from './framework/sync/SyncContext'
import { LoginPage } from './framework/auth/LoginPage'
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  return displayLocation
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="gf-login" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gf-bg)' }}>
        <div style={{ color: 'var(--gf-text-muted)' }}>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <>{children}</>
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

function AppInner() {
  const { open: cmdkOpen, close: cmdkClose } = useCommandPalette()

  return (
    <AuthGate>
      <SyncProvider>
        <AnimatedRoutes />
        <CommandPalette open={cmdkOpen} onClose={cmdkClose} />
      </SyncProvider>
    </AuthGate>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/startpage">
      <GfThemeProvider>
        <PlayerProvider>
        <ToastProvider>
        <ErrorBoundary>
        <AppBadgeProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
        </AppBadgeProvider>
        </ErrorBoundary>
        </ToastProvider>
        </PlayerProvider>
      </GfThemeProvider>
    </BrowserRouter>
  )
}
