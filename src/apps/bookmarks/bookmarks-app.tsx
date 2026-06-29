import { useState, useCallback, useEffect, useRef } from 'react'
import { Container, Group, Title, Text, Paper, ScrollArea, useMantineTheme, SegmentedControl, Stack, SimpleGrid, ThemeIcon } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Icon } from '@iconify/react'
import { useHotkeys } from '@mantine/hooks'
import { useSearchParams } from 'react-router-dom'
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
import BookmarkStats from './components/BookmarkStats'
import InstallModal from './components/InstallModal'

export default function BookmarksApp() {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [searchParams, setSearchParams] = useSearchParams()

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
  const [installOpen, setInstallOpen] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<'collections' | 'bookmarks'>('bookmarks')

  const [pendingUrl, setPendingUrl] = useState('')
  const [pendingTitle, setPendingTitle] = useState('')
  const [pendingDescription, setPendingDescription] = useState('')
  const initDone = useRef(false)

  useEffect(() => {
    if (initDone.current) return
    const action = searchParams.get('action')
    if (action === 'import') {
      initDone.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImportOpen(true)
    } else if (action === 'add') {
      const url = searchParams.get('url') || ''
      if (url) {
        initDone.current = true
        setPendingUrl(url)
        setPendingTitle(searchParams.get('title') || '')
        setPendingDescription(searchParams.get('description') || '')
        setFormOpen(true)
      }
    }
  }, [searchParams])

  const clearParams = useCallback(() => {
    if (searchParams.toString()) setSearchParams({}, { replace: true })
    setPendingUrl('')
    setPendingTitle('')
    setPendingDescription('')
  }, [searchParams, setSearchParams])

  const openAddBookmark = useCallback(() => {
    setEditBookmark(null)
    clearParams()
    setFormOpen(true)
  }, [clearParams])

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
    ['mod+F', () => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder="Search bookmarks..."]')
      input?.focus()
      event?.preventDefault()
    }],
    ['Escape', () => {
      if (formOpen || detailOpen || collectionFormOpen || importOpen || installOpen) {
        setFormOpen(false)
        setDetailOpen(false)
        setCollectionFormOpen(false)
        setImportOpen(false)
        setInstallOpen(false)
        clearParams()
      }
    }],
  ])

  const sidebar = (
    <Paper p="sm" withBorder radius="md" style={{ height: '100%' }}>
      <Group mb="sm" gap="xs">
        <Icon icon="lucide:folder-tree" width={14} />
        <Text size="sm" fw={600}>Collections</Text>
      </Group>
      <ScrollArea h="calc(100vh - 300px)" offsetScrollbars>
        <CollectionTree />
      </ScrollArea>
    </Paper>
  )

  const emptyState = bookmarks.length === 0 ? (
    <Paper withBorder p="xl" radius="md">
      <Stack align="center" gap="xl" py="lg">
        <Icon icon="lucide:bookmark" width={56} color="var(--mantine-color-dimmed)" />
        <div>
          <Text ta="center" fw={600} size="lg" mb={4}>Welcome to Bookmarks</Text>
          <Text ta="center" c="dimmed" size="sm">
            Choose how you want to start saving pages
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" w="100%" maw={600}>
          <Paper withBorder p="md" radius="md" style={{ cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--mantine-color-dark-6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => setInstallOpen(true)}
          >
            <Stack align="center" gap="sm">
              <ThemeIcon size={40} radius="md" variant="light" color="amber">
                <Icon icon="lucide:mouse-pointer-click" width={20} />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={600} ta="center">Bookmarklet</Text>
                <Text size="xs" c="dimmed" ta="center">One click from your bookmarks bar</Text>
              </div>
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md" style={{ cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--mantine-color-dark-6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => setInstallOpen(true)}
          >
            <Stack align="center" gap="sm">
              <ThemeIcon size={40} radius="md" variant="light" color="blue">
                <Icon icon="lucide:puzzle" width={20} />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={600} ta="center">Extension</Text>
                <Text size="xs" c="dimmed" ta="center">Toolbar button + right-click menu</Text>
              </div>
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md" style={{ cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--mantine-color-dark-6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={openAddBookmark}
          >
            <Stack align="center" gap="sm">
              <ThemeIcon size={40} radius="md" variant="light" color="green">
                <Icon icon="lucide:plus" width={20} />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={600} ta="center">Manual</Text>
                <Text size="xs" c="dimmed" ta="center">Add with Alt+N shortcut</Text>
              </div>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Paper>
  ) : (
    <Paper withBorder p="xl" radius="md">
      <Stack align="center" gap="md" py="lg">
        <Icon icon="lucide:search" width={48} color="var(--mantine-color-dimmed)" />
        <Text ta="center" c="dimmed" size="sm">No bookmarks match your search.</Text>
      </Stack>
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

      {isMobile && (
        <SegmentedControl
          value={mobilePanel}
          onChange={(v) => setMobilePanel(v as 'collections' | 'bookmarks')}
          data={[
            { value: 'bookmarks', label: 'Bookmarks' },
            { value: 'collections', label: 'Collections' },
          ]}
          fullWidth
          mb="sm"
        />
      )}

      <Toolbar
        onAddBookmark={openAddBookmark}
        onAddCollection={() => setCollectionFormOpen(true)}
        onImport={() => setImportOpen(true)}
        onHelp={() => setInstallOpen(true)}
      />

      <BookmarkStats />

      <Group align="flex-start" gap="md" mt="sm">
        {!isMobile ? (
          <div style={{ width: 240, flexShrink: 0 }}>
            {sidebar}
          </div>
        ) : mobilePanel === 'collections' ? (
          <div style={{ width: '100%' }}>
            {sidebar}
          </div>
        ) : null}

        {(!isMobile || mobilePanel === 'bookmarks') && (
          <div style={{ flex: 1, minWidth: 0 }}>
            {filteredBookmarks.length === 0 ? (
              emptyState
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
        )}
      </Group>

      <BookmarkForm
        opened={formOpen}
        onClose={() => { setFormOpen(false); setEditBookmark(null); clearParams() }}
        editBookmark={editBookmark}
        defaultCollectionId={selectedCollectionId}
        initialUrl={pendingUrl || undefined}
        initialTitle={pendingTitle || undefined}
        initialDescription={pendingDescription || undefined}
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
        onClose={() => { setImportOpen(false); clearParams() }}
      />

      <InstallModal
        opened={installOpen}
        onClose={() => setInstallOpen(false)}
      />
    </Container>
  )
}
