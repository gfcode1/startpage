import { useState, useCallback, useEffect, useRef } from 'react'
import { Paper, Group, Text, ActionIcon, Tooltip, Stack, ScrollArea, TextInput } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '../store'

export default function ChatWidget() {
  const navigate = useNavigate()
  const threads = useChatStore((s) => s.threads)
  const messages = useChatStore((s) => s.messages)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const streamingThreadId = useChatStore((s) => s.streamingThreadId)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const createThread = useChatStore((s) => s.createThread)
  const selectThread = useChatStore((s) => s.selectThread)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const { threads: t } = useChatStore.getState()
    if (t.length === 0) {
      const newThread = createThread()
      selectThread(newThread.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeThread = threads[0]
  const isStreaming = activeThread && streamingThreadId === activeThread.id

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || !activeThread) return
    sendMessage(trimmed)
    setInput('')
  }, [input, isStreaming, activeThread, sendMessage])

  const threadMessages = activeThread
    ? messages
        .filter((m) => m.threadId === activeThread.id)
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-6)
    : []

  return (
    <Paper h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Group gap="xs" px="sm" py={6} justify="space-between" wrap="nowrap"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Group gap={4}>
          <Icon icon="lucide:bot" width={16} style={{ opacity: 0.6 }} />
          <Text size="sm" fw={600} truncate>
            {activeThread?.name || 'Quick Chat'}
          </Text>
        </Group>
        <Tooltip label="Open full chat">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => {
              navigate('/chat')
            }}
          >
            <Icon icon="lucide:maximize-2" width={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <ScrollArea style={{ flex: 1 }} px="sm" py={4} offsetScrollbars>
        {threadMessages.length === 0 && !isStreaming ? (
          <Text size="xs" c="dimmed" ta="center" py="md">
            Send a message to start
          </Text>
        ) : (
          <Stack gap={4}>
            {threadMessages.map((msg) => (
              <Paper
                key={msg.id}
                p={4}
                px="xs"
                radius="sm"
                bg={msg.role === 'user' ? 'var(--mantine-color-accent-light)' : 'transparent'}
              >
                {msg.role === 'user' ? (
                  <Text size="xs" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </Text>
                ) : (
                  <Text size="xs" style={{ wordBreak: 'break-word' }} lineClamp={8}>
                    {msg.content}
                  </Text>
                )}
              </Paper>
            ))}
            {isStreaming && streamingContent && (
              <Paper p={4} px="xs" radius="sm">
                <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>
                  {streamingContent}
                </Text>
              </Paper>
            )}
          </Stack>
        )}
      </ScrollArea>

      <Group gap={4} px="sm" py={6} wrap="nowrap"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        <TextInput
          ref={inputRef}
          size="xs"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isStreaming}
          style={{ flex: 1 }}
        />
        <Tooltip label="Send">
          <ActionIcon
            size="sm"
            variant="filled"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            radius="sm"
          >
            <Icon icon="lucide:send" width={14} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  )
}
