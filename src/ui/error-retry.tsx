import { Alert, Text, Group, Button } from '@mantine/core'
import { Icon } from '@iconify/react'

interface ErrorRetryProps {
  message: string
  onRetry: () => void
}

export function ErrorRetry({ message, onRetry }: ErrorRetryProps) {
  return (
    <Alert color="red" variant="light" icon={<Icon icon="lucide:alert-circle" width={18} />}>
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm">{message}</Text>
        <Button
          variant="light"
          color="red"
          size="compact-xs"
          leftSection={<Icon icon="lucide:refresh-cw" width={12} />}
          onClick={onRetry}
        >
          Retry
        </Button>
      </Group>
    </Alert>
  )
}
