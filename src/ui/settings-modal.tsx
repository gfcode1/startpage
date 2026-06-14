import { useState } from 'react'
import { Modal, Tabs, Stack, Group, Text, Button, Alert, Code, FileInput, useMantineColorScheme, Switch } from '@mantine/core'
import { Icon } from '@iconify/react'
import { APP_CONFIG } from '@/config/app'
import { useWidgetResetDefaults } from '@/stores/widget-store'
import { downloadBackup, uploadBackup } from '@/lib/persistence'

interface SettingsModalProps {
  opened: boolean
  onClose: () => void
}

export function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const resetDefaults = useWidgetResetDefaults()
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  return (
    <Modal opened={opened} onClose={onClose} title="Settings" size="md">
      <Tabs defaultValue="theme">
        <Tabs.List mb="md">
          <Tabs.Tab value="theme" leftSection={<Icon icon="lucide:palette" width={16} />}>Theme</Tabs.Tab>
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
