import { Button, Group, Slider, Text } from '@mantine/core'
import { Icon } from '@iconify/react'

interface PlayerControlsProps {
  isPlaying: boolean
  hasSelection: boolean
  masterVolume: number
  onTogglePlay: () => void
  onShuffle: () => void
  onUnselectAll: () => void
  onSetMasterVolume: (volume: number) => void
}

export function PlayerControls({
  isPlaying, hasSelection, masterVolume,
  onTogglePlay, onShuffle, onUnselectAll, onSetMasterVolume,
}: PlayerControlsProps) {
  return (
    <Group gap="sm" mb="md" wrap="wrap">
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
      <Group gap={4} ml="sm">
        <Icon icon="lucide:volume-2" width={14} />
        <Slider
          value={masterVolume}
          onChange={onSetMasterVolume}
          min={0}
          max={1}
          step={0.01}
          size="xs"
          style={{ width: 100 }}
          aria-label="Master volume"
        />
        <Text size="xs" w={32} ta="right">{Math.round(masterVolume * 100)}%</Text>
      </Group>
    </Group>
  )
}
