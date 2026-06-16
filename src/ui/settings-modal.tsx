import { useState, useEffect } from 'react'
import { Modal, Tabs, Stack, Group, Text, Button, Alert, Code, FileInput, TextInput, PasswordInput, useMantineColorScheme, Switch } from '@mantine/core'
import { Icon } from '@iconify/react'
import { APP_CONFIG } from '@/config/app'
import { useWidgetResetDefaults } from '@/stores/widget-store'
import { downloadBackup, uploadBackup } from '@/lib/persistence'
import { useProfileStore, useCloudLinked, useCloudEmail, useLastSyncAt, useIsSyncing, useSyncError } from '@/stores/profile-store'
import { SyncService } from '@/lib/sync/sync-service'

interface SettingsModalProps {
  opened: boolean
  onClose: () => void
}

export function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const resetDefaults = useWidgetResetDefaults()
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const cloudLinked = useCloudLinked()
  const cloudEmail = useCloudEmail()
  const lastSyncAt = useLastSyncAt()
  const isSyncing = useIsSyncing()
  const syncError = useSyncError()
  const { linkToCloud, unlinkFromCloud, updateSyncStatus } = useProfileStore()

  const [cloudEmailInput, setCloudEmailInput] = useState(cloudEmail ?? '')
  const [cloudPassword, setCloudPassword] = useState('')
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [cloudSuccess, setCloudSuccess] = useState<string | null>(null)
  const [unlinkConfirm, setUnlinkConfirm] = useState(false)
  const [now, setNow] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  async function handleCloudLogin() {
    setCloudError(null)
    setCloudLoading(true)
    try {
      await linkToCloud(cloudEmailInput, cloudPassword)
      setCloudSuccess('Cloud sync connected')
      setCloudPassword('')
      setTimeout(() => setCloudSuccess(null), 2000)
    } catch {
      setCloudError('Failed to connect. Check your credentials.')
    } finally {
      setCloudLoading(false)
    }
  }

  async function handleCloudSignup() {
    setCloudError(null)
    setCloudLoading(true)
    try {
      const svc = SyncService.getInstance()
      await svc.signup(cloudEmailInput, cloudPassword)
      await linkToCloud(cloudEmailInput, cloudPassword)
      setCloudSuccess('Account created and connected')
      setCloudPassword('')
      setTimeout(() => setCloudSuccess(null), 2000)
    } catch {
      setCloudError('Failed to create account. The email may already be in use.')
    } finally {
      setCloudLoading(false)
    }
  }

  async function handleSyncNow() {
    updateSyncStatus(null, true, null)
    try {
      const svc = SyncService.getInstance()
      await svc.syncNow()
      updateSyncStatus(Date.now(), false, svc.lastError)
    } catch {
      const svc = SyncService.getInstance()
      updateSyncStatus(null, false, svc.lastError)
    }
  }

  async function handleUnlink() {
    setUnlinkConfirm(false)
    await unlinkFromCloud()
    setCloudSuccess('Disconnected from cloud')
    setTimeout(() => setCloudSuccess(null), 2000)
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
          {cloudLinked ? (
            <Stack gap="md">
              <Alert color="green" variant="light" icon={<Icon icon="lucide:cloud" width={18} />}>
                <Text size="sm">Connected as <b>{cloudEmail}</b></Text>
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
                Your data is end-to-end encrypted before reaching the server.
                Automatic sync every 5 minutes.
              </Text>

              <Button
                variant="outline"
                color="red"
                fullWidth
                onClick={() => setUnlinkConfirm(true)}
              >
                Disconnect
              </Button>

              {unlinkConfirm && (
                <Alert color="red" variant="light">
                  <Text size="sm" mb="sm">Disconnect cloud sync? Your local data will be kept.</Text>
                  <Group gap="xs">
                    <Button size="compact-sm" color="red" onClick={handleUnlink}>Confirm</Button>
                    <Button size="compact-sm" variant="subtle" onClick={() => setUnlinkConfirm(false)}>Cancel</Button>
                  </Group>
                </Alert>
              )}
            </Stack>
          ) : (
            <Stack gap="md">
              <Text size="sm">
                Connect to cloud to sync your data across devices. Your data is
                encrypted end-to-end before leaving your device.
              </Text>

              <TextInput
                label="Email"
                placeholder="your@email.com"
                value={cloudEmailInput}
                onChange={(e) => setCloudEmailInput(e.currentTarget.value)}
              />

              <PasswordInput
                label="Profile password"
                placeholder="Your profile password"
                value={cloudPassword}
                onChange={(e) => setCloudPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCloudLogin()}
              />

              {cloudError && (
                <Alert color="red" variant="light" py="xs">{cloudError}</Alert>
              )}

              {cloudSuccess && (
                <Alert color="green" variant="light" py="xs">{cloudSuccess}</Alert>
              )}

              <Group grow>
                <Button onClick={handleCloudLogin} loading={cloudLoading}>
                  Sign in
                </Button>
                <Button variant="light" onClick={handleCloudSignup} loading={cloudLoading}>
                  Create account
                </Button>
              </Group>
            </Stack>
          )}
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
