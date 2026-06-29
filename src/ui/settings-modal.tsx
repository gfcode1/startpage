import { useState, useEffect, useCallback, useMemo } from 'react'
import { Drawer, Tabs, Stack, Group, Text, Button, Alert, Code, FileInput, useMantineColorScheme, Switch, Divider, SegmentedControl, ColorInput, SimpleGrid, Card, ThemeIcon, Skeleton } from '@mantine/core'
import { Icon } from '@iconify/react'
import { APP_CONFIG } from '@/config/app'
import { useWidgetResetDefaults } from '@/stores/widget-store'
import { useBackgroundStore } from '@/stores/background-store'
import { resizeImage } from '@/lib/resize-image'
import { downloadBackup, uploadBackup, createAutoBackup, restoreAutoBackup, hasAutoBackup } from '@/lib/persistence'
import { useProfileStore, useCloudEmail, useLastSyncAt, useIsSyncing, useSyncError } from '@/stores/profile-store'
import { SyncService } from '@/lib/sync/sync-service'
import { showSyncNotification } from '@/lib/sync/notify'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_WIDTH = 1920
const JPEG_QUALITY = 0.85
const PICSUM_PER_PAGE = 20

function makeSeed(): string {
  return `sd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function makeInitialSeeds(): string[] {
  return Array.from({ length: PICSUM_PER_PAGE }, () => makeSeed())
}

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
  const picsumSeed = useBackgroundStore((s) => s.picsumSeed)
  const setBackgroundType = useBackgroundStore((s) => s.setBackgroundType)
  const setBackgroundColor = useBackgroundStore((s) => s.setBackgroundColor)
  const setBackgroundImage = useBackgroundStore((s) => s.setBackgroundImage)
  const setPicsumSeed = useBackgroundStore((s) => s.setPicsumSeed)

  const [uploadError, setUploadError] = useState<string | null>(null)
  const [picsumSeeds, setPicsumSeeds] = useState<string[]>(makeInitialSeeds)
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
    setUploadError(null)
    onClose()
  }

  const handleFileUpload = useCallback(async (file: File | null) => {
    setUploadError(null)
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File is too large. Maximum size is 5 MB.')
      return
    }
    try {
      const dataUrl = await resizeImage(file, MAX_IMAGE_WIDTH, JPEG_QUALITY)
      setBackgroundImage(dataUrl)
      setPicsumSeed(null)
    } catch {
      setUploadError('Failed to process image. Please try another file.')
    }
  }, [setBackgroundImage, setPicsumSeed])

  const selectPicsumImage = useCallback((seed: string) => {
    setBackgroundImage(`https://picsum.photos/seed/${seed}/1920/1080`)
    setPicsumSeed(seed)
  }, [setBackgroundImage, setPicsumSeed])

  const loadMoreSeeds = useCallback(() => {
    setPicsumSeeds((prev) => [...prev, ...Array.from({ length: PICSUM_PER_PAGE }, () => makeSeed())])
  }, [])

  const refreshSeeds = useCallback(() => {
    setPicsumSeeds(makeInitialSeeds())
  }, [])

  const handlePicsumScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 40) {
      loadMoreSeeds()
    }
  }, [loadMoreSeeds])

  const preview = useMemo(() => (
    <div
      style={{
        height: 48,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundImage: backgroundType === 'image' && backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundColor: backgroundType === 'solid'
          ? backgroundColor
          : backgroundType === 'image' && !backgroundImage
            ? 'var(--mantine-color-dark-5)'
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  ), [backgroundType, backgroundColor, backgroundImage])

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
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="right"
      size="lg"
      title={
        <Group gap="sm">
          <Icon icon="lucide:settings" width={20} />
          <Text fw={600} fz="md">Settings</Text>
        </Group>
      }
      closeButtonProps={{ 'aria-label': 'Close settings' }}
    >
      <Tabs defaultValue="appearance" orientation="vertical" style={{ display: 'flex', gap: 0 }}>
        <Tabs.List style={{ minWidth: 160 }}>
          <Tabs.Tab value="appearance" leftSection={<Icon icon="lucide:palette" width={16} />}>
            Appearance
          </Tabs.Tab>
          <Tabs.Tab value="background" leftSection={<Icon icon="lucide:image" width={16} />}>
            Background
          </Tabs.Tab>
          <Tabs.Tab value="cloud" leftSection={<Icon icon="lucide:cloud" width={16} />}>
            Cloud Sync
          </Tabs.Tab>
          <Tabs.Tab value="backup" leftSection={<Icon icon="lucide:database" width={16} />}>
            Backup
          </Tabs.Tab>
          <Tabs.Tab value="info" leftSection={<Icon icon="lucide:info" width={16} />}>
            Info
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="appearance" pl="md" style={{ flex: 1, minWidth: 0 }} className="settings-tab-panel">
          <Stack gap="md">
            <Card withBorder padding="md">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={500}>Dark mode</Text>
                  <Text size="xs" c="dimmed" mt={2}>Toggle between dark and light theme</Text>
                </div>
                <Switch
                  checked={colorScheme === 'dark'}
                  onChange={toggleColorScheme}
                  aria-label="Toggle dark mode"
                  size="md"
                />
              </Group>
            </Card>

            <Divider label="Danger Zone" labelPosition="center" color="red" />

            <Card withBorder padding="md" style={{ borderColor: 'var(--mantine-color-red-3)' }}>
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={500}>Reset widgets</Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    Restore all widget positions and sizes to their default layout. This action cannot be undone.
                  </Text>
                </div>
                <Button
                  size="compact-sm"
                  variant={resetConfirm ? 'filled' : 'light'}
                  color="red"
                  onClick={() => {
                    if (resetConfirm) { resetDefaults(); setResetConfirm(false) }
                    else setResetConfirm(true)
                  }}
                >
                  {resetConfirm ? 'Confirm reset?' : 'Reset'}
                </Button>
              </Group>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="background" pl="md" style={{ flex: 1, minWidth: 0 }} className="settings-tab-panel">
          <Stack gap="md">
            <Card withBorder padding="md">
              <Text size="sm" fw={500} mb="sm">Background type</Text>
              <SegmentedControl
                fullWidth
                size="sm"
                data={[
                  { value: 'none', label: 'None' },
                  { value: 'solid', label: 'Color' },
                  { value: 'image', label: 'Image' },
                ]}
                value={backgroundType}
                onChange={(value) => setBackgroundType(value as 'none' | 'solid' | 'image')}
              />
            </Card>

            {backgroundType === 'solid' && (
              <Card withBorder padding="md">
                <Text size="sm" fw={500} mb="sm">Choose color</Text>
                <ColorInput
                  value={backgroundColor}
                  onChange={(value) => setBackgroundColor(value)}
                  format="hex"
                  swatches={['#241d1a', '#1a1412', '#3a3028', '#2d4a3e', '#2a3a4a', '#4a2a3a', '#3a2a2a', '#2a3a3a']}
                />
              </Card>
            )}

            {backgroundType === 'image' && (
              <>
                <Card withBorder padding="md">
                  <Text size="sm" fw={500} mb="xs">Upload custom image</Text>
                  <FileInput
                    accept="image/*"
                    placeholder="Choose an image..."
                    onChange={handleFileUpload}
                    clearable
                  />
                  <Text size="xs" c="dimmed" mt={4}>JPEG/PNG, max 5 MB. Images are resized to 1920px width.</Text>
                  {uploadError && (
                    <Alert color="red" mt="sm" py="xs" icon={<Icon icon="lucide:alert-circle" width={16} />}>
                      <Text size="xs">{uploadError}</Text>
                    </Alert>
                  )}
                </Card>

                <Card withBorder padding="md">
                  <Group justify="space-between" mb="sm">
                    <Text size="sm" fw={500}>Picsum gallery</Text>
                    <Button
                      variant="light"
                      size="compact-xs"
                      leftSection={<Icon icon="lucide:refresh-cw" width={12} />}
                      onClick={refreshSeeds}
                    >
                      Refresh
                    </Button>
                  </Group>
                  <div
                    onScroll={handlePicsumScroll}
                    style={{ maxHeight: 280, overflowY: 'auto' }}
                  >
                    <SimpleGrid cols={4} spacing="sm">
                      {picsumSeeds.map((seed) => {
                        const thumbUrl = `https://picsum.photos/seed/${seed}/200/200`
                        const isSelected = picsumSeed === seed
                        return (
                          <div
                            key={seed}
                            onClick={() => selectPicsumImage(seed)}
                            style={{
                              cursor: 'pointer',
                              borderRadius: 4,
                              overflow: 'hidden',
                              height: 80,
                              position: 'relative',
                              border: isSelected
                                ? '2px solid var(--mantine-color-accent-5)'
                                : '2px solid transparent',
                              transition: 'border-color 150ms ease',
                            }}
                          >
                            <Skeleton height={80} radius={0} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
                            <img
                              src={thumbUrl}
                              alt=""
                              loading="lazy"
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                zIndex: 1,
                              }}
                            />
                          </div>
                        )
                      })}
                    </SimpleGrid>
                  </div>
                </Card>
              </>
            )}

            {backgroundType !== 'none' && (
              <Card withBorder padding="md">
                <Text size="xs" c="dimmed" mb="xs">Preview</Text>
                {preview}
                {picsumSeed && (
                  <Text size="xs" c="dimmed" mt="xs">
                    Picsum photo — seed: {picsumSeed}
                  </Text>
                )}
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="cloud" pl="md" style={{ flex: 1, minWidth: 0 }} className="settings-tab-panel">
          <Stack gap="md">
            {cloudEmail ? (
              <>
                <Card withBorder padding="md">
                  <Group gap="sm">
                    <ThemeIcon variant="light" color="green" radius="md" size="lg">
                      <Icon icon="lucide:check-circle" width={18} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm">Synced as <b>{cloudEmail}</b></Text>
                      <Text size="xs" c="dimmed">Profile unlocked</Text>
                    </div>
                  </Group>
                </Card>

                <Card withBorder padding="md">
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <div>
                      <Text size="sm" fw={500}>Last sync</Text>
                      <Text size="xs" c="dimmed" mt={2}>{formatLastSync(lastSyncAt)}</Text>
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
                    <Alert color="red" variant="light" mt="md" icon={<Icon icon="lucide:alert-circle" width={18} />}>
                      <Text size="sm">{syncError}</Text>
                    </Alert>
                  )}
                </Card>

                <Card withBorder padding="md">
                  <Group gap="sm">
                    <ThemeIcon variant="light" color="blue" radius="md" size="md">
                      <Icon icon="lucide:shield-check" width={14} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed">
                      Your data is end-to-end encrypted with your profile password.
                      Automatic sync every 5 minutes.
                    </Text>
                  </Group>
                </Card>
              </>
            ) : (
              <Card withBorder padding="md">
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" radius="md" size="lg">
                    <Icon icon="lucide:cloud-off" width={18} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm">No profile unlocked</Text>
                    <Text size="xs" c="dimmed" mt={2}>Cloud sync status is unavailable until you unlock a profile.</Text>
                  </div>
                </Group>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="backup" pl="md" style={{ flex: 1, minWidth: 0 }} className="settings-tab-panel">
          <Stack gap="md">
            <Card withBorder padding="md">
              <Group gap="sm" mb="sm">
                <ThemeIcon variant="light" color="violet" radius="md" size="md">
                  <Icon icon="lucide:download" width={14} />
                </ThemeIcon>
                <Text size="sm" fw={500}>Export backup</Text>
              </Group>
              <Text size="xs" c="dimmed" mb="md">Download all app data as a single JSON file</Text>
              <Button
                variant="light"
                leftSection={<Icon icon="lucide:download" width={16} />}
                onClick={downloadBackup}
                fullWidth
              >
                Download backup
              </Button>
            </Card>

            <Card withBorder padding="md">
              <Group gap="sm" mb="sm">
                <ThemeIcon variant="light" color="teal" radius="md" size="md">
                  <Icon icon="lucide:upload" width={14} />
                </ThemeIcon>
                <Text size="sm" fw={500}>Import backup</Text>
              </Group>
              <Text size="xs" c="dimmed" mb="md">Restore data from a previously exported backup file</Text>
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
                <Alert color="green" mt="sm" py="xs" icon={<Icon icon="lucide:check-circle" width={16} />}>
                  Backup restored successfully!
                </Alert>
              )}
              {importSuccess === false && (
                <Alert color="red" mt="sm" py="xs" icon={<Icon icon="lucide:alert-circle" width={16} />}>
                  Invalid backup file.
                </Alert>
              )}
            </Card>

            {hasAutoBackup() && (
              <Card withBorder padding="md" style={{ borderColor: 'var(--mantine-color-yellow-5)' }}>
                <Group gap="sm" mb="sm">
                  <ThemeIcon variant="light" color="yellow" radius="md" size="md">
                    <Icon icon="lucide:undo-2" width={14} />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>Restore auto-backup</Text>
                </Group>
                <Text size="xs" c="dimmed" mb="md">
                  Revert to a snapshot taken automatically before your last sync or import
                </Text>
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
                  <Alert color="green" mt="sm" py="xs" icon={<Icon icon="lucide:check-circle" width={16} />}>
                    Auto-backup restored!
                  </Alert>
                )}
                {restoreSuccess === false && (
                  <Alert color="red" mt="sm" py="xs" icon={<Icon icon="lucide:alert-circle" width={16} />}>
                    No snapshot available.
                  </Alert>
                )}
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="info" pl="md" style={{ flex: 1, minWidth: 0 }} className="settings-tab-panel">
          <Stack gap="md">
            <Card withBorder padding="md">
              <Group gap="md" mb="md">
                <ThemeIcon variant="gradient" radius="md" size="xl"
                  gradient={{ from: 'amber', to: 'orange', deg: 135 }}>
                  <Icon icon="lucide:layers" width={22} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
                    {APP_CONFIG.name}
                  </Text>
                  <Text size="sm" c="dimmed">v{APP_CONFIG.version}</Text>
                </div>
              </Group>
              <Divider mb="md" />
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Base path</Text>
                <Code>{APP_CONFIG.basePath}</Code>
              </Group>
              <Text size="xs" c="dimmed" mt="md">
                StartDeck is a customizable startpage with apps, widgets, and tools.
              </Text>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Drawer>
  )
}
