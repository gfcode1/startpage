import { useState, useCallback } from 'react'
import { Modal, TextInput, Textarea, Group, Button, Slider, Text, Stack } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Thread } from '../types'
import { useChatStore } from '../store'

interface ThreadSettingsModalProps {
  opened: boolean
  onClose: () => void
  thread: Thread
}

export function ThreadSettingsModal({ opened, onClose, thread }: ThreadSettingsModalProps) {
  const updateThreadSettings = useChatStore((s) => s.updateThreadSettings)
  const [name, setName] = useState(thread.name)
  const [systemPrompt, setSystemPrompt] = useState(thread.systemPrompt)
  const [temperature, setTemperature] = useState(thread.temperature)
  const [topP, setTopP] = useState(thread.topP)

  const handleSave = useCallback(() => {
    updateThreadSettings(thread.id, {
      name: name.trim() || thread.name,
      systemPrompt,
      temperature,
      topP,
    })
    onClose()
  }, [thread.id, thread.name, name, systemPrompt, temperature, topP, updateThreadSettings, onClose])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon icon="lucide:settings" width={18} />
          <Text fw={600}>Thread Settings</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label="Thread name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          leftSection={<Icon icon="lucide:message-square" width={16} />}
        />

        <Textarea
          label="System prompt"
          description="Instructions for the AI about how to behave"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.currentTarget.value)}
          minRows={3}
          maxRows={6}
          autosize
          placeholder="You are a helpful assistant..."
        />

        <div>
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={500}>Temperature</Text>
            <Text size="sm" c="dimmed">{temperature.toFixed(1)}</Text>
          </Group>
          <Slider
            value={temperature}
            onChange={setTemperature}
            min={0}
            max={2}
            step={0.1}
            marks={[
              { value: 0, label: '0' },
              { value: 1, label: '1' },
              { value: 2, label: '2' },
            ]}
          />
          <Text size="xs" c="dimmed" mt={2}>Lower = more deterministic, Higher = more creative</Text>
        </div>

        <div>
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={500}>Top P</Text>
            <Text size="sm" c="dimmed">{topP.toFixed(1)}</Text>
          </Group>
          <Slider
            value={topP}
            onChange={setTopP}
            min={0}
            max={1}
            step={0.1}
            marks={[
              { value: 0, label: '0' },
              { value: 0.5, label: '0.5' },
              { value: 1, label: '1' },
            ]}
          />
          <Text size="xs" c="dimmed" mt={2}>Nucleus sampling threshold</Text>
        </div>

        <Group justify="flex-end" mt="sm">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
