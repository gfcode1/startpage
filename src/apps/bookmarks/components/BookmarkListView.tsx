import { Stack, Center, Text, Divider } from '@mantine/core'
import BookmarkListItem from './BookmarkListItem'
import type { Bookmark } from '../types'

interface BookmarkListViewProps {
  bookmarks: Bookmark[]
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onToggleReadLater: (id: string) => void
}

export default function BookmarkListView({
  bookmarks,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleReadLater,
}: BookmarkListViewProps) {
  if (bookmarks.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed" size="sm">No bookmarks found</Text>
      </Center>
    )
  }

  return (
    <Stack gap={0}>
      {bookmarks.map((bm, i) => (
        <div key={bm.id}>
          {i > 0 && <Divider />}
          <BookmarkListItem
            bookmark={bm}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onToggleReadLater={onToggleReadLater}
          />
        </div>
      ))}
    </Stack>
  )
}
