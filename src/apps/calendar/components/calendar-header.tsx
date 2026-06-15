import { Group, Text, ActionIcon, Button, TextInput, SegmentedControl } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useCalendarStore, useCalendarView, useCalendarSearchQuery } from '../store'
import { MONTHS } from '../utils'

export function CalendarHeader() {
  const year = useCalendarStore((s) => s.year)
  const month = useCalendarStore((s) => s.month)
  const view = useCalendarView()
  const searchQuery = useCalendarSearchQuery()
  const navigateMonth = useCalendarStore((s) => s.navigateMonth)
  const setView = useCalendarStore((s) => s.setView)
  const setSearchQuery = useCalendarStore((s) => s.setSearchQuery)
  const goToToday = useCalendarStore((s) => s.goToToday)

  return (
    <Group justify="space-between" mb="md" wrap="wrap-reverse">
      <Group gap="xs">
        <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)', minWidth: 180 }}>
          {MONTHS[month]} {year}
        </Text>
        <ActionIcon variant="subtle" onClick={() => navigateMonth(-1)} aria-label="Previous month">
          <Icon icon="lucide:chevron-left" width={18} />
        </ActionIcon>
        <ActionIcon variant="subtle" onClick={() => navigateMonth(1)} aria-label="Next month">
          <Icon icon="lucide:chevron-right" width={18} />
        </ActionIcon>
        <Button variant="subtle" size="compact-sm" onClick={goToToday}>
          Today
        </Button>
      </Group>

      <Group gap="sm">
        <TextInput
          placeholder="Search events..."
          size="xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<Icon icon="lucide:search" width={14} />}
          w={180}
        />
        <SegmentedControl
          size="xs"
          value={view}
          onChange={(v) => setView(v as 'month' | 'week' | 'agenda')}
          data={[
            { value: 'month', label: 'Month' },
            { value: 'week', label: 'Week' },
            { value: 'agenda', label: 'Agenda' },
          ]}
        />
      </Group>
    </Group>
  )
}
