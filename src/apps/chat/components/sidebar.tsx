import { useState, useCallback, useMemo } from 'react'
import { Paper, Text, Group, ActionIcon, TextInput, Tooltip, ScrollArea, Stack, Button } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useChatStore } from '../store'
import type { Thread, Message } from '../types'
import { formatDate, setApiKey as saveApiKey, getApiKey } from '../utils'

function ThreadItem({
  thread,
  lastMessage,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}: {
  thread: Thread
  lastMessage: Message | undefined
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(thread.name)

  const handleRename = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== thread.name) {
      onRename(thread.id, trimmed)
    }
    setEditing(false)
  }, [editName, thread.name, thread.id, onRename])

  return (
    <Paper
      p="xs"
      radius="sm"
      bg={isSelected ? 'var(--mantine-color-accent-light)' : 'transparent'}
      style={{ cursor: 'pointer', transition: 'background 0.1s' }}
      onClick={() => onSelect(thread.id)}
    >
      <Group gap={4} wrap="nowrap">
        <Icon icon="lucide:bot" width={14} style={{ opacity: 0.5, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <TextInput
              size="xs"
              value={editName}
              onChange={(e) => setEditName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setEditing(false)
              }}
              onBlur={handleRename}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <Text size="sm" truncate fw={isSelected ? 600 : 400}>
                {thread.name}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {lastMessage
                  ? lastMessage.content.slice(0, 60)
                  : 'No messages'}
              </Text>
              <Text size="xs" c="dimmed">
                {formatDate(thread.updatedAt)}
              </Text>
            </>
          )}
        </div>
        {!editing && (
          <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label="Rename">
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditName(thread.name)
                  setEditing(true)
                }}
              >
                <Icon icon="lucide:pencil" width={10} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete">
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(thread.id)
                }}
              >
                <Icon icon="lucide:trash-2" width={10} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>
    </Paper>
  )
}

export function Sidebar() {
  const threads = useChatStore((s) => s.threads)
  const messages = useChatStore((s) => s.messages)
  const selectedThreadId = useChatStore((s) => s.selectedThreadId)
  const createThread = useChatStore((s) => s.createThread)
  const deleteThread = useChatStore((s) => s.deleteThread)
  const renameThread = useChatStore((s) => s.renameThread)
  const selectThread = useChatStore((s) => s.selectThread)
  const [search, setSearch] = useState('')
  const [parent] = useAutoAnimate({ duration: 200 })

  const lastMessages = useMemo(() => {
    const map = new Map<string, Message>()
    for (const m of messages) {
      const existing = map.get(m.threadId)
      if (!existing || m.createdAt > existing.createdAt) {
        map.set(m.threadId, m)
      }
    }
    return map
  }, [messages])

  const sortedThreads = useMemo(() => {
    const filtered = search
      ? threads.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      : threads
    return [...filtered].sort((a, b) => b.updatedAt - a.createdAt)
  }, [threads, search])

  return (
    <Stack gap="xs" h="100%">
      <Group gap="xs" wrap="nowrap">
        <Button
          fullWidth
          size="sm"
          leftSection={<Icon icon="lucide:plus" width={16} />}
          onClick={() => createThread()}
        >
          New Chat
        </Button>
      </Group>

      {threads.length > 3 && (
        <TextInput
          size="xs"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<Icon icon="lucide:search" width={14} />}
        />
      )}

      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
        <div ref={parent}>
          {sortedThreads.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              {search ? 'No chats found' : 'No chats yet'}
            </Text>
          ) : (
            <Stack gap={2}>
              {sortedThreads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  lastMessage={lastMessages.get(thread.id)}
                  isSelected={thread.id === selectedThreadId}
                  onSelect={selectThread}
                  onDelete={deleteThread}
                  onRename={renameThread}
                />
              ))}
            </Stack>
          )}
        </div>
      </ScrollArea>

      <ApiKeySection />
    </Stack>
  )
}

function ApiKeySection() {
  const [editing, setEditing] = useState(false)
  const [apiKey, setApiKeyState] = useState(() => getApiKey())

  const handleSave = useCallback(() => {
    const trimmed = apiKey.trim()
    saveApiKey(trimmed)
    setEditing(false)
  }, [apiKey])

  return (
    <Paper p="xs" radius="sm" bg="var(--mantine-color-default-hover)">
      {editing ? (
        <Stack gap="xs">
          <TextInput
            size="xs"
            type="password"
            placeholder="sk-or-..."
            value={apiKey}
            onChange={(e) => setApiKeyState(e.currentTarget.value)}
            leftSection={<Icon icon="lucide:key" width={14} />}
          />
          <Group gap="xs" justify="flex-end">
            <Button size="xs" variant="subtle" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="xs" onClick={handleSave}>Save</Button>
          </Group>
        </Stack>
      ) : (
        <Group gap="xs" justify="space-between" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
          <Group gap={4}>
            <Icon icon="lucide:key" width={14} style={{ opacity: 0.6 }} />
            <Text size="xs" c="dimmed">API Key</Text>
          </Group>
          <Icon icon="lucide:chevron-right" width={14} style={{ opacity: 0.4 }} />
        </Group>
      )}
    </Paper>
  )
}
