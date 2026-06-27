import { useState, useEffect } from 'react'
import { Modal, Tabs, Stack, Group, Text, Button, Alert, Code, FileInput, useMantineColorScheme, Switch } from '@mantine/core'
import { Icon } from '@iconify/react'
import { APP_CONFIG } from '@/config/app'
import { useWidgetResetDefaults } from '@/stores/widget-store'
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
  const { updateSyncStatus, clearError } = useProfileStore()

  const [now, setNow] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (opened) clearError()
  }, [opened, clearError])

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
    if (!timestamp) return 'Never'
    const diff = now - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Settings" size="md">
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
                    if (ok) setTimeout(() => { setImportSuccess(null); onClose() }, 1500)
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
