import { useState } from 'react'
import { GfIcon, type IconName } from '../../../framework/iconSystem'
import type { Category, SoundsState } from '../types'
import { SoundCard } from './SoundCard'

const VISIBLE_COUNT = 6

interface CategorySectionProps {
  category: Category
  soundsState: SoundsState
  isGloballyPlaying: boolean
  isLocked: boolean
  onSelect: (id: string) => void
  onUnselect: (id: string) => void
  onSetVolume: (id: string, volume: number) => void
  onToggleFavorite: (id: string) => void
}

export function CategorySection({
  category,
  soundsState,
  isGloballyPlaying,
  isLocked,
  onSelect,
  onUnselect,
  onSetVolume,
  onToggleFavorite,
}: CategorySectionProps) {
  const [showAll, setShowAll] = useState(false)
  const hasMore = category.sounds.length > VISIBLE_COUNT
  const hasHiddenSelected = !showAll && category.sounds.slice(VISIBLE_COUNT).some(s => soundsState[s.id]?.selected)

  return (
    <div className="gf-moodist__section">
      <div className="gf-moodist__section-header">
        <span className="gf-moodist__section-icon"><GfIcon name={category.icon as IconName} size={14} /></span>
        <span className="gf-moodist__section-title">{category.title}</span>
      </div>

      <div className="gf-moodist__grid">
        {category.sounds.map((sound, i) => (
          <SoundCard
            key={sound.id}
            sound={sound}
            state={soundsState[sound.id]}
            isGloballyPlaying={isGloballyPlaying}
            isLocked={isLocked}
            hidden={!showAll && i >= VISIBLE_COUNT}
            onSelect={() => onSelect(sound.id)}
            onUnselect={() => onUnselect(sound.id)}
            onSetVolume={vol => onSetVolume(sound.id, vol)}
            onToggleFavorite={() => onToggleFavorite(sound.id)}
          />
        ))}
      </div>

      {hasMore && (
        <button
          className={`gf-moodist__show-more ${hasHiddenSelected ? 'gf-moodist__show-more--active' : ''}`}
          onClick={() => setShowAll(v => !v)}
        >
          {showAll ? `Show Less` : `Show More (${category.sounds.length - VISIBLE_COUNT} more)`}
        </button>
      )}
    </div>
  )
}
