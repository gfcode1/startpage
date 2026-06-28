import { useState, useEffect, useMemo } from 'react'
import { Text, Group, Stack, Badge, Paper } from '@mantine/core'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'
import { WidgetEmpty } from '@/ui/widget-container'
import { useKanbanBoards, useActiveBoardId } from '@/stores/kanban-store'

export default function KanbanWidget() {
  const boards = useKanbanBoards()
  const activeBoardId = useActiveBoardId()

  const activeBoard = useMemo(
    () => boards.find((b) => b.id === activeBoardId),
    [boards, activeBoardId],
  )

  if (!activeBoard || activeBoard.columns.length === 0) {
    return (
      <Stack gap="xs">
        <Text size="xs" c="dimmed" ta="center">No board yet</Text>
        <WidgetEmpty>Create a board in Kanban</WidgetEmpty>
        <Text size="xs" c="dimmed" ta="center" component={Link} to="/kanban" style={{ textDecoration: 'none' }}>
          Open boards →
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap="sm">
      <Text size="xs" fw={500} ta="center" c="dimmed">{activeBoard.name}</Text>
      {activeBoard.columns.map((col) => (
        <ColumnSummary key={col.id} columnId={col.id} title={col.title} />
      ))}
      <Text
        size="xs"
        c="dimmed"
        ta="center"
        component={Link}
        to={`/kanban/${activeBoard.id}`}
        style={{ textDecoration: 'none' }}
      >
        Open board →
      </Text>
    </Stack>
  )
}

const _initTime = Date.now()

function ColumnSummary({ columnId, title }: { columnId: string; title: string }) {
  const boards = useKanbanBoards()
  const activeBoardId = useActiveBoardId()
  const [now, setNow] = useState(_initTime)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const cards = useMemo(() => {
    const board = boards.find((b) => b.id === activeBoardId)
    const column = board?.columns.find((c) => c.id === columnId)
    return column?.cards ?? []
  }, [boards, activeBoardId, columnId])

  const activeCards = useMemo(() => cards.filter((c) => !c.archived), [cards])
  const criticalCount = useMemo(() => activeCards.filter((c) => c.priority === 'critical').length, [activeCards])
  const overdueCount = useMemo(() => activeCards.filter((c) => c.dueDate !== null && c.dueDate < now).length, [activeCards, now])

  return (
    <Paper withBorder p="xs" radius="sm">
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" fw={500}>{title}</Text>
        <Group gap={4} wrap="nowrap">
          {criticalCount > 0 && (
            <Badge size="xs" color="red" variant="light">
              <Icon icon="lucide:alert-circle" width={10} style={{ verticalAlign: -1 }} /> {criticalCount}
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge size="xs" color="orange" variant="light">
              <Icon icon="lucide:clock" width={10} style={{ verticalAlign: -1 }} /> {overdueCount}
            </Badge>
          )}
          <Badge size="xs" variant="light">{activeCards.length}</Badge>
        </Group>
      </Group>
    </Paper>
  )
}
