import { useState, useEffect, useCallback } from 'react'
import { Modal, Tabs, Stack, Group, Text, Button, Alert, Code, FileInput, useMantineColorScheme, Switch, Divider, SegmentedControl, ColorInput, TextInput, SimpleGrid, Center, Loader } from '@mantine/core'
import { Icon } from '@iconify/react'
import { APP_CONFIG } from '@/config/app'
import { useWidgetResetDefaults } from '@/stores/widget-store'
import { useBackgroundStore } from '@/stores/background-store'
import { useArticArtworks, getArticThumbnailUrl, getArticFullUrl } from '@/hooks/use-artic-api'
import { downloadBackup, uploadBackup, createAutoBackup, restoreAutoBackup, hasAutoBackup } from '@/lib/persistence'
import { useProfileStore, useCloudEmail, useLastSyncAt, useIsSyncing, useSyncError } from '@/stores/profile-store'
import { SyncService } from '@/lib/sync/sync-service'
import { showSyncNotification } from '@/lib/sync/notify'

interface SettingsModalProps {
  opened: boolean
  onClose: () => void
}

export function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const resetDefaults = useWidgetResetDefaults()
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [restoreSuccess, setRestoreSuccess] = useState<boolean | null>(null)
  const cloudEmail = useCloudEmail()
  const lastSyncAt = useLastSyncAt()
  const isSyncing = useIsSyncing()
  const syncError = useSyncError()
  const updateSyncStatus = useProfileStore((s) => s.updateSyncStatus)
  const clearError = useProfileStore((s) => s.clearError)

  const backgroundType = useBackgroundStore((s) => s.backgroundType)
  const backgroundColor = useBackgroundStore((s) => s.backgroundColor)
  const backgroundImage = useBackgroundStore((s) => s.backgroundImage)
  const articArtwork = useBackgroundStore((s) => s.articArtwork)
  const setBackgroundType = useBackgroundStore((s) => s.setBackgroundType)
  const setBackgroundColor = useBackgroundStore((s) => s.setBackgroundColor)
  const setBackgroundImage = useBackgroundStore((s) => s.setBackgroundImage)
  const setArticArtwork = useBackgroundStore((s) => s.setArticArtwork)

  const [articSearch, setArticSearch] = useState('')
  const [articDebounced, setArticDebounced] = useState('')
  const [articPage, setArticPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setArticDebounced(articSearch)
      setArticPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [articSearch])

  const articQuery = useArticArtworks(articDebounced, articPage)

  const selectArticArtwork = useCallback((artwork: { id: number; title: string; artist_display: string; image_id: string | null }) => {
    if (!artwork.image_id) return
    const fullUrl = getArticFullUrl(artwork.image_id)
    setBackgroundImage(fullUrl)
    setArticArtwork({
      id: artwork.id,
      title: artwork.title,
      artist: artwork.artist_display,
      imageId: artwork.image_id,
    })
  }, [setBackgroundImage, setArticArtwork])

  const [now, setNow] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (opened) {
      clearError()
    }
  }, [opened, clearError])

  const handleClose = () => {
    setResetConfirm(false)
    setImportSuccess(null)
    setRestoreSuccess(null)
    onClose()
  }

  async function handleSyncNow() {
    const svc = SyncService.getInstance()
    const prevSyncAt = svc.lastSyncAt
    updateSyncStatus(prevSyncAt, true, null)
    try {
      await svc.syncNow()
      updateSyncStatus(Date.now(), false, svc.lastError)
      if (!svc.lastError) {
        showSyncNotification('success', 'Sync complete')
      } else {
        showSyncNotification('error', 'Sync failed', svc.lastError)
      }
    } catch {
      const svc = SyncService.getInstance()
      updateSyncStatus(prevSyncAt, false, svc.lastError)
      showSyncNotification('error', 'Sync failed', svc.lastError ?? 'Unknown error')
    }
  }

  function formatLastSync(timestamp: number | null): string {
    if (timestamp === null || timestamp === undefined) return 'Never'
    const diff = now - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Settings" size="md">
      <Tabs defaultValue="theme">
        <Tabs.List mb="md">
          <Tabs.Tab value="theme" leftSection={<Icon icon="lucide:palette" width={16} />}>Theme</Tabs.Tab>
          <Tabs.Tab value="cloud" leftSection={<Icon icon="lucide:cloud" width={16} />}>Cloud Sync</Tabs.Tab>
          <Tabs.Tab value="backup" leftSection={<Icon icon="lucide:database" width={16} />}>Backup</Tabs.Tab>
          <Tabs.Tab value="info" leftSection={<Icon icon="lucide:info" width={16} />}>Info</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="theme">
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>Dark mode</Text>
                <Text size="xs" c="dimmed">Toggle between dark and light theme</Text>
              </div>
              <Switch
                checked={colorScheme === 'dark'}
                onChange={toggleColorScheme}
                aria-label="Toggle dark mode"
              />
            </Group>

            <Divider />

            <div>
              <Text size="sm" fw={500} mb="xs">Background</Text>

              <SegmentedControl
                fullWidth
                size="xs"
                data={[
                  { value: 'none', label: 'None' },
                  { value: 'solid', label: 'Color' },
                  { value: 'image', label: 'Image' },
                ]}
                value={backgroundType}
                onChange={(value) => setBackgroundType(value as 'none' | 'solid' | 'image')}
                mb="sm"
              />

              {backgroundType === 'solid' && (
                <ColorInput
                  value={backgroundColor}
                  onChange={(value) => setBackgroundColor(value)}
                  format="hex"
                  swatches={['#241d1a', '#1a1412', '#3a3028', '#2d4a3e', '#2a3a4a', '#4a2a3a', '#3a2a2a', '#2a3a3a']}
                  mb="sm"
                />
              )}

              {backgroundType === 'image' && (
                <>
                  <TextInput
                    placeholder="Enter image URL or browse below..."
                    value={backgroundImage}
                    onChange={(e) => {
                      setBackgroundImage(e.target.value)
                      if (articArtwork) setArticArtwork(null)
                    }}
                    mb="sm"
                  />

                  <Divider label="Browse Art Institute of Chicago" labelPosition="center" mb="sm" />

                  <TextInput
                    placeholder="Search artworks..."
                    leftSection={<Icon icon="lucide:search" width={16} />}
                    value={articSearch}
                    onChange={(e) => setArticSearch(e.target.value)}
                    mb="sm"
                  />

                  {articQuery.isLoading && (
                    <Center py="sm"><Loader size="sm" /></Center>
                  )}

                  {articQuery.data && articQuery.data.data.length > 0 && (
                    <>
                      <SimpleGrid cols={4} spacing="sm" mb="sm">
                        {articQuery.data.data.map((artwork) => {
                          if (!artwork.image_id) return null
                          const thumbUrl = getArticThumbnailUrl(artwork.image_id)
                          return (
                            <div
                              key={artwork.id}
                              onClick={() => selectArticArtwork(artwork)}
                              style={{
                                cursor: 'pointer',
                                borderRadius: 4,
                                overflow: 'hidden',
                                height: 80,
                                backgroundImage: `url(${thumbUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: articArtwork?.imageId === artwork.image_id
                                  ? '2px solid var(--mantine-color-accent-5)'
                                  : '2px solid transparent',
                              }}
                            />
                          )
                        })}
                      </SimpleGrid>

                      {articQuery.data.pagination.current_page < articQuery.data.pagination.total_pages && (
                        <Button
                          variant="light"
                          size="compact-sm"
                          fullWidth
                          onClick={() => setArticPage((p) => p + 1)}
                          loading={articQuery.isFetching}
                        >
                          Load more
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}

              {backgroundType !== 'none' && (
                <div
                  style={{
                    height: 60,
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginTop: 8,
                    backgroundImage: backgroundType === 'image' && backgroundImage ? `url(${backgroundImage})` : undefined,
                    backgroundColor: backgroundType === 'solid' ? backgroundColor : backgroundType === 'image' && !backgroundImage ? 'var(--mantine-color-dark-5)' : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {articArtwork && (
                <Text size="xs" c="dimmed" mt={4} lineClamp={1}>
                  {articArtwork.title} — {articArtwork.artist}
                </Text>
              )}
            </div>

            <Divider />

            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>Reset widgets</Text>
                <Text size="xs" c="dimmed">Restore widget layout to defaults</Text>
              </div>
              <Button
                size="compact-sm"
                variant="light"
                color={resetConfirm ? 'red' : 'gray'}
                onClick={() => {
                  if (resetConfirm) { resetDefaults(); setResetConfirm(false) }
                  else setResetConfirm(true)
                }}
              >
                {resetConfirm ? 'Confirm?' : 'Reset'}
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="cloud">
          <Stack gap="md">
            {cloudEmail ? (
              <>
                <Alert color="green" variant="light" icon={<Icon icon="lucide:cloud" width={18} />}>
                  <Text size="sm">Synced as <b>{cloudEmail}</b></Text>
                </Alert>

                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Last sync</Text>
                    <Text size="xs" c="dimmed">{formatLastSync(lastSyncAt)}</Text>
                  </div>
                  <Button
                    size="compact-sm"
                    variant="light"
                    leftSection={<Icon icon="lucide:refresh-cw" width={14} />}
                    onClick={handleSyncNow}
                    loading={isSyncing}
                  >
                    Sync now
                  </Button>
                </Group>

                {syncError && (
                  <Alert color="red" variant="light" icon={<Icon icon="lucide:alert-circle" width={18} />}>
                    <Text size="sm">{syncError}</Text>
                  </Alert>
                )}

                <Text size="xs" c="dimmed">
                  Your data is end-to-end encrypted with your profile password.
                  Automatic sync every 5 minutes.
                </Text>
              </>
            ) : (
              <Alert color="blue" variant="light" icon={<Icon icon="lucide:cloud" width={18} />}>
                <Text size="sm">No profile unlocked. Cloud sync status unavailable.</Text>
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="backup">
          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} mb="xs">Export backup</Text>
              <Text size="xs" c="dimmed" mb="sm">Download all app data as JSON file</Text>
              <Button
                variant="light"
                leftSection={<Icon icon="lucide:download" width={16} />}
                onClick={downloadBackup}
                fullWidth
              >
                Download backup
              </Button>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">Import backup</Text>
              <Text size="xs" c="dimmed" mb="sm">Restore data from a previous backup file</Text>
              <FileInput
                accept=".json"
                placeholder="Select backup file..."
                onChange={(file) => {
                  if (!file) return
                  createAutoBackup()
                  uploadBackup(file).then((ok) => {
                    setImportSuccess(ok)
                    if (ok) setTimeout(() => { setImportSuccess(null); handleClose() }, 1500)
                  })
                }}
                clearable
              />
              {importSuccess === true && (
                <Alert color="green" mt="sm" py="xs">Backup restored successfully!</Alert>
              )}
              {importSuccess === false && (
                <Alert color="red" mt="sm" py="xs">Invalid backup file.</Alert>
              )}
            </div>

            {hasAutoBackup() && (
              <div>
                <Text size="sm" fw={500} mb="xs">Restore auto-backup</Text>
                <Text size="xs" c="dimmed" mb="sm">Revert to snapshot taken before last sync or import</Text>
                <Button
                  variant="light"
                  color="yellow"
                  leftSection={<Icon icon="lucide:undo-2" width={16} />}
                  onClick={() => {
                    const ok = restoreAutoBackup()
                    setRestoreSuccess(ok)
                    if (ok) setTimeout(() => { setRestoreSuccess(null) }, 2000)
                  }}
                  fullWidth
                >
                  Restore snapshot
                </Button>
                {restoreSuccess === true && (
                  <Alert color="green" mt="sm" py="xs">Auto-backup restored!</Alert>
                )}
                {restoreSuccess === false && (
                  <Alert color="red" mt="sm" py="xs">No snapshot available.</Alert>
                )}
              </div>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="info">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm">App</Text>
              <Text size="sm" fw={500}>{APP_CONFIG.name}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm">Version</Text>
              <Text size="sm" fw={500}>{APP_CONFIG.version}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm">Base path</Text>
              <Code>{APP_CONFIG.basePath}</Code>
            </Group>
            <Text size="xs" c="dimmed" mt="md">
              StartDeck is a customizable startpage with apps, widgets, and tools.
            </Text>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
