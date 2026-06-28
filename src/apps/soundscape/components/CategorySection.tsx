import { useState } from 'react'
import { Text, SimpleGrid, Paper } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Category, SoundsState } from '../types'
import { SoundCard } from './SoundCard'

const VISIBLE_COUNT = 6

interface CategorySectionProps {
  category: Category
  soundsState: SoundsState
  isGloballyPlaying: boolean
  masterVolume: number
  searchQuery: string
  isFavorites?: boolean
  onSelect: (id: string) => void
  onUnselect: (id: string) => void
  onSetVolume: (id: string, volume: number) => void
  onToggleFavorite: (id: string) => void
}

export function CategorySection({
  category, soundsState, isGloballyPlaying, masterVolume,
  searchQuery, isFavorites,
  onSelect, onUnselect, onSetVolume, onToggleFavorite,
}: CategorySectionProps) {
  const [showAll, setShowAll] = useState(false)

  const filteredSounds = searchQuery
    ? category.sounds.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : category.sounds

  if (filteredSounds.length === 0) return null

  const hasMore = filteredSounds.length > VISIBLE_COUNT
  const hasHiddenSelected = !showAll && filteredSounds.slice(VISIBLE_COUNT).some((s) => soundsState[s.id]?.selected)
  const visible = showAll ? filteredSounds : filteredSounds.slice(0, VISIBLE_COUNT)

  return (
    <Paper p={isFavorites ? 'sm' : undefined} mb="lg" style={isFavorites ? { border: '1px solid var(--mantine-color-accent-3)' } : undefined}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon icon={category.icon} width={16} style={isFavorites ? { color: 'var(--mantine-color-accent-5)' } : undefined} />
        <Text fw={600} size="sm">{category.title}</Text>
        <Text size="xs" c="dimmed">({filteredSounds.length} sounds)</Text>
      </div>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="sm">
        {visible.map((sound) => (
          <SoundCard
            key={sound.id}
            sound={sound}
            state={soundsState[sound.id] ?? { selected: false, favorite: false, volume: 0.5 }}
            isGloballyPlaying={isGloballyPlaying}
            masterVolume={masterVolume}
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
            border: '1px dashed var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--mantine-font-size-xs)',
            color: hasHiddenSelected ? 'var(--mantine-color-accent-5)' : 'light-dark(var(--mantine-color-gray-6), var(--mantine-color-dark-3))',
          }}
        >
          {showAll ? 'Show Less' : `Show More (${filteredSounds.length - VISIBLE_COUNT} more)`}
        </div>
      )}
    </Paper>
  )
}
