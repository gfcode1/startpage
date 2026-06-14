import { useState } from 'react'
import { Text, TextInput, Button, Group, Stack, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useLocalStorage } from '@mantine/hooks'
import { generateId } from '@/lib/utils/id'
import type { Preset, SoundsState } from '../types'

interface PresetsPanelProps {
  sounds: SoundsState
  onApplyPreset: (sounds: Record<string, number>) => void
}

export function PresetsPanel({ sounds, onApplyPreset }: PresetsPanelProps) {
  const [presets, setPresets] = useLocalStorage<Preset[]>({ key: 'moodist:presets', defaultValue: [] })
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const hasSelection = Object.values(sounds).some((s) => s.selected)

  function savePreset() {
    if (!newLabel.trim() || !hasSelection) return
    const presetSounds: Record<string, number> = {}
    for (const [id, s] of Object.entries(sounds)) {
      if (s.selected) presetSounds[id] = s.volume
    }
    setPresets([{ id: generateId(), label: newLabel.trim(), sounds: presetSounds }, ...presets])
    setNewLabel('')
  }

  return (
    <Stack gap="sm">
      <Text fw={600}>Presets</Text>

      <Group gap="sm">
        <TextInput
          placeholder="Preset name..."
          value={newLabel}
          onChange={(e) => setNewLabel(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') savePreset() }}
          style={{ flex: 1 }}
          size="sm"
        />
        <Button size="compact-sm" disabled={!newLabel.trim() || !hasSelection} onClick={savePreset}>
          Save
        </Button>
      </Group>

      {presets.length === 0 && (
        <Text ta="center" c="dimmed" size="sm" py="md">
          No presets yet. Select some sounds and save your mix.
        </Text>
      )}

      {presets.map((p) => (
        <Group key={p.id} gap="sm" wrap="nowrap">
          {editingId === p.id ? (
            <TextInput
              value={editLabel}
              onChange={(e) => setEditLabel(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { setPresets(presets.map((x) => x.id === editingId ? { ...x, label: editLabel.trim() } : x)); setEditingId(null) }
                if (e.key === 'Escape') setEditingId(null)
              }}
              onBlur={() => { if (editLabel.trim()) setPresets(presets.map((x) => x.id === editingId ? { ...x, label: editLabel.trim() } : x)); setEditingId(null) }}
              size="sm"
              autoFocus
              style={{ flex: 1 }}
            />
          ) : (
            <Text
              size="sm"
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => { onApplyPreset(p.sounds) }}
            >
              {p.label}
            </Text>
          )}
          <ActionIcon size="sm" variant="subtle" onClick={() => { setEditingId(p.id); setEditLabel(p.label) }}>
            <Icon icon="lucide:pen" width={14} />
          </ActionIcon>
          <ActionIcon size="sm" variant="subtle" color="red" onClick={() => setPresets(presets.filter((x) => x.id !== p.id))}>
            <Icon icon="lucide:trash-2" width={14} />
          </ActionIcon>
        </Group>
      ))}
    </Stack>
  )
}
