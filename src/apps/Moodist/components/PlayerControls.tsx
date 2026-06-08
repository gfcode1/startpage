import { GfIcon } from '../../../framework/iconSystem'
import { GfButton } from '../../../framework/components/Button'

interface PlayerControlsProps {
  isPlaying: boolean
  hasSelection: boolean
  onTogglePlay: () => void
  onShuffle: () => void
  onUnselectAll: () => void
}

export function PlayerControls({
  isPlaying,
  hasSelection,
  onTogglePlay,
  onShuffle,
  onUnselectAll,
}: PlayerControlsProps) {
  return (
    <div className="gf-moodist__controls">
      <GfButton
        variant="primary"
        size="sm"
        disabled={!hasSelection}
        onClick={onTogglePlay}
        title={hasSelection ? (isPlaying ? 'Pause' : 'Play') : 'Select a sound first'}
      >
        <GfIcon name={isPlaying ? 'pause' : 'play'} size={16} />
        {isPlaying ? 'Pause' : 'Play'}
      </GfButton>

      <GfButton
        variant="secondary"
        size="sm"
        onClick={onShuffle}
        title="Shuffle — pick 5 random sounds"
      >
        <GfIcon name="shuffle" size={16} />
        Shuffle
      </GfButton>

      <GfButton
        variant="secondary"
        size="sm"
        disabled={!hasSelection}
        onClick={onUnselectAll}
        title="Unselect all sounds"
      >
        <GfIcon name="clear" size={16} />
        Clear
      </GfButton>
    </div>
  )
}
