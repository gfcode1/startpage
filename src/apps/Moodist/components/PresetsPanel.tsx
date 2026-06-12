import { useState } from 'react'
import { GfIcon } from '../../../framework/iconSystem'
import { GfButton } from '../../../framework/components/Button'
import { GfEmptyState } from '../../../framework/components/EmptyState'
import { useAppStorage } from '../../../framework/persistence/useAppStorage'
import type { Preset, SoundsState } from '../types'

const APP_ID = 'moodist'

interface PresetsPanelProps {
  sounds: SoundsState
  onApplyPreset: (sounds: Record<string, number>) => void
}

export function PresetsPanel({ sounds, onApplyPreset }: PresetsPanelProps) {
  const [presets, setPresets] = useAppStorage<Preset[]>(APP_ID, 'presets', [])
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const hasSelection = Object.values(sounds).some(s => s.selected)

  const savePreset = () => {
    if (!newLabel.trim() || !hasSelection) return
    const presetSounds: Record<string, number> = {}
    for (const [id, s] of Object.entries(sounds)) {
      if (s.selected) {
        presetSounds[id] = s.volume
      }
    }
    const preset: Preset = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      sounds: presetSounds,
    }
    setPresets([preset, ...presets])
    setNewLabel('')
  }

  const deletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id))
  }

  const startRename = (p: Preset) => {
    setEditingId(p.id)
    setEditLabel(p.label)
  }

  const confirmRename = () => {
    if (editingId && editLabel.trim()) {
      setPresets(presets.map(p => p.id === editingId ? { ...p, label: editLabel.trim() } : p))
    }
    setEditingId(null)
    setEditLabel('')
  }

  const handleApply = (p: Preset) => {
    onApplyPreset(p.sounds)
  }

  return (
    <div className="gf-moodist__panel">
      <div className="gf-moodist__panel-title">Presets</div>

      <div className="gf-moodist__row">
        <input
          className="gf-moodist__input"
          placeholder="Preset name..."
          aria-label="Preset name"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') savePreset() }}
        />
        <GfButton
          variant="primary"
          size="sm"
          disabled={!newLabel.trim() || !hasSelection}
          onClick={savePreset}
        >
          Save
        </GfButton>
      </div>

      {presets.length === 0 && (
        <GfEmptyState
          icon={<GfIcon name="sparkles" size={24} />}
          title="No presets yet"
          description="Select some sounds, adjust volumes, then save your mix as a preset."
        />
      )}

      {presets.map(p => (
        <div key={p.id} className="gf-moodist__preset-item">
          {editingId === p.id ? (
            <input
              className="gf-moodist__input"
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmRename()
                if (e.key === 'Escape') setEditingId(null)
              }}
              onBlur={confirmRename}
              autoFocus
            />
          ) : (
            <span
              className="gf-moodist__preset-name"
              onClick={() => handleApply(p)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleApply(p) }}
              tabIndex={0}
              role="button"
              aria-label={`Apply preset ${p.label}`}
            >
              {p.label}
            </span>
          )}
          <button
            className="gf-moodist__preset-btn"
            onClick={() => startRename(p)}
            title="Rename"
            aria-label={`Rename preset ${p.label}`}
          >
            <GfIcon name="rename" size={14} />
          </button>
          <button
            className="gf-moodist__preset-btn gf-moodist__preset-btn--danger"
            onClick={() => deletePreset(p.id)}
            title="Delete"
            aria-label={`Delete preset ${p.label}`}
          >
            <GfIcon name="delete" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
