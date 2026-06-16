import { useState } from 'react'
import { Modal, Stack, Text, Button, Group, FileInput, Alert } from '@mantine/core'
import { useAddBookmark, useCollections, useAddCollection } from '../store'
import { parseBrowserBookmarksHtml } from '../utils'

interface ImportModalProps {
  opened: boolean
  onClose: () => void
}

export default function ImportModal({ opened, onClose }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ bookmarks: number; collections: number } | null>(null)
  const addBookmark = useAddBookmark()
  const addCollection = useAddCollection()
  const collections = useCollections()

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const parsed = parseBrowserBookmarksHtml(text)

      const existingNames = new Set(collections.map((c) => c.name.toLowerCase()))
      const collectionIdMap = new Map<string, string | null>()

      for (const col of parsed.collections) {
        let parentId: string | null = null
        if (col.parentId) {
          parentId = collectionIdMap.get(col.parentId) ?? null
        }
        if (existingNames.has(col.name.toLowerCase())) continue
        const newCol = addCollection(col.name, parentId)
        collectionIdMap.set(col.id, newCol.id)
        existingNames.add(col.name.toLowerCase())
      }

      for (const bm of parsed.bookmarks) {
        if (bm.collectionId) {
          const mappedId = collectionIdMap.get(bm.collectionId)
          bm.collectionId = mappedId ?? null
        }
        addBookmark(bm)
      }

      setResult({ bookmarks: parsed.bookmarks.length, collections: parsed.collections.length })
    } catch {
      setResult({ bookmarks: 0, collections: 0 })
    }

    setImporting(false)
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Import bookmarks" size="sm">
      <Stack>
        <Text size="sm" c="dimmed">
          Import bookmarks from a browser HTML export file (bookmarks.html).
        </Text>
        <FileInput
          label="Browser bookmarks file"
          placeholder="bookmarks.html"
          accept=".html,.htm"
          value={file}
          onChange={setFile}
        />
        {result && (
          <Alert color="green" title="Import complete">
            Imported {result.bookmarks} bookmarks and {result.collections} collections.
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>Close</Button>
          <Button onClick={handleImport} disabled={!file} loading={importing}>
            Import
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
