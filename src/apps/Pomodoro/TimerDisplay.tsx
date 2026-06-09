import { type PomodoroState } from './types'

interface TimerDisplayProps {
  state: PomodoroState
  progress: number
  phaseName: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function TimerDisplay({ state, progress, phaseName }: TimerDisplayProps) {
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1))

  return (
    <div className="gf-pomodoro-timer">
      <svg className="gf-pomodoro-timer__ring" viewBox="0 0 220 220" aria-hidden="true">
        <circle
          className="gf-pomodoro-timer__track"
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          strokeWidth="6"
        />
        <circle
          className="gf-pomodoro-timer__fill"
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 110 110)"
        />
      </svg>
      <div className="gf-pomodoro-timer__inner">
        <span className="gf-pomodoro-timer__phase">{phaseName}</span>
        <span className="gf-pomodoro-timer__time">{formatTime(state.timeRemaining)}</span>
        <span className="gf-pomodoro-timer__sessions">
          {state.phase !== 'idle' ? `Session ${state.sessionCount + 1}` : '\u00A0'}
        </span>
      </div>
    </div>
  )
}
