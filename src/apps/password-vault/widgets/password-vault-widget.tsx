import { Stack, Group, Text, ActionIcon, CopyButton, Button } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useVaultRecentEntries } from '../store'
import { useNavigate } from 'react-router-dom'

export default function PasswordVaultWidget() {
  const entries = useVaultRecentEntries(4)
  const navigate = useNavigate()

  if (entries.length === 0) {
    return (
      <Stack align="center" gap="xs" py="md">
        <Icon icon="lucide:key-round" width={24} color="var(--mantine-color-dimmed)" />
        <Text size="xs" c="dimmed">No passwords yet</Text>
        <Button size="compact-xs" variant="light" onClick={() => navigate('/passwords')}>
          Open vault
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap="xs">
      {entries.map((entry) => (
        <Group key={entry.id} gap="sm" wrap="nowrap">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" align="center">
              <Text size="sm" fw={600} lineClamp={1}>{entry.name}</Text>
              {entry.favorite && <Icon icon="lucide:star" width={10} color="var(--mantine-color-yellow-5)" />}
            </Group>
            <Text size="xs" c="dimmed" lineClamp={1}>{entry.username}</Text>
          </div>
          <CopyButton value={entry.username}>
            {({ copied, copy }) => (
              <ActionIcon size="sm" variant="subtle" onClick={copy} title="Copy username">
                <Icon icon={copied ? 'lucide:check' : 'lucide:user'} width={14} />
              </ActionIcon>
            )}
          </CopyButton>
          <CopyButton value={entry.password}>
            {({ copied, copy }) => (
              <ActionIcon size="sm" variant="subtle" onClick={copy} title="Copy password">
                <Icon icon={copied ? 'lucide:check' : 'lucide:key-round'} width={14} />
              </ActionIcon>
            )}
          </CopyButton>
        </Group>
      ))}
      <Button size="compact-xs" variant="light" onClick={() => navigate('/passwords')} fullWidth>
        Open vault
      </Button>
    </Stack>
  )
}
