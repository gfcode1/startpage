import { Modal, SimpleGrid, Paper, Text, Group } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useWidgetActiveWidgets, useWidgetAddWidget } from '@/stores/widget-store'
import { widgets } from '@/registry/widgets'

interface WidgetPickerDialogProps {
  opened: boolean
  onClose: () => void
}

export function WidgetPickerDialog({ opened, onClose }: WidgetPickerDialogProps) {
  const activeWidgets = useWidgetActiveWidgets()
  const addWidget = useWidgetAddWidget()

  const inactiveWidgets = widgets.filter((w) => !activeWidgets.includes(w.id) && w.category !== 'system')

  function handleAdd(id: string) {
    addWidget(id)
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add Widget" size="lg">
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
        {inactiveWidgets.map((widget) => (
          <Paper
            key={widget.id}
            withBorder
            p="sm"
            radius="md"
            style={{ cursor: 'pointer', textAlign: 'center' }}
            onClick={() => handleAdd(widget.id)}
          >
            <Group justify="center" mb="xs">
              <Icon icon={widget.icon} width={24} />
            </Group>
            <Text size="sm" fw={600}>{widget.name}</Text>
            <Text size="xs" c="dimmed">{widget.description}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      {inactiveWidgets.length === 0 && (
        <Text ta="center" c="dimmed" py="xl">All widgets are already active</Text>
      )}
    </Modal>
  )
}
