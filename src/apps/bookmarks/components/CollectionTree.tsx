import { useMemo, useCallback } from 'react'
import { Group, Text, ActionIcon, Menu, Tree, useTree, type TreeNodeData, type RenderTreeNodePayload } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useCollections, useSelectedCollectionId, useSetSelectedCollectionId, useDeleteCollection, useRenameCollection, useAddCollection } from '../store'
import type { Collection } from '../types'

function buildTreeData(collections: Collection[], parentId: string | null): TreeNodeData[] {
  return collections
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      value: c.id,
      label: c.name,
      children: buildTreeData(collections, c.id),
    }))
}

export default function CollectionTree() {
  const collections = useCollections()
  const selectedId = useSelectedCollectionId()
  const setSelectedId = useSetSelectedCollectionId()
  const deleteCollection = useDeleteCollection()
  const renameCollection = useRenameCollection()
  const addCollection = useAddCollection()

  const rootData = useMemo(() => buildTreeData(collections, null), [collections])

  const tree = useTree()

  const handleNodeClick = useCallback((value: string) => {
    const collection = collections.find((c) => c.id === value)
    if (collection) {
      tree.toggleExpanded(value)
      setSelectedId(value)
    }
  }, [collections, tree, setSelectedId])

  const renderNode = ({ node, expanded, hasChildren, elementProps }: RenderTreeNodePayload) => {
    const isSelected = node.value === selectedId

    const icon = hasChildren ? (expanded ? 'lucide:folder-open' : 'lucide:folder') : 'lucide:file'

    return (
      <Group
        gap={4}
        py={2}
        px={6}
        {...elementProps}
        onClick={() => handleNodeClick(node.value)}
        style={{
          cursor: 'pointer',
          borderRadius: 'var(--mantine-radius-sm)',
          background: isSelected ? 'var(--mantine-color-amber-light)' : undefined,
        }}
      >
        {hasChildren && (
          <Icon
            icon={expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'}
            width={12}
            style={{ cursor: 'pointer' }}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); tree.toggleExpanded(node.value) }}
          />
        )}
        {!hasChildren && <div style={{ width: 12 }} />}
        <Icon icon={icon} width={14} color="var(--mantine-color-yellow-6)" />
        <Text size="sm" style={{ flex: 1 }} lineClamp={1}>{node.label}</Text>
        <Menu shadow="md" withinPortal>
          <Menu.Target>
            <ActionIcon size="xs" variant="subtle" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Icon icon="lucide:more-horizontal" width={12} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<Icon icon="lucide:pen" width={14} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                const name = window.prompt('Rename collection', node.label as string)
                if (name?.trim()) renameCollection(node.value, name.trim())
              }}
            >
              Rename
            </Menu.Item>
            <Menu.Item
              leftSection={<Icon icon="lucide:folder-plus" width={14} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                const name = window.prompt('Sub-collection name')
                if (name?.trim()) addCollection(name.trim(), node.value)
              }}
            >
              Add sub-collection
            </Menu.Item>
            <Menu.Item
              color="red"
              leftSection={<Icon icon="lucide:trash-2" width={14} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                if (window.confirm(`Delete "${node.label}" and move bookmarks?`)) {
                  deleteCollection(node.value)
                }
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    )
  }

  return (
    <Tree
      data={rootData}
      renderNode={renderNode}
      tree={tree}
      expandOnClick={false}
      selectOnClick={false}
    />
  )
}
