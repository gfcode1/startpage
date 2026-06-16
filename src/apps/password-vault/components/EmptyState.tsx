import { Center, Stack, Text, Button } from '@mantine/core'
import { Icon } from '@iconify/react'

interface EmptyStateProps {
  onAdd: () => void
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <Center py="xl">
      <Stack align="center" gap="sm">
        <Icon icon="lucide:key-round" width={48} color="var(--mantine-color-dimmed)" />
        <Text size="lg" fw={600}>No passwords yet</Text>
        <Text size="sm" c="dimmed">Add your first credential to get started</Text>
        <Button size="sm" leftSection={<Icon icon="lucide:plus" width={16} />} onClick={onAdd}>
          Add password
        </Button>
      </Stack>
    </Center>
  )
}
