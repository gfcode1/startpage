import { Group, Button, Tooltip, Menu, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import SearchBar from './SearchBar'
import ViewToggle from './ViewToggle'
import { useFilteredBookmarks, useCollections } from '../store'
import { exportAsJson, exportAsHtml } from '../utils'

interface ToolbarProps {
  onAddBookmark: () => void
  onAddCollection: () => void
  onImport: () => void
  onHelp: () => void
}

export default function Toolbar({ onAddBookmark, onAddCollection, onImport, onHelp }: ToolbarProps) {
  const bookmarks = useFilteredBookmarks()
  const collections = useCollections()

  const handleExportJson = () => {
    const json = exportAsJson({ bookmarks, collections })
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bookmarks.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportHtml = () => {
    const html = exportAsHtml({ bookmarks, collections })
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bookmarks.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Group justify="space-between" mb="md" wrap="nowrap">
      <SearchBar />
      <Group gap="xs" wrap="nowrap">
        <ViewToggle />
        <Tooltip label="Add bookmark (Alt+N)">
          <Button size="compact-sm" leftSection={<Icon icon="lucide:plus" width={14} />} onClick={onAddBookmark}>
            Add
          </Button>
        </Tooltip>
        <Tooltip label="New collection">
          <Button size="compact-sm" variant="subtle" leftSection={<Icon icon="lucide:folder-plus" width={14} />} onClick={onAddCollection}>
            Collection
          </Button>
        </Tooltip>
        <Menu shadow="md" withinPortal>
          <Menu.Target>
            <Button size="compact-sm" variant="subtle" leftSection={<Icon icon="lucide:upload" width={14} />}>
              Import/Export
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<Icon icon="lucide:file-input" width={14} />} onClick={onImport}>
              Import from browser
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<Icon icon="lucide:file-json" width={14} />} onClick={handleExportJson}>
              Export as JSON
            </Menu.Item>
            <Menu.Item leftSection={<Icon icon="lucide:file-type" width={14} />} onClick={handleExportHtml}>
              Export as HTML
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Tooltip label="Setup quick saving">
          <ActionIcon size="input-sm" variant="subtle" onClick={onHelp}>
            <Icon icon="lucide:help-circle" width={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  )
}
