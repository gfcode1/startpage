import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Container, Text, Group, ActionIcon, Paper, TextInput, Tooltip, Kbd,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { useHotkeys } from '@mantine/hooks'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { getStorage } from '@/lib/storage/engine'

const STORAGE_KEY = 'notes:content'
const META_KEY = 'notes:meta'
const SAVE_DELAY = 1000

interface NoteMeta {
  title: string
  updatedAt: number
}

function loadMeta(): NoteMeta {
  return getStorage().get<NoteMeta>(META_KEY) ?? { title: 'Untitled', updatedAt: 0 }
}

function saveMeta(meta: NoteMeta): void {
  getStorage().set(META_KEY, meta)
}

function persistContent(key: string, content: string, title: string): NoteMeta {
  getStorage().set(key, content)
  const newMeta = { title, updatedAt: Date.now() }
  saveMeta(newMeta)
  return newMeta
}

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

export default function NotesApp() {
  const [content, setContent] = useState(() => getStorage().get<string>(STORAGE_KEY) ?? '')
  const [meta, setMeta] = useState<NoteMeta>(loadMeta)
  const [title, setTitle] = useState(meta.title)
  const [hasSaved, setHasSaved] = useState(() => meta.updatedAt > 0)
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(content)
  const titleRef = useRef(title)

  // Sync refs for saveNow / unmount flush
  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { titleRef.current = title }, [title])

  // Init CodeMirror (intentionally runs once)
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    const startState = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        markdown(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString()
            setContent(newContent)
          }
        }),
      ],
    })

    viewRef.current = new EditorView({
      state: startState,
      parent: editorRef.current,
    })

    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save on unmount: persist immediately instead of discarding the pending timer
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const newMeta = persistContent(STORAGE_KEY, content, title)
      setMeta(newMeta)
      setHasSaved(true)
    }, SAVE_DELAY)
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        // Flush pending changes on unmount
        persistContent(STORAGE_KEY, contentRef.current, titleRef.current)
      }
    }
  }, [content, title])

  // beforeunload warning for unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveTimerRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const saveNow = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const newMeta = persistContent(STORAGE_KEY, contentRef.current, titleRef.current)
    setMeta(newMeta)
    setHasSaved(true)
  }, [])

  useHotkeys([
    ['mod + S', saveNow],
  ])

  const modKey = isMac() ? 'Cmd' : 'Ctrl'

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            variant="unstyled"
            size="lg"
            fw={700}
            style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem' }}
          />
          <Text size="xs" c="dimmed">
            {hasSaved
              ? `Edited ${new Date(meta.updatedAt).toLocaleString()}`
              : 'Not yet saved'}
          </Text>
        </Group>
        <Tooltip label={<><Kbd>{modKey}</Kbd> + <Kbd>S</Kbd></>}>
          <ActionIcon variant="subtle" onClick={saveNow} aria-label="Save note">
            <Icon icon="lucide:save" width={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Paper withBorder p="md" radius="md">
        <div ref={editorRef} style={{ minHeight: 300 }} />
      </Paper>
    </Container>
  )
}
