import Prism from 'prismjs'
import 'prismjs/themes/prism-okaidia.css'
if (typeof window !== 'undefined') {
  (window as unknown as { Prism: typeof Prism }).Prism = Prism
}
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box, Text, Group, ActionIcon, TextInput, Paper, Stack, Tooltip, Kbd, ScrollArea, Center, Button, Divider, Drawer,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useHotkeys, useMediaQuery } from '@mantine/hooks'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  MDXEditor, type MDXEditorMethods,
  headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
  linkPlugin, linkDialogPlugin, imagePlugin, tablePlugin,
  codeBlockPlugin, codeMirrorPlugin,
  diffSourcePlugin, markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo, BoldItalicUnderlineToggles, BlockTypeSelect,
  CreateLink, ListsToggle, InsertImage, InsertTable,
  InsertCodeBlock, DiffSourceToggleWrapper,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

import './notes-app-theme.css'
import { loadNotesData, saveNotesData, createNote, createFolder } from './utils'
import type { Note, NotesData } from './types'

const SAVE_DELAY = 1000

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

function NoteItem({ note, isActive, onSelect, onDelete }: { note: Note; isActive: boolean; onSelect: (id: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id })

  return (
    <Paper
      ref={setNodeRef}
      p={4}
      px="sm"
      radius="sm"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
        backgroundColor: isActive ? 'var(--mantine-color-accent-light)' : undefined,
      }}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(note.id)}
    >
      <Group justify="space-between" wrap="nowrap" gap={4}>
        <Group gap={6} wrap="nowrap" style={{ flex: 1, overflow: 'hidden' }}>
          <Icon icon="lucide:file-text" width={14} />
          <Text size="sm" truncate="end" style={{ flex: 1 }}>
            {note.title}
          </Text>
        </Group>
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
          aria-label="Delete note"
          style={{ opacity: 0.4 }}
        >
          <Icon icon="lucide:x" width={12} />
        </ActionIcon>
      </Group>
    </Paper>
  )
}

function FolderSection({ folderId, folderName, notes, activeNote, onSelect, onDelete, onRename }: {
  folderId: string | null
  folderName: string
  notes: Note[]
  activeNote: Note | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename?: (id: string, name: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: folderId ?? '__root__' })
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(folderName)
  const [parent] = useAutoAnimate()

  const handleStartEdit = useCallback(() => {
    if (folderId !== null) {
      setDraftName(folderName)
      setEditing(true)
    }
  }, [folderId, folderName])

  const handleFinishEdit = useCallback(() => {
    setEditing(false)
    if (draftName.trim() && draftName !== folderName && onRename && folderId !== null) {
      onRename(folderId, draftName.trim())
    }
  }, [draftName, folderName, onRename, folderId])

  return (
    <Box ref={setNodeRef} style={{
      borderRadius: 'var(--mantine-radius-sm)',
      backgroundColor: isOver ? 'var(--mantine-color-accent-light)' : undefined,
      transition: 'background-color 0.15s',
    }}>
      {editing ? (
        <TextInput
          value={draftName}
          onChange={(e) => setDraftName(e.currentTarget.value)}
          onBlur={handleFinishEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFinishEdit()
            if (e.key === 'Escape') setEditing(false)
          }}
          size="xs"
          px="sm"
          py={4}
          autoFocus
          variant="unstyled"
          styles={{ input: { fontWeight: 600, textTransform: 'uppercase', fontSize: 'var(--mantine-font-size-xs)' } }}
        />
      ) : (
        <Text
          px="sm"
          py={6}
          size="xs"
          fw={600}
          c="dimmed"
          tt="uppercase"
          onClick={handleStartEdit}
          style={{ cursor: folderId !== null ? 'pointer' : 'default' }}
        >
          {folderName}
        </Text>
      )}
      <SortableContext items={notes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        <Stack gap={2} px="xs" pb="xs" ref={parent}>
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isActive={activeNote?.id === note.id}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
          {notes.length === 0 && (
            <Text size="xs" c="dimmed" px="sm" py={4}>
              Empty
            </Text>
          )}
        </Stack>
      </SortableContext>
    </Box>
  )
}

