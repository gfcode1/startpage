import { Paper, Group, Text, Image, ActionIcon, Stack, Badge, Skeleton } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Bookmark } from '../types'
import { formatRelativeTime } from '../utils'
import { useState } from 'react'

interface BookmarkCardProps {
  bookmark: Bookmark
  collectionName?: string
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onToggleReadLater: (id: string) => void
}

export default function BookmarkCard({
  bookmark,
  collectionName: _collectionName,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleReadLater,
}: BookmarkCardProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const hostname = bookmark.url.replace(/^https?:\/\//, '').split('/')[0]

  return (
    <Paper
      withBorder
      radius="md"
      style={{
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      onClick={() => onOpen(bookmark.id)}
    >
      {bookmark.ogImage && !imgError ? (
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          {!imgLoaded && <Skeleton height={160} radius={0} />}
          <Image
            src={bookmark.ogImage}
            alt={bookmark.title}
            height={160}
            fit="cover"
            style={imgLoaded ? undefined : { position: 'absolute', opacity: 0 }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 80, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          }} />
          <div style={{
            position: 'absolute', bottom: 8, left: 10, right: 10,
          }}>
            <Group gap={6} align="center" wrap="nowrap">
              {bookmark.favicon && (
                <img src={bookmark.favicon} alt="" width={16} height={16} style={{ flexShrink: 0, borderRadius: 2 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              <Text size="sm" fw={600} c="white" lineClamp={2} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {bookmark.title}
              </Text>
            </Group>
          </div>
        </div>
      ) : (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, background: 'var(--mantine-color-dark-7)' }}>
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" width={40} height={40} style={{ borderRadius: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <Icon icon="lucide:link" width={40} color="var(--mantine-color-dimmed)" />
          )}
          <Text size="sm" fw={600} c="dimmed" lineClamp={2} px="sm" ta="center">
            {bookmark.title}
          </Text>
        </div>
      )}

      <Stack gap={6} p="sm">
        <div style={{ minWidth: 0 }}>
          <Group gap={4} wrap="nowrap" mb={4}>
            <Badge size="xs" variant="light" color="gray" tt="none" style={{ flexShrink: 0 }}>
              {hostname}
            </Badge>
            {bookmark.isFavorite && (
              <Icon icon="lucide:star" width={12} color="var(--mantine-color-yellow-5)" style={{ flexShrink: 0 }} />
            )}
            {bookmark.isReadLater && (
              <Icon icon="lucide:bookmark-plus" width={12} color="var(--mantine-color-blue-5)" style={{ flexShrink: 0 }} />
            )}
          </Group>
          {bookmark.description && (
            <Text size="xs" c="dimmed" lineClamp={2} mb={4}>{bookmark.description}</Text>
          )}
          <Group justify="space-between" align="center">
            <Text size="xs" c="gray">{formatRelativeTime(bookmark.createdAt)}</Text>
            {bookmark.tags.length > 0 && (
              <Text size="xs" c="dimmed">{bookmark.tags.length} tag{bookmark.tags.length > 1 ? 's' : ''}</Text>
            )}
          </Group>
        </div>

        <Group gap={4} justify="flex-end" onClick={(e) => e.stopPropagation()} style={{ opacity: 0.5, transition: 'opacity 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5' }}
        >
          <ActionIcon size="sm" variant="subtle" onClick={() => onToggleFavorite(bookmark.id)} title="Toggle favorite">
            <Icon icon="lucide:star" width={14} color={bookmark.isFavorite ? 'var(--mantine-color-yellow-5)' : undefined} />
          </ActionIcon>
          <ActionIcon size="sm" variant="subtle" onClick={() => onToggleReadLater(bookmark.id)} title="Toggle read later">
            <Icon icon={bookmark.isReadLater ? 'lucide:bookmark-check' : 'lucide:bookmark-plus'} width={14} />
          </ActionIcon>
          <ActionIcon size="sm" variant="subtle" onClick={() => onEdit(bookmark.id)} title="Edit">
            <Icon icon="lucide:pencil" width={14} />
          </ActionIcon>
          <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDelete(bookmark.id)} title="Delete">
            <Icon icon="lucide:trash-2" width={14} />
          </ActionIcon>
        </Group>
      </Stack>
    </Paper>
  )
}
