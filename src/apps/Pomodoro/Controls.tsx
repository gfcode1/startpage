import { GfButton } from '../../framework/components/Button'
import { GfIcon } from '../../framework/iconSystem'

interface ControlsProps {
  isRunning: boolean
  isPaused: boolean
  isStopped: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onSkip: () => void
}

export function Controls({ isRunning, isPaused, isStopped, onStart, onPause, onResume, onReset, onSkip }: ControlsProps) {
  return (
    <div className="gf-pomodoro-controls">
      {isStopped && (
        <GfButton variant="primary" size="lg" onClick={onStart}>
          <GfIcon name="play" size={20} />
          Start
        </GfButton>
      )}
      {isRunning && (
        <GfButton variant="secondary" size="lg" onClick={onPause}>
          <GfIcon name="pause" size={20} />
          Pause
        </GfButton>
      )}
      {isPaused && (
        <GfButton variant="primary" size="lg" onClick={onResume}>
          <GfIcon name="play" size={20} />
          Resume
        </GfButton>
      )}
      {!isStopped && (
        <GfButton variant="ghost" size="md" onClick={onReset} aria-label="Reset timer">
          <GfIcon name="refresh" size={16} />
        </GfButton>
      )}
      {isRunning && (
        <GfButton variant="ghost" size="md" onClick={onSkip} aria-label="Skip to next phase">
          <GfIcon name="chevron-right" size={16} />
        </GfButton>
      )}
    </div>
  )
}
