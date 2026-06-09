import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../framework/iconSystem'
import { GfWidgetAction } from '../../framework/components/WidgetAction'
import { usePomodoro } from './usePomodoro'
import './index.css'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function PomodoroWidget() {
  const navigate = useNavigate()
  const {
    state,
    isRunning,
    isPaused,
    isStopped,
    phaseName,
    progress,
    start,
    pause,
    resume,
    reset,
  } = usePomodoro()

  if (isStopped && state.phase === 'idle') {
    return (
      <div className="gf-widget-pomodoro">
        <div className="gf-widget-pomodoro__header">
          <span className="gf-widget-pomodoro__label">Pomodoro</span>
          <button className="gf-widget-pomodoro__open" onClick={() => navigate('/pomodoro')} aria-label="Open Pomodoro">
            <GfIcon name="chevron-right" size={14} />
          </button>
        </div>
        <GfWidgetAction label="Start focusing" onClick={start} />
      </div>
    )
  }

  return (
    <div className="gf-widget-pomodoro">
      <div className="gf-widget-pomodoro__header">
        <span className="gf-widget-pomodoro__label">Pomodoro</span>
        <button className="gf-widget-pomodoro__open" onClick={() => navigate('/pomodoro')} aria-label="Open Pomodoro">
          <GfIcon name="chevron-right" size={14} />
        </button>
      </div>

      <div className="gf-widget-pomodoro__timer">
        <span className="gf-widget-pomodoro__phase">{phaseName}</span>
        <span className="gf-widget-pomodoro__time">{formatTime(state.timeRemaining)}</span>
      </div>

      <div className="gf-widget-pomodoro__bar">
        <div className="gf-widget-pomodoro__bar-fill" style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }} />
      </div>

      <div className="gf-widget-pomodoro__actions">
        {isRunning && (
          <button className="gf-widget-pomodoro__btn" onClick={pause} aria-label="Pause">
            <GfIcon name="pause" size={18} />
          </button>
        )}
        {isPaused && (
          <button className="gf-widget-pomodoro__btn gf-widget-pomodoro__btn--primary" onClick={resume} aria-label="Resume">
            <GfIcon name="play" size={18} />
          </button>
        )}
        {isStopped && (
          <button className="gf-widget-pomodoro__btn gf-widget-pomodoro__btn--primary" onClick={start} aria-label="Start">
            <GfIcon name="play" size={18} />
          </button>
        )}
        {!isStopped && (
          <button className="gf-widget-pomodoro__btn" onClick={reset} aria-label="Reset">
            <GfIcon name="refresh" size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
