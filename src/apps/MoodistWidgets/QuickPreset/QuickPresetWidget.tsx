import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../../framework/iconSystem'
import { GfWidgetAction } from '../../../framework/components/WidgetAction'
import { useAppStorage } from '../../../framework/persistence/useAppStorage'
import type { Preset } from '../../Moodist/types'

export default function QuickPresetWidget() {
  const navigate = useNavigate()
  const [presets] = useAppStorage<Preset[]>('moodist', 'presets', [])

  if (presets.length === 0) {
    return (
      <div className="gf-widget-quickpreset">
        <GfWidgetAction label="Save a preset in Moodist" onClick={() => navigate('/moodist')} />
      </div>
    )
  }

  return (
    <div className="gf-widget-quickpreset">
      <div className="gf-widget-quickpreset__header">
        <GfIcon name="sparkles" size={14} />
        <span className="gf-widget-quickpreset__label">Quick Presets</span>
      </div>
      <div className="gf-widget-quickpreset__list">
        {presets.slice(0, 4).map(p => (
          <button
            key={p.id}
            className="gf-widget-quickpreset__item"
onClick={() => navigate('/moodist')}
            title={`Apply preset: ${p.label}`}
            aria-label={`Apply preset ${p.label}`}
          >
            <span className="gf-widget-quickpreset__name">{p.label}</span>
            <span className="gf-widget-quickpreset__count">{Object.keys(p.sounds).length}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
