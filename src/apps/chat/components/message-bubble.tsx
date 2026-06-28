import { memo, useState, useCallback } from 'react'
import { Paper, Group, Text, ActionIcon, Tooltip, CopyButton, Textarea } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Message } from '../types'
import { useChatStore } from '../store'
import { MarkdownRenderer } from './markdown-renderer'
import { formatDate } from '../utils'

interface MessageBubbleProps {
  message: Message
  canEdit: boolean
  canRegenerate: boolean
}

export const MessageBubble = memo(function MessageBubble({
  message,
  canEdit,
  canRegenerate,
}: MessageBubbleProps) {
  const deleteMessage = useChatStore((s) => s.deleteMessage)
  const regenerateLast = useChatStore((s) => s.regenerateLast)
  const editAndResend = useChatStore((s) => s.editAndResend)
  const streamingThreadId = useChatStore((s) => s.streamingThreadId)
  const isStreaming = streamingThreadId === message.threadId

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const handleStartEdit = useCallback(() => {
    setEditValue(message.content)
    setEditing(true)
  }, [message.content])

  const handleSubmitEdit = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== message.content) {
      editAndResend(message.id, trimmed)
    }
    setEditing(false)
  }, [editValue, message.content, message.id, editAndResend])

  const handleCancelEdit = useCallback(() => {
    setEditing(false)
  }, [])

  return (
    <Paper
      p="sm"
      radius="md"
      bg={isUser ? 'var(--mantine-color-accent-light)' : 'var(--mantine-color-default-hover)'}
      style={{ maxWidth: isUser ? '80%' : undefined, alignSelf: isUser ? 'flex-end' : 'flex-start' }}
    >
      <Group gap={4} mb={4} justify="space-between" wrap="nowrap">
        <Group gap={4}>
          <Icon
            icon={isUser ? 'lucide:user' : 'lucide:bot'}
            width={14}
            style={{ opacity: 0.6 }}
          />
          <Text size="xs" c="dimmed">
            {formatDate(message.createdAt)}
          </Text>
        </Group>
        {!editing && (
          <Group gap={2}>
            {isUser && canEdit && !isStreaming && (
              <Tooltip label="Edit">
                <ActionIcon size="xs" variant="subtle" onClick={handleStartEdit}>
                  <Icon icon="lucide:pencil" width={12} />
                </ActionIcon>
              </Tooltip>
            )}
            {isAssistant && canRegenerate && !isStreaming && (
              <Tooltip label="Regenerate">
                <ActionIcon size="xs" variant="subtle" onClick={() => regenerateLast(message.threadId)}>
                  <Icon icon="lucide:refresh-cw" width={12} />
                </ActionIcon>
              </Tooltip>
            )}
            <CopyButton value={message.content}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'}>
                  <ActionIcon size="xs" variant="subtle" onClick={copy}>
                    <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} width={12} />
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            <Tooltip label="Delete">
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => deleteMessage(message.id)}
              >
                <Icon icon="lucide:trash-2" width={12} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>

      {editing ? (
        <div>
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.currentTarget.value)}
            minRows={2}
            maxRows={8}
            autosize
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmitEdit()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                handleCancelEdit()
              }
            }}
          />
          <Group gap="xs" justify="flex-end" mt="xs">
            <ActionIcon size="sm" variant="subtle" onClick={handleCancelEdit}>
              <Icon icon="lucide:x" width={14} />
            </ActionIcon>
            <ActionIcon size="sm" variant="filled" onClick={handleSubmitEdit} disabled={!editValue.trim()}>
              <Icon icon="lucide:send" width={14} />
            </ActionIcon>
          </Group>
        </div>
      ) : isUser ? (
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Text>
      ) : (
        <MarkdownRenderer content={message.content} />
      )}
    </Paper>
  )
})
