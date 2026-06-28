import { useState, useCallback } from 'react'
import { Modal, Group, Button, Text, Stack, SegmentedControl } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useChatStore } from '../store'

interface ExportModalProps {
  opened: boolean
  onClose: () => void
  threadId: string
}

export function ExportModal({ opened, onClose, threadId }: ExportModalProps) {
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown')
  const getThreadMessages = useChatStore((s) => s.getThreadMessages)
  const threads = useChatStore((s) => s.threads)
  const globalModel = useChatStore((s) => s.globalModel)

  const thread = threads.find((t) => t.id === threadId)

  const handleExport = useCallback(() => {
    const messages = getThreadMessages(threadId)
    if (messages.length === 0) return

    const threadName = thread?.name || 'chat'
    const safeName = threadName.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 50)
    const ts = new Date().toISOString().slice(0, 10)
    let blob: Blob
    let ext: string

    if (format === 'json') {
      const data = {
        thread: thread ? { name: thread.name, model: globalModel, systemPrompt: thread.systemPrompt, temperature: thread.temperature, topP: thread.topP } : null,
        messages: messages.map((m) => ({ role: m.role, content: m.content, createdAt: new Date(m.createdAt).toISOString() })),
        exportedAt: new Date().toISOString(),
      }
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      ext = 'json'
    } else {
      let md = `# ${threadName}\n\n`
      if (thread?.systemPrompt) md += `> System: ${thread.systemPrompt}\n\n`
      md += `Exported: ${ts}\n\n---\n\n`
      for (const m of messages) {
        md += `### ${m.role === 'user' ? 'You' : 'Assistant'}\n\n${m.content}\n\n---\n\n`
      }
      blob = new Blob([md], { type: 'text/markdown' })
      ext = 'md'
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}-${ts}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    onClose()
  }, [threadId, format, getThreadMessages, thread, globalModel, onClose])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon icon="lucide:download" width={18} />
          <Text fw={600}>Export Conversation</Text>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">Export the entire conversation in your preferred format.</Text>

        <SegmentedControl
          value={format}
          onChange={(v) => setFormat(v as 'markdown' | 'json')}
          data={[
            { label: 'Markdown', value: 'markdown' },
            { label: 'JSON', value: 'json' },
          ]}
        />

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} leftSection={<Icon icon="lucide:download" width={16} />}>
            Export
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