export default function NotesApp() {
  const [notesData, setNotesData] = useState<NotesData>(loadNotesData)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [savedAt, setSavedAt] = useState(() => {
    const data = loadNotesData()
    const active = data.notes.find((n) => n.id === data.activeNoteId)
    return active?.updatedAt ?? 0
  })
  const editorRef = useRef<MDXEditorMethods>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notesDataRef = useRef(notesData)

  notesDataRef.current = notesData

  const activeNote = notesData.notes.find((n) => n.id === notesData.activeNoteId) ?? null
  const modKey = isMac() ? 'Cmd' : 'Ctrl'
  const isMobile = useMediaQuery('(max-width: 47.999em)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveNotesDataRef()
      setSavedAt(Date.now())
    }, SAVE_DELAY)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [notesData])

  useEffect(() => {
    editorRef.current?.setMarkdown(activeNote?.content ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesData.activeNoteId])

  useEffect(() => {
    const handler = () => {
      saveNotesDataRef()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  function saveNotesDataRef() {
    saveNotesData(notesDataRef.current)
  }

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveNotesDataRef()
    setSavedAt(Date.now())
  }, [])

  const saveNow = useCallback(() => {
    flushSave()
  }, [flushSave])

  const handleSelectNote = useCallback((id: string) => {
    flushSave()
    setNotesData((prev) => ({ ...prev, activeNoteId: id }))
  }, [flushSave])

  const handleNewNote = useCallback(() => {
    setNotesData((prev) => {
      const note = createNote('Untitled')
      return { ...prev, notes: [...prev.notes, note], activeNoteId: note.id }
    })
  }, [])

  const handleDeleteNote = useCallback((id: string) => {
    if (!window.confirm('Delete this note?')) return
    setNotesData((prev) => {
      const notes = prev.notes.filter((n) => n.id !== id)
      return {
        ...prev,
        notes,
        activeNoteId: prev.activeNoteId === id ? (notes[0]?.id ?? null) : prev.activeNoteId,
      }
    })
  }, [])

  const handleNewFolder = useCallback(() => {
    const name = newFolderName.trim() || 'New Folder'
    setNotesData((prev) => ({
      ...prev,
      folders: [...prev.folders, createFolder(name)],
    }))
    setNewFolderName('')
    setShowNewFolder(false)
  }, [newFolderName])

  const handleDeleteFolder = useCallback((folderId: string) => {
    if (!window.confirm('Delete this folder? Notes will be moved to Uncategorized.')) return
    setNotesData((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== folderId),
      notes: prev.notes.map((n) =>
        n.folderId === folderId ? { ...n, folderId: null } : n,
      ),
    }))
  }, [])

  const handleRenameFolder = useCallback((folderId: string, name: string) => {
    setNotesData((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId ? { ...f, name } : f,
      ),
    }))
  }, [])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.currentTarget.value
    setNotesData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === prev.activeNoteId ? { ...n, title } : n,
      ),
    }))
  }, [])

  const handleEditorChange = useCallback((md: string) => {
    setNotesData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === prev.activeNoteId ? { ...n, content: md, updatedAt: Date.now() } : n,
      ),
    }))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const overId = over.id as string
    if (overId !== '__root__' && !notesData.folders.some((f) => f.id === overId)) return

    setNotesData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === active.id
          ? { ...n, folderId: overId === '__root__' ? null : overId, updatedAt: Date.now() }
          : n,
      ),
    }))
  }, [notesData.folders])

  useHotkeys([
    ['mod + S', saveNow],
  ])

  const uncategorizedNotes = notesData.notes.filter((n) => n.folderId === null)
  const hasContent = notesData.notes.length > 0

  const sidebarContent = (
    <>
      <Group p="sm" gap="xs" justify="space-between">
        <Text fw={700} size="sm" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
          Notes
        </Text>
        <Group gap={4}>
          <Tooltip label="New note">
            <ActionIcon variant="light" size="sm" onClick={handleNewNote} aria-label="New note">
              <Icon icon="lucide:plus" width={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="New folder">
            <ActionIcon variant="subtle" size="sm" onClick={() => setShowNewFolder(true)} aria-label="New folder">
              <Icon icon="lucide:folder-plus" width={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {showNewFolder && (
        <Group px="sm" pb="xs">
          <TextInput
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNewFolder()
              if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') }
            }}
            onBlur={() => {
              if (newFolderName.trim()) handleNewFolder()
              else setShowNewFolder(false)
            }}
            size="xs"
            autoFocus
            style={{ flex: 1 }}
          />
        </Group>
      )}

      <Divider />

      <ScrollArea style={{ flex: 1 }} type="always" offsetScrollbars={false}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <FolderSection
            folderId={null}
            folderName="Uncategorized"
            notes={uncategorizedNotes}
            activeNote={activeNote}
            onSelect={handleSelectNote}
            onDelete={handleDeleteNote}
          />

          {notesData.folders.map((folder) => {
            const folderNotes = notesData.notes.filter((n) => n.folderId === folder.id)
            return (
              <Box key={folder.id} style={{ position: 'relative' }}>
                <FolderSection
                  folderId={folder.id}
                  folderName={folder.name}
                  notes={folderNotes}
                  activeNote={activeNote}
                  onSelect={handleSelectNote}
                  onDelete={handleDeleteNote}
                  onRename={handleRenameFolder}
                />
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => handleDeleteFolder(folder.id)}
                  aria-label="Delete folder"
                  style={{ position: 'absolute', top: 4, right: 8, opacity: 0.4 }}
                >
                  <Icon icon="lucide:x" width={12} />
                </ActionIcon>
              </Box>
            )
          })}
        </DndContext>

        {!hasContent && (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Text size="sm" c="dimmed">No notes yet</Text>
              <Button size="compact-sm" onClick={handleNewNote}>Create your first note</Button>
            </Stack>
          </Center>
        )}
      </ScrollArea>
    </>
  )

  const mainContent = (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {activeNote ? (
        <>
          <Group p="sm" px="md" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
            {isMobile && (
              <ActionIcon variant="subtle" onClick={() => setSidebarOpen(true)} aria-label="Open notes list">
                <Icon icon="lucide:menu" width={20} />
              </ActionIcon>
            )}
            <Group gap="xs" style={{ flex: 1, overflow: 'hidden' }}>
              <TextInput
                value={activeNote.title}
                onChange={handleTitleChange}
                variant="unstyled"
                size="lg"
                fw={700}
                style={{ flex: 1, minWidth: 0 }}
                styles={{ input: { fontFamily: 'var(--mantine-heading-font-family)', fontSize: '1.2rem' } }}
              />
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                {savedAt > 0
                  ? `Edited ${new Date(savedAt).toLocaleString()}`
                  : 'Not yet saved'}
              </Text>
            </Group>
            <Tooltip label={<><Kbd>{modKey}</Kbd> + <Kbd>S</Kbd></>}>
              <ActionIcon variant="subtle" onClick={saveNow} aria-label="Save note">
                <Icon icon="lucide:save" width={18} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Box style={{ flex: 1, overflow: 'auto' }}>
            <MDXEditor
              ref={editorRef}
              markdown={activeNote.content}
              onChange={handleEditorChange}
              className="notes-editor"
              plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                imagePlugin(),
                tablePlugin(),
                codeBlockPlugin(),
                codeMirrorPlugin(),
                diffSourcePlugin({ viewMode: 'rich-text' }),
                markdownShortcutPlugin(),
                toolbarPlugin({
                  toolbarContents: () => (
                    <DiffSourceToggleWrapper>
                      <UndoRedo />
                      <BoldItalicUnderlineToggles />
                      <BlockTypeSelect />
                      <CreateLink />
                      <ListsToggle />
                      <InsertImage />
                      <InsertTable />
                      <InsertCodeBlock />
                    </DiffSourceToggleWrapper>
                  ),
                }),
              ]}
            />
          </Box>
        </>
      ) : (
        <Center h="100%">
          <Stack align="center" gap="md">
            <Icon icon="lucide:file-text" width={48} />
            <Text c="dimmed" size="sm">
              {hasContent ? 'Select a note to edit' : 'No notes yet'}
            </Text>
            <Button size="compact-sm" onClick={handleNewNote}>
              Create Note
            </Button>
          </Stack>
        </Center>
      )}
    </Box>
  )

  return (
    <Box style={{ display: 'flex', height: '100%' }}>
      {isMobile ? (
        <>
          <Drawer
            opened={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            title="Notes"
            position="left"
            size="xs"
          >
            {sidebarContent}
          </Drawer>
          {mainContent}
        </>
      ) : (
        <>
          <Box
            style={{
              width: 260,
              flexShrink: 0,
              borderRight: '1px solid var(--mantine-color-default-border)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {sidebarContent}
          </Box>
          {mainContent}
        </>
      )}
    </Box>
  )
}
