import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../../framework/iconSystem'
import { GfWidgetAction } from '../../../framework/components/WidgetAction'
import { useAppStorage } from '../../../framework/persistence/useAppStorage'
import type { SoundsState } from '../../Moodist/types'

export default function SoundboardWidget() {
  const navigate = useNavigate()
  const [sounds] = useAppStorage<SoundsState | undefined>('moodist', 'state', undefined)

  if (!sounds) {
    return (
      <div className="gf-widget-soundboard">
        <GfWidgetAction label="Open Moodist to start" onClick={() => navigate('/moodist')} />
      </div>
    )
  }

  const favoriteIds = Object.entries(sounds)
    .filter(([, s]) => s.favorite)
    .slice(0, 6)
    .map(([id]) => id)

  const selectedCount = Object.values(sounds).filter(s => s.selected).length

  return (
    <div className="gf-widget-soundboard">
      <div className="gf-widget-soundboard__header">
        <GfIcon name="wave-sine" size={14} />
        <span className="gf-widget-soundboard__label">Soundboard</span>
        {selectedCount > 0 && (
          <span className="gf-widget-soundboard__badge">{selectedCount}</span>
        )}
      </div>
      {favoriteIds.length > 0 ? (
        <div className="gf-widget-soundboard__grid">
          {favoriteIds.map(id => (
            <button
              key={id}
              className={`gf-widget-soundboard__chip ${sounds[id]?.selected ? 'gf-widget-soundboard__chip--active' : ''}`}
              onClick={() => navigate('/moodist')}
            >
              {id.split('-').pop()}
            </button>
          ))}
        </div>
      ) : (
        <span className="gf-widget-soundboard__empty">Favorite sounds to see them here</span>
      )}
    </div>
  )
}
