import { useState, useCallback } from 'react'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfEmptyState } from '../../framework/components/EmptyState'
import { GfIcon } from '../../framework/iconSystem'
import { TimerSection } from './TimerSection'
import { Stats } from './Stats'
import { Settings } from './Settings'
import { usePomodoro } from './usePomodoro'
import type { PomodoroSettings, CompletedSession } from './types'
import { DEFAULT_SETTINGS } from './types'
import './index.css'

export default function PomodoroApp() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useAppStorage<PomodoroSettings>('pomodoro', 'settings', DEFAULT_SETTINGS)
  const [sessions] = useAppStorage<CompletedSession[]>('pomodoro', 'sessions', [])
  const {
    state,
    dailyStats,
    start,
    pause,
    resume,
    reset,
    skip,
    progress,
    phaseName,
    isRunning,
    isPaused,
    isStopped,
  } = usePomodoro()

  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter(s => s.date === today && s.type === 'work').length

  const noData = isStopped && state.phase === 'idle' && sessions.length === 0

  return (
    <div className="gf-pomodoro">
      <AppHeader
        badge={isRunning ? 'Running' : isPaused ? 'Paused' : undefined}
        count={todaySessions}
        countLabel="today"
      />

      {noData ? (
        <div className="gf-pomodoro__empty">
          <GfEmptyState
            icon={<GfIcon name="play" size={32} />}
            title="Pomodoro Timer"
            description="Focus on what matters. Start a timer and get things done."
            action={{ label: 'Start First Session', onClick: start }}
          />
        </div>
      ) : (
        <div className="gf-pomodoro__content">
          <TimerSection
            state={state}
            progress={progress}
            phaseName={phaseName}
            isRunning={isRunning}
            isPaused={isPaused}
            isStopped={isStopped}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
            onSkip={skip}
          />

          <Stats dailyStats={dailyStats} sessionsCompleted={todaySessions} />
        </div>
      )}

      <button className="gf-pomodoro__settings-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
        <GfIcon name="settings" size={18} />
      </button>

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={useCallback((s: PomodoroSettings) => setSettings(s), [setSettings])}
      />
    </div>
  )
}
