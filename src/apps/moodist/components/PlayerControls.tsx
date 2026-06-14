import { Button, Group } from '@mantine/core'
import { Icon } from '@iconify/react'

interface PlayerControlsProps {
  isPlaying: boolean
  hasSelection: boolean
  onTogglePlay: () => void
  onShuffle: () => void
  onUnselectAll: () => void
}

export function PlayerControls({
  isPlaying, hasSelection, onTogglePlay, onShuffle, onUnselectAll,
}: PlayerControlsProps) {
  return (
    <Group gap="sm" mb="md">
      <Button
        variant="filled"
        size="sm"
        disabled={!hasSelection}
        onClick={onTogglePlay}
        leftSection={<Icon icon={isPlaying ? 'lucide:pause' : 'lucide:play'} width={16} />}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      <Button
        variant="light"
        size="sm"
        onClick={onShuffle}
        leftSection={<Icon icon="lucide:shuffle" width={16} />}
      >
        Shuffle
      </Button>
      <Button
        variant="light"
        size="sm"
        disabled={!hasSelection}
        onClick={onUnselectAll}
        leftSection={<Icon icon="lucide:x" width={16} />}
      >
        Clear
      </Button>
    </Group>
  )
}
