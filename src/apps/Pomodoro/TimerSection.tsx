import { TimerDisplay } from './TimerDisplay'
import { Controls } from './Controls'
import type { PomodoroState } from './types'

interface TimerSectionProps {
  state: PomodoroState
  progress: number
  phaseName: string
  isRunning: boolean
  isPaused: boolean
  isStopped: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onSkip: () => void
}

export function TimerSection(props: TimerSectionProps) {
  return (
    <div className="gf-pomodoro-section">
      <TimerDisplay state={props.state} progress={props.progress} phaseName={props.phaseName} />
      <Controls
        isRunning={props.isRunning}
        isPaused={props.isPaused}
        isStopped={props.isStopped}
        onStart={props.onStart}
        onPause={props.onPause}
        onResume={props.onResume}
        onReset={props.onReset}
        onSkip={props.onSkip}
      />
    </div>
  )
}
