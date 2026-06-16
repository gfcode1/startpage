import { Card, Group, Text, ActionIcon, Badge, CopyButton, Button, Avatar } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { VaultEntry as VaultEntryType, Category } from '../types'
import { strengthScore, getFaviconUrl } from '../utils'

interface VaultEntryProps {
  entry: VaultEntryType
  category?: Category
  viewMode: 'list' | 'grid'
  onSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onDelete: (id: string) => void
}

export default function VaultEntry({ entry, category, viewMode, onSelect, onToggleFavorite, onDelete }: VaultEntryProps) {
  const strength = strengthScore(entry.password)
  const favicon = getFaviconUrl(entry.url)

  if (viewMode === 'grid') {
    return (
      <Card
        padding="sm"
        withBorder
        style={{ cursor: 'pointer' }}
        onClick={() => onSelect(entry.id)}
      >
        <Stack align="center" gap="xs">
          <Avatar src={favicon} size={36} radius="sm">
            {entry.name[0]?.toUpperCase()}
          </Avatar>
          <Text size="sm" fw={600} ta="center" lineClamp={1}>{entry.name}</Text>
          <Text size="xs" c="dimmed" lineClamp={1}>{entry.username}</Text>
          <Badge size="xs" color={strength.color}>{strength.label}</Badge>
          <Group gap={4}>
            <CopyButton value={entry.username}>
              {({ copied, copy }) => (
                <ActionIcon size="sm" variant="subtle" onClick={(e) => { e.stopPropagation(); copy() }} title="Copy username">
                  <Icon icon={copied ? 'lucide:check' : 'lucide:user'} width={14} />
                </ActionIcon>
              )}
            </CopyButton>
            <CopyButton value={entry.password}>
              {({ copied, copy }) => (
                <ActionIcon size="sm" variant="subtle" onClick={(e) => { e.stopPropagation(); copy() }} title="Copy password">
                  <Icon icon={copied ? 'lucide:check' : 'lucide:key-round'} width={14} />
                </ActionIcon>
              )}
            </CopyButton>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry.id) }}
              title={entry.favorite ? 'Remove favorite' : 'Add favorite'}
            >
              <Icon
                icon={entry.favorite ? 'lucide:star' : 'lucide:star'}
                width={14}
                color={entry.favorite ? 'var(--mantine-color-yellow-5)' : undefined}
              />
            </ActionIcon>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
              title="Delete"
            >
              <Icon icon="lucide:trash-2" width={14} />
            </ActionIcon>
          </Group>
        </Stack>
      </Card>
    )
  }

  return (
    <Card
      padding="sm"
      withBorder
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(entry.id)}
    >
      <Group gap="sm" wrap="nowrap" align="center">
        <Avatar src={favicon} size={32} radius="sm">
          {entry.name[0]?.toUpperCase()}
        </Avatar>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" align="center">
            <Text size="sm" fw={600} lineClamp={1}>{entry.name}</Text>
            {entry.favorite && <Icon icon="lucide:star" width={12} color="var(--mantine-color-yellow-5)" />}
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed" lineClamp={1}>{entry.username}</Text>
            {category && (
              <>
                <Text size="xs" c="dimmed">·</Text>
                <Group gap={4}>
                  <Icon icon={category.icon} width={10} color={category.color} />
                  <Text size="xs" c="dimmed">{category.name}</Text>
                </Group>
              </>
            )}
          </Group>
        </div>

        <Badge size="xs" color={strength.color}>{strength.label}</Badge>

        <CopyButton value={entry.username}>
          {({ copied, copy }) => (
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={(e) => { e.stopPropagation(); copy() }}
              leftSection={<Icon icon={copied ? 'lucide:check' : 'lucide:copy'} width={12} />}
            >
              User
            </Button>
          )}
        </CopyButton>

        <CopyButton value={entry.password}>
          {({ copied, copy }) => (
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={(e) => { e.stopPropagation(); copy() }}
              leftSection={<Icon icon={copied ? 'lucide:check' : 'lucide:key-round'} width={12} />}
            >
              Pass
            </Button>
          )}
        </CopyButton>

        <ActionIcon size="sm" variant="subtle" onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry.id) }}>
          <Icon icon={entry.favorite ? 'lucide:star' : 'lucide:star'} width={14} color={entry.favorite ? 'var(--mantine-color-yellow-5)' : undefined} />
        </ActionIcon>

        <ActionIcon size="sm" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}>
          <Icon icon="lucide:trash-2" width={14} />
        </ActionIcon>
      </Group>
    </Card>
  )
}

function Stack({ children, align, gap }: { children: React.ReactNode; align?: string; gap?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align, gap }}>
      {children}
    </div>
  )
}
