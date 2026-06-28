import { Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Loader, Center } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { Spotlight, spotlight } from '@mantine/spotlight'
import { APP_CONFIG } from './config/app'
import { AppShellWrapper } from './layout/app-shell'
import { Launcher } from './pages/launcher'
import { NotFound } from './pages/not-found'
import { ProfileGate } from './ui/profile-gate'
import { apps } from './registry/apps'
import { useProfileStore, useIsReady, useIsUnlocked, useCloudEmail } from './stores/profile-store'
import { SyncService } from './lib/sync/sync-service'
import { SyncQueue } from './lib/sync/sync-queue'
import { showSyncNotification } from './lib/sync/notify'
import { CLOUD_CONFIG } from './config/cloud'

function AppInner() {
  const navigate = useNavigate()
  const checkCloudSession = useProfileStore((s) => s.checkCloudSession)
  const updateSyncStatus = useProfileStore((s) => s.updateSyncStatus)
  const isReady = useIsReady()
  const isUnlocked = useIsUnlocked()
  const cloudEmail = useCloudEmail()

  useEffect(() => {
    checkCloudSession()
  }, [checkCloudSession])

  useEffect(() => {
    if (!isUnlocked || !cloudEmail) return

    const svc = SyncService.getInstance()
    const doSync = async () => {
      try {
        const hadQueue = SyncQueue.hasPending()
        await svc.syncNow()
        updateSyncStatus(svc.lastSyncAt, svc.isSyncing, svc.lastError)

        if (svc.lastSyncAt && !svc.lastError) {
          if (hadQueue) {
            showSyncNotification('success', 'Sync complete', 'Offline changes synced')
          }
        }
      } catch {
        const err = svc.lastError
        updateSyncStatus(null, false, err)
        if (err) {
          showSyncNotification('error', 'Sync failed', err)
        }
      }
    }
    doSync()
    svc.start(CLOUD_CONFIG.syncInterval)

    return () => svc.stop()
  }, [isUnlocked, cloudEmail, updateSyncStatus])

  useHotkeys([['mod + K', spotlight.open]])

  const spotlightActions = apps.map((app) => ({
    id: app.id,
    label: app.name,
    description: app.description,
    onClick: () => navigate(app.path.replace(/\/:\w+\??$/, '')),
    leftSection: <Icon icon={app.icon} width={18} />,
  }))

  if (!isReady) {
    return <Center h="100vh"><Loader /></Center>
  }

  if (!isUnlocked) {
    return <ProfileGate />
  }

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
