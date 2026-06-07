import { useState } from 'react'
import { GfIcon } from '../../../framework/iconSystem'
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

  const renamePreset = (id: string) => {
    const label = prompt('New name:')
    if (label?.trim()) {
      setPresets(presets.map(p => p.id === id ? { ...p, label: label.trim() } : p))
    }
  }

  return (
    <div className="gf-moodist__panel">
      <div className="gf-moodist__panel-title">Presets</div>

      <div className="gf-moodist__row">
        <input
          className="gf-moodist__input"
          placeholder="Preset name..."
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') savePreset() }}
        />
        <button
          className="gf-moodist__btn"
          disabled={!newLabel.trim() || !hasSelection}
          onClick={savePreset}
        >
          Save
        </button>
      </div>

      {presets.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--gf-text-muted, #888)', padding: '8px 0' }}>
          Select sounds and save your mix as a preset.
        </div>
      )}

      {presets.map(p => (
        <div key={p.id} className="gf-moodist__preset-item">
          <span
            className="gf-moodist__preset-name"
            onClick={() => onApplyPreset(p.sounds)}
          >
            {p.label}
          </span>
          <button
            className="gf-moodist__preset-btn"
            onClick={() => renamePreset(p.id)}
            title="Rename"
          >
            <GfIcon name="rename" size={14} />
          </button>
          <button
            className="gf-moodist__preset-btn gf-moodist__preset-btn--danger"
            onClick={() => deletePreset(p.id)}
            title="Delete"
          >
            <GfIcon name="delete" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
