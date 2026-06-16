import { useState, useCallback } from 'react'
import { Container, Group, Title, Text, Paper, ScrollArea, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Icon } from '@iconify/react'
import { useHotkeys } from '@mantine/hooks'
import {
  useBookmarks,
  useFilteredBookmarks,
  useToggleFavorite,
  useToggleReadLater,
  useDeleteBookmark,
  useSelectedCollectionId,
  useCollectionMap,
  useViewMode,
} from './store'
import CollectionTree from './components/CollectionTree'
import CollectionForm from './components/CollectionForm'
import Toolbar from './components/Toolbar'
import BookmarkGridView from './components/BookmarkGridView'
import BookmarkListView from './components/BookmarkListView'
import BookmarkForm from './components/BookmarkForm'
import BookmarkDetail from './components/BookmarkDetail'
import ImportModal from './components/ImportModal'

export default function BookmarksApp() {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const bookmarks = useBookmarks()
  const filteredBookmarks = useFilteredBookmarks()
  const selectedCollectionId = useSelectedCollectionId()
  const toggleFavorite = useToggleFavorite()
  const toggleReadLater = useToggleReadLater()
  const deleteBookmark = useDeleteBookmark()
  const collectionMap = useCollectionMap()
  const viewMode = useViewMode()

  const [formOpen, setFormOpen] = useState(false)
  const [editBookmark, setEditBookmark] = useState<typeof filteredBookmarks[number] | null>(null)
  const [detailBookmark, setDetailBookmark] = useState<typeof filteredBookmarks[number] | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [collectionFormOpen, setCollectionFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const openAddBookmark = useCallback(() => {
    setEditBookmark(null)
    setFormOpen(true)
  }, [])

  const openEditBookmark = useCallback((id: string) => {
    const bm = bookmarks.find((b) => b.id === id)
    if (!bm) return
    setEditBookmark(bm)
    setFormOpen(true)
  }, [bookmarks])

  const openDetail = useCallback((id: string) => {
    const bm = bookmarks.find((b) => b.id === id)
    if (!bm) return
    setDetailBookmark(bm)
    setDetailOpen(true)
  }, [bookmarks])

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Delete this bookmark?')) {
      deleteBookmark(id)
    }
  }, [deleteBookmark])

  const selectedCollection = selectedCollectionId ? collectionMap[selectedCollectionId] : null

  useHotkeys([
    ['alt+N', openAddBookmark],
  ])

  const sidebar = (
    <Paper p="sm" withBorder radius="md" style={{ height: '100%' }}>
      <Group mb="sm" gap="xs">
        <Icon icon="lucide:folder-tree" width={14} />
        <Text size="sm" fw={600}>Collections</Text>
      </Group>
      <ScrollArea h="calc(100vh - 220px)" offsetScrollbars>
        <CollectionTree />
      </ScrollArea>
    </Paper>
  )

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md">
        <div>
          <Title order={3}>Bookmarks</Title>
          <Text size="sm" c="dimmed">{bookmarks.length} bookmarks</Text>
        </div>
      </Group>

      <Toolbar
        onAddBookmark={openAddBookmark}
        onAddCollection={() => setCollectionFormOpen(true)}
        onImport={() => setImportOpen(true)}
      />

      <Group align="flex-start" gap="md">
        {!isMobile && (
          <div style={{ width: 240, flexShrink: 0 }}>
            {sidebar}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {filteredBookmarks.length === 0 ? (
            <Paper withBorder p="xl" radius="md">
              <Group justify="center" py="xl">
                <Icon icon="lucide:bookmark" width={48} color="var(--mantine-color-dimmed)" />
              </Group>
              <Text ta="center" c="dimmed" size="sm">
                {bookmarks.length === 0
                  ? 'No bookmarks yet. Click "Add" to get started.'
                  : 'No bookmarks match your search.'}
              </Text>
            </Paper>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <BookmarkGridView
                  bookmarks={filteredBookmarks}
                  collectionMap={collectionMap}
                  onOpen={openDetail}
                  onEdit={openEditBookmark}
                  onDelete={handleDelete}
                  onToggleFavorite={toggleFavorite}
                  onToggleReadLater={toggleReadLater}
                />
              ) : (
                <BookmarkListView
                  bookmarks={filteredBookmarks}
                  onOpen={openDetail}
                  onEdit={openEditBookmark}
                  onDelete={handleDelete}
                  onToggleFavorite={toggleFavorite}
                  onToggleReadLater={toggleReadLater}
                />
              )}
            </>
          )}
        </div>
      </Group>

      <BookmarkForm
        opened={formOpen}
        onClose={() => { setFormOpen(false); setEditBookmark(null) }}
        editBookmark={editBookmark}
        defaultCollectionId={selectedCollectionId}
      />

      <BookmarkDetail
        bookmark={detailBookmark}
        collectionName={selectedCollection?.name}
        opened={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailBookmark(null) }}
        onEdit={openEditBookmark}
        onDelete={handleDelete}
        onToggleFavorite={toggleFavorite}
        onToggleReadLater={toggleReadLater}
      />

      <CollectionForm
        opened={collectionFormOpen}
        onClose={() => setCollectionFormOpen(false)}
      />

      <ImportModal
        opened={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </Container>
  )
}
