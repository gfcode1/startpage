import { useState, useEffect, useRef } from 'react'
import { Textarea, Paper } from '@mantine/core'
import { getStorage } from '@/lib/storage/engine'

const STORAGE_KEY = 'widgets:quicknote'

export default function QuickNoteWidget() {
  const [note, setNote] = useState(() => getStorage().get<string>(STORAGE_KEY) ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      getStorage().set(STORAGE_KEY, note)
    }, 500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [note])

  return (
    <Paper withBorder p="xs" radius="sm" bg="var(--mantine-color-body)">
      <Textarea
        placeholder="Quick note..."
        value={note}
        onChange={(e) => setNote(e.currentTarget.value)}
        variant="unstyled"
        autosize
        minRows={2}
        size="sm"
      />
    </Paper>
  )
}
