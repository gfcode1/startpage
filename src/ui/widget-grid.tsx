import { useState } from 'react'
import { SimpleGrid, Paper, Text, Group, ActionIcon, Box, Stack, ThemeIcon } from '@mantine/core'
import { useAutoAnimate } from '@formkit/auto-animate/react'

import { Icon } from '@iconify/react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useWidgetActiveWidgets, useWidgetRemoveWidget, useWidgetReorderWidgets } from '@/stores/widget-store'
import { widgets, type WidgetDefinition, type WidgetSize } from '@/registry/widgets'
import { WidgetPickerDialog } from './widget-picker-dialog'
import { WidgetContainer } from './widget-container'
import { WidgetSettingsPopover } from './widget-settings-popover'

function getWidgetSpan(size: WidgetSize): string {
  switch (size) {
    case 'large': return '1 / -1'
    case 'medium': return 'span 2'
    default: return 'span 1'
  }
}

function SortableWidget({ widget }: { widget: WidgetDefinition }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })
  const removeWidget = useWidgetRemoveWidget()
  const WidgetComponent = widget.component

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative' as const,
    gridColumn: getWidgetSpan(widget.size),
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      withBorder
      p="md"
      radius="md"
      bg="var(--mantine-color-body)"
    >
      <Group gap="xs" mb="xs" wrap="nowrap">
        <Box
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', minWidth: 24, minHeight: 24 }}
          c="dimmed"
        >
          <Icon icon="lucide:grip-vertical" width={16} />
        </Box>
        <Text size="sm" fw={600} style={{ flex: 1 }} truncate="end">
          {widget.name}
        </Text>
        {widget.options && widget.options.length > 0 && (
          <WidgetSettingsPopover widgetId={widget.id} options={widget.options}>
            <ActionIcon variant="subtle" size="sm" aria-label={`${widget.name} settings`}>
              <Icon icon="lucide:settings" width={14} />
            </ActionIcon>
          </WidgetSettingsPopover>
        )}
        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={() => removeWidget(widget.id)}
          aria-label={`Remove ${widget.name}`}
        >
          <Icon icon="lucide:x" width={14} />
        </ActionIcon>
      </Group>
      <WidgetContainer align={widget.align ?? 'left'}>
        <WidgetComponent />
      </WidgetContainer>
    </Paper>
  )
}


export function WidgetGrid() {
  const activeWidgets = useWidgetActiveWidgets()
  const reorderWidgets = useWidgetReorderWidgets()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [parent] = useAutoAnimate()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeWidgetDefs: WidgetDefinition[] = activeWidgets
    .map((id) => widgets.find((w: WidgetDefinition) => w.id === id))
    .filter((w): w is WidgetDefinition => w !== undefined)

  const activeDragWidget = activeDragId
    ? activeWidgetDefs.find((w) => w.id === activeDragId)
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = activeWidgets.indexOf(active.id as string)
    const newIndex = activeWidgets.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...activeWidgets]
    reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, active.id as string)
    reorderWidgets(reordered)
  }

  // Separate system widget (search) from the rest
  const systemWidgets = activeWidgetDefs.filter((w) => w.category === 'system')
  const standardWidgets = activeWidgetDefs.filter((w) => w.category !== 'system')

  return (
    <div ref={parent}>
      {systemWidgets.map((w) => {
        const W = w.component
        return (
          <Paper key={w.id} withBorder p="md" radius="md" mb="md" bg="var(--mantine-color-body)">
            {w.options && w.options.length > 0 && (
              <Group gap="xs" mb="xs" justify="flex-end">
                <WidgetSettingsPopover widgetId={w.id} options={w.options}>
                  <ActionIcon variant="subtle" size="sm" aria-label={`${w.name} settings`}>
                    <Icon icon="lucide:settings" width={14} />
                  </ActionIcon>
                </WidgetSettingsPopover>
              </Group>
            )}
            <WidgetContainer align={w.align ?? 'left'}>
              <W />
            </WidgetContainer>
          </Paper>
        )
      })}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={standardWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <SimpleGrid
            cols={{ base: 2, sm: 3, lg: 4 }}
            spacing="md"
          >
            {standardWidgets.length === 0 ? (
              <Stack align="center" gap="sm" style={{ gridColumn: '1 / -1', padding: '3rem 1rem' }}>
                <ThemeIcon variant="light" size={48} radius="xl">
                  <Icon icon="lucide:layout-dashboard" width={24} />
                </ThemeIcon>
                <Text c="dimmed" size="sm" ta="center">No widgets active yet</Text>
                <ActionIcon variant="light" size="lg" radius="xl" onClick={() => setPickerOpen(true)} aria-label="Add your first widget">
                  <Icon icon="lucide:plus" width={18} />
                </ActionIcon>
              </Stack>
            ) : (
              standardWidgets.map((w) => (
                <SortableWidget key={w.id} widget={w} />
              ))
            )}
          </SimpleGrid>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeDragWidget ? (
            <Paper
              withBorder
              p="md"
              radius="md"
              shadow="lg"
              bg="var(--mantine-color-body)"
              style={{
                gridColumn: getWidgetSpan(activeDragWidget.size),
                opacity: 0.92,
                cursor: 'grabbing',
              }}
            >
              <Group gap="xs" mb="xs" wrap="nowrap">
                <Box c="dimmed" style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon icon="lucide:grip-vertical" width={16} />
                </Box>
                <Text size="sm" fw={600} style={{ flex: 1 }} truncate="end">
                  {activeDragWidget.name}
                </Text>
              </Group>
            </Paper>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Group justify="center" mt="md">
        <ActionIcon variant="outline" size="lg" radius="xl" onClick={() => setPickerOpen(true)} aria-label="Add widget">
          <Icon icon="lucide:plus" width={18} />
        </ActionIcon>
      </Group>

      <WidgetPickerDialog opened={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  )
}
