import { useState, useCallback, useRef, useEffect } from 'react'
import { Textarea, ActionIcon, Group, Tooltip, Text } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useChatStore } from '../store'
import { estimateTokens } from '../utils'

export function MessageInput() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const stopStreaming = useChatStore((s) => s.stopStreaming)
  const streamingThreadId = useChatStore((s) => s.streamingThreadId)
  const selectedThreadId = useChatStore((s) => s.selectedThreadId)
  const isStreaming = streamingThreadId !== null && streamingThreadId === selectedThreadId

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed)
    setInput('')
  }, [input, isStreaming, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus()
    }
  }, [isStreaming])

  const tokenEstimate = estimateTokens(input)

  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      <div style={{ flex: 1, position: 'relative' }}>
        <Textarea
          ref={textareaRef}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          minRows={1}
          maxRows={6}
          autosize
          disabled={isStreaming}
          rightSectionWidth={40}
          styles={{ input: { paddingRight: '44px' } }}
        />
        {input && (
          <Text size="xs" c="dimmed" style={{ position: 'absolute', right: 8, bottom: 6 }}>
            ~{tokenEstimate}
          </Text>
        )}
      </div>
      {isStreaming ? (
        <Tooltip label="Stop generating">
          <ActionIcon
            size="lg"
            variant="filled"
            color="red"
            onClick={stopStreaming}
            radius="md"
          >
            <Icon icon="lucide:square" width={18} />
          </ActionIcon>
        </Tooltip>
      ) : (
        <Tooltip label="Send">
          <ActionIcon
            size="lg"
            variant="filled"
            onClick={handleSend}
            disabled={!input.trim()}
            radius="md"
          >
            <Icon icon="lucide:send" width={18} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  )
}
