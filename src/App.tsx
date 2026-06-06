import { Suspense, ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GfThemeProvider } from './framework/ThemeProvider'
import { AppShell } from './framework/AppShell'
import { ErrorBoundary } from './framework/ErrorBoundary'
import { PlayerProvider } from './framework/PlayerContext'
import { ToastProvider } from './framework/ToastContext'
import { apps } from './framework/appRegistry'
import { Launcher } from './apps/Launcher/Launcher'
import { SkeletonGrid } from './framework/components/Skeleton'
import { NotFound } from './apps/NotFound/NotFound'

function AppShellWrapper({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<SkeletonGrid count={6} />}>
        {children}
      </Suspense>
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/startpage">
      <GfThemeProvider>
        <PlayerProvider>
        <ToastProvider>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={
            <AppShell>
              <Launcher />
            </AppShell>
          } />
          {apps.map(app => (
            <Route key={app.id} path={app.path} element={
              <AppShellWrapper>
                <app.component />
              </AppShellWrapper>
            } />
          ))}
          <Route path="*" element={
            <AppShell>
              <NotFound />
            </AppShell>
          } />
        </Routes>
        </ErrorBoundary>
        </ToastProvider>
        </PlayerProvider>
      </GfThemeProvider>
    </BrowserRouter>
  )
}
