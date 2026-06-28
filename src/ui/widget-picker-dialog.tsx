import { Modal, SimpleGrid, Paper, Text, Group, UnstyledButton } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useWidgetActiveWidgets, useWidgetAddWidget } from '@/stores/widget-store'
import { widgets } from '@/registry/widgets'
import { useCallback } from 'react'

interface WidgetPickerDialogProps {
  opened: boolean
  onClose: () => void
}

export function WidgetPickerDialog({ opened, onClose }: WidgetPickerDialogProps) {
  const activeWidgets = useWidgetActiveWidgets()
  const addWidget = useWidgetAddWidget()

  const inactiveWidgets = widgets.filter((w) => !activeWidgets.includes(w.id) && w.category !== 'system')

  const handleAdd = useCallback((id: string) => {
    addWidget(id)
    onClose()
  }, [addWidget, onClose])

  return (
    <Modal opened={opened} onClose={onClose} title="Add Widget" size="lg">
      {inactiveWidgets.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
          {inactiveWidgets.map((widget) => (
            <UnstyledButton
              key={widget.id}
              onClick={() => handleAdd(widget.id)}
              style={{ width: '100%' }}
            >
              <Paper withBorder p="sm" radius="md" style={{ textAlign: 'center' }}>
                <Group justify="center" mb="xs">
                  <Icon icon={widget.icon} width={24} />
                </Group>
                <Text size="sm" fw={600}>{widget.name}</Text>
                <Text size="xs" c="dimmed">{widget.description}</Text>
              </Paper>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      )}

      {inactiveWidgets.length === 0 && (
        <Text ta="center" c="dimmed" py="xl">All widgets are already active</Text>
      )}
    </Modal>
  )
}
