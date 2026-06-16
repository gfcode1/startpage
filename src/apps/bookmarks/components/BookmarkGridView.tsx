import { SimpleGrid, Center, Text } from '@mantine/core'
import BookmarkCard from './BookmarkCard'
import type { Bookmark } from '../types'

interface BookmarkGridViewProps {
  bookmarks: Bookmark[]
  collectionMap: Record<string, { name: string }>
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onToggleReadLater: (id: string) => void
}

export default function BookmarkGridView({
  bookmarks,
  collectionMap,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleReadLater,
}: BookmarkGridViewProps) {
  if (bookmarks.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed" size="sm">No bookmarks found</Text>
      </Center>
    )
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="sm">
      {bookmarks.map((bm) => (
        <BookmarkCard
          key={bm.id}
          bookmark={bm}
          collectionName={bm.collectionId ? collectionMap[bm.collectionId]?.name : undefined}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onToggleReadLater={onToggleReadLater}
        />
      ))}
    </SimpleGrid>
  )
}
