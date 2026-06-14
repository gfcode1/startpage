import { useState } from 'react'
import { Text, SimpleGrid } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Category, SoundsState } from '../types'
import { SoundCard } from './SoundCard'

const VISIBLE_COUNT = 6

interface CategorySectionProps {
  category: Category
  soundsState: SoundsState
  isGloballyPlaying: boolean
  onSelect: (id: string) => void
  onUnselect: (id: string) => void
  onSetVolume: (id: string, volume: number) => void
  onToggleFavorite: (id: string) => void
}

export function CategorySection({
  category, soundsState, isGloballyPlaying,
  onSelect, onUnselect, onSetVolume, onToggleFavorite,
}: CategorySectionProps) {
  const [showAll, setShowAll] = useState(false)
  const hasMore = category.sounds.length > VISIBLE_COUNT
  const hasHiddenSelected = !showAll && category.sounds.slice(VISIBLE_COUNT).some((s) => soundsState[s.id]?.selected)
  const visible = showAll ? category.sounds : category.sounds.slice(0, VISIBLE_COUNT)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon icon={category.icon} width={16} />
        <Text fw={600} size="sm">{category.title}</Text>
        <Text size="xs" c="dimmed">({category.sounds.length} sounds)</Text>
      </div>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="sm">
        {visible.map((sound) => (
          <SoundCard
            key={sound.id}
            sound={sound}
            state={soundsState[sound.id] ?? { selected: false, favorite: false, volume: 0.5 }}
            isGloballyPlaying={isGloballyPlaying}
            hidden={false}
            onSelect={() => onSelect(sound.id)}
            onUnselect={() => onUnselect(sound.id)}
            onSetVolume={(vol) => onSetVolume(sound.id, vol)}
            onToggleFavorite={() => onToggleFavorite(sound.id)}
          />
        ))}
      </SimpleGrid>

      {hasMore && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowAll((v) => !v)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAll((v) => !v) }}
          style={{
            marginTop: 8,
            padding: 8,
            textAlign: 'center',
            border: '1px dashed var(--mantine-color-dark-6)',
            borderRadius: 5,
            cursor: 'pointer',
            fontSize: '0.75rem',
            color: hasHiddenSelected ? 'var(--mantine-color-accent-5)' : 'var(--mantine-color-dark-3)',
          }}
        >
          {showAll ? 'Show Less' : `Show More (${category.sounds.length - VISIBLE_COUNT} more)`}
        </div>
      )}
    </div>
  )
}
