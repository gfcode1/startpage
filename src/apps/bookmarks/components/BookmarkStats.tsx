import { Group, Badge } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useBookmarks, useFilter, useSetFilter } from '../store'
import type { BookmarkFilter } from '../types'

export default function BookmarkStats() {
  const bookmarks = useBookmarks()
  const filter = useFilter()
  const setFilter = useSetFilter()

  const total = bookmarks.length
  const favorites = bookmarks.filter((b) => b.isFavorite).length
  const readLater = bookmarks.filter((b) => b.isReadLater).length

  const items: { filter: BookmarkFilter; icon: string; label: string; count: number; color?: string }[] = [
    { filter: 'all', icon: 'lucide:bookmark', label: 'All', count: total },
    { filter: 'favorites', icon: 'lucide:star', label: 'Favorites', count: favorites, color: 'yellow' },
    { filter: 'readLater', icon: 'lucide:bookmark-plus', label: 'Read Later', count: readLater, color: 'blue' },
  ]

  return (
    <Group gap="xs" wrap="wrap">
      {items.map((item) => (
        <Badge
          key={item.filter}
          size="lg"
          variant={filter === item.filter ? 'filled' : 'light'}
          color={item.color || 'gray'}
          leftSection={<Icon icon={item.icon} width={12} />}
          style={{ cursor: 'pointer', textTransform: 'none' }}
          onClick={() => setFilter(item.filter)}
        >
          {item.label} ({item.count})
        </Badge>
      ))}
    </Group>
  )
}
