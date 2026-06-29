import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal, TextInput, Textarea, Select, Group, Button, Stack, TagsInput, Switch, Tooltip, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useCollections, useAddBookmark, useUpdateBookmark } from '../store'
import { createBookmark, fetchMetadata } from '../utils'
import type { Bookmark } from '../types'

interface BookmarkFormProps {
  opened: boolean
  onClose: () => void
  editBookmark?: Bookmark | null
  defaultCollectionId?: string | null
  initialUrl?: string
  initialTitle?: string
  initialDescription?: string
}

export default function BookmarkForm({ opened, onClose, editBookmark, defaultCollectionId, initialUrl, initialTitle, initialDescription }: BookmarkFormProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={editBookmark ? 'Edit bookmark' : 'Add bookmark'} size="md">
      <BookmarkFormContent
        key={editBookmark?.id ?? 'new'}
        onClose={onClose}
        editBookmark={editBookmark}
        defaultCollectionId={defaultCollectionId}
        initialUrl={initialUrl}
        initialTitle={initialTitle}
        initialDescription={initialDescription}
      />
    </Modal>
  )
}

function BookmarkFormContent({ onClose, editBookmark, defaultCollectionId, initialUrl, initialTitle, initialDescription }: Omit<BookmarkFormProps, 'opened'>) {
  const collections = useCollections()
  const addBookmark = useAddBookmark()
  const updateBookmark = useUpdateBookmark()

  const [url, setUrl] = useState(editBookmark?.url ?? initialUrl ?? '')
  const [title, setTitle] = useState(editBookmark?.title ?? initialTitle ?? '')
  const [description, setDescription] = useState(editBookmark?.description ?? initialDescription ?? '')
  const [collectionId, setCollectionId] = useState<string | null>(editBookmark?.collectionId ?? defaultCollectionId ?? null)
  const [tags, setTags] = useState<string[]>(editBookmark?.tags ?? [])
  const [notes, setNotes] = useState(editBookmark?.notes ?? '')
  const [isReadLater, setIsReadLater] = useState(editBookmark?.isReadLater ?? false)
  const [isFavorite, setIsFavorite] = useState(editBookmark?.isFavorite ?? false)
  const [fetching, setFetching] = useState(false)
  const autoFetched = useRef(false)

  const isEditing = !!editBookmark

  const doFetchMetadata = useCallback(async (overrideUrl?: string, overrideTitle?: string, overrideDesc?: string) => {
    const targetUrl = overrideUrl || url.trim()
    if (!targetUrl) return
    setFetching(true)
    const meta = await fetchMetadata(targetUrl)
    if (meta.title && !overrideTitle) setTitle(meta.title)
    else if (overrideTitle) setTitle(overrideTitle)
    if (meta.description && !overrideDesc) setDescription(meta.description)
    else if (overrideDesc) setDescription(overrideDesc)
    setFetching(false)
  }, [url])

  useEffect(() => {
    if (!isEditing && initialUrl && !autoFetched.current) {
      autoFetched.current = true
      doFetchMetadata(initialUrl, initialTitle, initialDescription)
    }
  }, [isEditing, initialUrl, initialTitle, initialDescription, doFetchMetadata])

  const handleSubmit = () => {
    if (!url.trim()) return

    if (isEditing && editBookmark) {
      updateBookmark(editBookmark.id, {
        url: url.trim(),
        title: title.trim(),
        description: description.trim(),
        collectionId,
        tags,
        notes: notes.trim(),
        isReadLater,
        isFavorite,
      })
    } else {
      const bm = createBookmark(url.trim(), title.trim(), description.trim())
      bm.collectionId = collectionId
      bm.tags = tags
      bm.notes = notes.trim()
      bm.isReadLater = isReadLater
      bm.isFavorite = isFavorite
      addBookmark(bm)
    }

    onClose()
  }

  const collectionOptions = collections.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  return (
    <Stack>
      <TextInput
        label="URL"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.currentTarget.value)}
        rightSection={url.trim() && !isEditing ? (
          <Tooltip label="Fetch metadata">
            <ActionIcon size="sm" variant="subtle" loading={fetching} onClick={() => doFetchMetadata()}>
              <Icon icon="lucide:refresh-cw" width={14} />
            </ActionIcon>
          </Tooltip>
        ) : null}
        data-autofocus
        required
      />
      <TextInput
        label="Title"
        placeholder="Page title"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
      />
      <Textarea
        label="Description"
        placeholder="Brief description"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        autosize
        minRows={2}
        maxRows={4}
      />
      <Select
        label="Collection"
        placeholder="No collection"
        data={collectionOptions}
        value={collectionId}
        onChange={setCollectionId}
        clearable
        searchable
      />
      <TagsInput
        label="Tags"
        placeholder="Add tags"
        value={tags}
        onChange={setTags}
      />
      <Textarea
        label="Notes"
        placeholder="Personal notes..."
        value={notes}
        onChange={(e) => setNotes(e.currentTarget.value)}
        autosize
        minRows={2}
        maxRows={4}
      />
      <Group justify="space-between">
        <Switch
          label="Mark as favorite"
          checked={isFavorite}
          onChange={(e) => setIsFavorite(e.currentTarget.checked)}
        />
        <Switch
          label="Read later"
          checked={isReadLater}
          onChange={(e) => setIsReadLater(e.currentTarget.checked)}
        />
      </Group>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!url.trim()}>
          {isEditing ? 'Update' : 'Add'}
        </Button>
      </Group>
    </Stack>
  )
}
