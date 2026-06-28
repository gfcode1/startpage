import { useState, useCallback } from 'react'
import { Select, TextInput, Group, ActionIcon, Tooltip } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useChatStore } from '../store'
import { getApiKey } from '../utils'

const POPULAR_MODELS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { value: 'openai/o1', label: 'o1 (OpenAI)' },
  { value: 'openai/o3-mini', label: 'o3-mini (OpenAI)' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'google/gemini-2.0-pro', label: 'Gemini 2.0 Pro' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
  { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
  { value: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
  { value: 'mistralai/mistral-large', label: 'Mistral Large' },
]

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
  size?: 'xs' | 'sm' | 'md'
}

export function ModelSelector({ value, onChange, size = 'sm' }: ModelSelectorProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customModel, setCustomModel] = useState('')
  const modelsCache = useChatStore((s) => s.modelsCache)
  const modelsLoading = useChatStore((s) => s.modelsLoading)
  const loadModels = useChatStore((s) => s.loadModels)
  const apiKey = getApiKey()

  const modelOptions = modelsCache.length > 0
    ? modelsCache.map((m) => ({ value: m.id, label: m.name || m.id }))
    : POPULAR_MODELS

  const isCustom = !modelOptions.some((m) => m.value === value) && value !== ''
  const selectData = isCustom
    ? [...modelOptions, { value: '__custom__', label: value }]
    : modelOptions

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customModel.trim()
    if (trimmed) {
      onChange(trimmed)
      setCustomModel('')
      setShowCustom(false)
    }
  }, [customModel, onChange])

  if (showCustom) {
    return (
      <Group gap={4} wrap="nowrap">
        <TextInput
          size={size}
          placeholder="provider/model-id"
          value={customModel}
          onChange={(e) => setCustomModel(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit() }}
          style={{ flex: 1 }}
        />
        <Tooltip label="Confirm">
          <ActionIcon size={size === 'xs' ? 22 : 28} variant="light" onClick={handleCustomSubmit}>
            <Icon icon="lucide:check" width={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Cancel">
          <ActionIcon size={size === 'xs' ? 22 : 28} variant="subtle" onClick={() => setShowCustom(false)}>
            <Icon icon="lucide:x" width={14} />
          </ActionIcon>
        </Tooltip>
      </Group>
    )
  }

  return (
    <Group gap={4} wrap="nowrap" style={{ flex: 1 }}>
      <Select
        size={size}
        data={selectData}
        value={isCustom ? '__custom__' : value}
        onChange={(val) => {
          if (val === '__custom__') {
            setShowCustom(true)
          } else if (val) {
            onChange(val)
          }
        }}
        placeholder="Select model"
        searchable
        clearable={false}
        style={{ flex: 1, minWidth: 0 }}
      />
      {apiKey && (
        <Tooltip label="Fetch models from OpenRouter">
          <ActionIcon
            size={size === 'xs' ? 22 : 28}
            variant="subtle"
            onClick={loadModels}
            loading={modelsLoading}
          >
            <Icon icon="lucide:refresh-cw" width={14} />
          </ActionIcon>
        </Tooltip>
      )}
      <Tooltip label="Custom model">
        <ActionIcon
          size={size === 'xs' ? 22 : 28}
          variant="subtle"
          onClick={() => setShowCustom(true)}
        >
          <Icon icon="lucide:pencil" width={14} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}
