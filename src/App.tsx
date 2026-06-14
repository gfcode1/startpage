import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Loader, Center } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { Spotlight, spotlight } from '@mantine/spotlight'
import { APP_CONFIG } from './config/app'
import { AppShellWrapper } from './layout/app-shell'
import { Launcher } from './pages/launcher'
import { NotFound } from './pages/not-found'
import { apps } from './registry/apps'

function AppInner() {
  const navigate = useNavigate()

  useHotkeys([['mod + K', spotlight.open]])

  const spotlightActions = apps.map((app) => ({
    id: app.id,
    label: app.name,
    description: app.description,
    onClick: () => navigate(app.path),
    leftSection: <Icon icon={app.icon} width={18} />,
  }))

  return (
    <>
      <Spotlight
        actions={[
          { group: 'Apps', actions: spotlightActions },
          {
            group: 'Navigation',
            actions: [
              { id: 'home', label: 'Go home', onClick: () => navigate('/'), leftSection: <Icon icon="lucide:home" width={18} /> },
            ],
          },
        ]}
        searchProps={{ placeholder: 'Search apps...' }}
        nothingFound="No results"
      />
      <AppShellWrapper>
        <Suspense fallback={<Center h="60vh"><Loader /></Center>}>
          <Routes>
            <Route path="/" element={<Launcher />} />
            {apps.map((app) => {
              const AppComponent = app.component
              return (
                <Route
                  key={app.id}
                  path={app.path.replace(/^\//, '')}
                  element={<AppComponent />}
                />
              )
            })}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppShellWrapper>
    </>
  )
}

function basename() {
  const base = APP_CONFIG.basePath
  return base.endsWith('/') ? base.slice(0, -1) : base
}

export function App() {
  return (
    <BrowserRouter basename={basename()}>
      <AppInner />
    </BrowserRouter>
  )
}
