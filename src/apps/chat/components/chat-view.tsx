import { useEffect, useMemo, useRef, useState } from 'react'
import { Paper, Group, Text, ActionIcon, Tooltip, Center, Stack, ScrollArea } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useChatStore } from '../store'
import { MessageInput } from './message-input'
import { MessageBubble } from './message-bubble'
import { ModelSelector } from './model-selector'
import { ThreadSettingsModal } from './thread-settings-modal'
import { ExportModal } from './export-modal'

export function ChatView() {
  const selectedThreadId = useChatStore((s) => s.selectedThreadId)
  const threads = useChatStore((s) => s.threads)
  const messages = useChatStore((s) => s.messages)
  const streamingThreadId = useChatStore((s) => s.streamingThreadId)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const globalModel = useChatStore((s) => s.globalModel)
  const setGlobalModel = useChatStore((s) => s.setGlobalModel)
  const selectThread = useChatStore((s) => s.selectThread)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [parent] = useAutoAnimate({ duration: 200 })

  const thread = threads.find((t) => t.id === selectedThreadId)

  const threadMessages = useMemo(() => {
    if (!selectedThreadId) return []
    return messages
      .filter((m) => m.threadId === selectedThreadId)
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [messages, selectedThreadId])

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [threadMessages.length, streamingContent])

  if (!thread) {
    return (
      <Center h="100%">
        <Stack align="center" gap="md">
          <Icon icon="lucide:bot" width={48} style={{ opacity: 0.3 }} />
          <Text c="dimmed" size="lg">Select a chat or create a new one</Text>
        </Stack>
      </Center>
    )
  }

  const isStreaming = streamingThreadId === thread.id

  return (
    <Stack gap={0} h="100%">
      <Paper
        p="xs"
        radius={0}
        bg="var(--mantine-color-body)"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Group gap="xs" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Tooltip label="Back to chat list">
              <ActionIcon
                variant="subtle"
                hiddenFrom="sm"
                onClick={() => selectThread(null)}
              >
                <Icon icon="lucide:arrow-left" width={18} />
              </ActionIcon>
            </Tooltip>
            <Text fw={600} size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
              {thread.name}
            </Text>
          </Group>
          <Group gap={4} wrap="nowrap">
            <ModelSelector
              value={globalModel}
              onChange={setGlobalModel}
              size="xs"
            />
            <Tooltip label="Settings">
              <ActionIcon variant="subtle" size="sm" onClick={() => setSettingsOpen(true)}>
                <Icon icon="lucide:settings" width={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Export">
              <ActionIcon variant="subtle" size="sm" onClick={() => setExportOpen(true)}>
                <Icon icon="lucide:download" width={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Paper>

      <ScrollArea style={{ flex: 1 }} viewportRef={viewportRef} px="md" py="sm" offsetScrollbars>
        <Stack ref={parent} gap="sm">
          {thread.systemPrompt && (
            <Paper p="xs" radius="sm" bg="var(--mantine-color-blue-light)" opacity={0.8}>
              <Text size="xs" c="dimmed" mb={2}>System prompt</Text>
              <Text size="sm">{thread.systemPrompt}</Text>
            </Paper>
          )}
          {threadMessages.map((msg, i) => {
            const lastMsg = threadMessages[threadMessages.length - 1]
            if (!lastMsg) return null
            const editAllowed = msg.role === 'user' && (
              (lastMsg.role === 'user' && i === threadMessages.length - 1) ||
              (lastMsg.role === 'assistant' && i === threadMessages.length - 2 && threadMessages[i + 1]?.role === 'assistant')
            )
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                canEdit={editAllowed}
                canRegenerate={msg.role === 'assistant' && i === threadMessages.length - 1}
              />
            )
          })}
          {isStreaming && streamingContent && (
            <Paper p="sm" radius="md" bg="var(--mantine-color-default-hover)" style={{ alignSelf: 'flex-start' }}>
              <Group gap={4} mb={4}>
                <Icon icon="lucide:bot" width={14} style={{ opacity: 0.6 }} />
                <Text size="xs" c="dimmed">Generating...</Text>
              </Group>
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {streamingContent}
              </Text>
            </Paper>
          )}
          {isStreaming && !streamingContent && (
            <Text size="xs" c="dimmed" ta="center">Thinking...</Text>
          )}
        </Stack>
      </ScrollArea>

      <Paper
        p="sm"
        radius={0}
        bg="var(--mantine-color-body)"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        <MessageInput />
      </Paper>

      {thread && (
        <ThreadSettingsModal
          opened={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          thread={thread}
        />
      )}
      <ExportModal
        opened={exportOpen}
        onClose={() => setExportOpen(false)}
        threadId={thread.id}
      />
    </Stack>
  )
}
