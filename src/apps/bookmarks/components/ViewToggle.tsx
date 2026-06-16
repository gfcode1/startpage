import { SegmentedControl } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useViewMode, useSetViewMode } from '../store'
import type { ViewMode } from '../types'

export default function ViewToggle() {
  const viewMode = useViewMode()
  const setViewMode = useSetViewMode()

  return (
    <SegmentedControl
      value={viewMode}
      onChange={(v) => setViewMode(v as ViewMode)}
      size="xs"
      data={[
        { value: 'grid', label: <Icon icon="lucide:grid-3x3" width={14} /> },
        { value: 'list', label: <Icon icon="lucide:list" width={14} /> },
      ]}
    />
  )
}
