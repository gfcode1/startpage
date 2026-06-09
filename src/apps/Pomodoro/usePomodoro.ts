import { useCallback, useEffect, useRef } from 'react'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { useToast } from '../../framework/ToastContext'
import { useAppBadge } from '../../framework/AppBadgeContext'
import {
  type PomodoroState,
  type PomodoroSettings,
  type CompletedSession,
  type DailyStats,
  DEFAULT_STATE,
  DEFAULT_SETTINGS,
} from './types'

const APP_ID = 'pomodoro'

function playNotification() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
    setTimeout(() => ctx.close(), 500)
  } catch {
    /* audio not available */
  }
}

export function usePomodoro() {
  const [state, setState] = useAppStorage<PomodoroState>(APP_ID, 'state', DEFAULT_STATE)
  const [settings] = useAppStorage<PomodoroSettings>(APP_ID, 'settings', DEFAULT_SETTINGS)
  const [sessions, setSessions] = useAppStorage<CompletedSession[]>(APP_ID, 'sessions', [])
  const [dailyStats, setDailyStats] = useAppStorage<DailyStats[]>(APP_ID, 'dailyStats', [])
  const { addToast } = useToast()
  const { setBadge } = useAppBadge('pomodoro')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const getDurationForPhase = useCallback(
    (phase: string): number => {
      if (phase === 'work') return settings.workDuration * 60
      if (phase === 'break') return settings.breakDuration * 60
      if (phase === 'longBreak') return settings.longBreakDuration * 60
      return 0
    },
    [settings],
  )

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    setState(prev => {
      const elapsed = Math.floor((Date.now() - prev.lastTick) / 1000)
      const remaining = Math.max(0, prev.timeRemaining - elapsed)

      if (remaining <= 0) {
        return { ...prev, timeRemaining: 0, lastTick: Date.now() }
      }

      return { ...prev, timeRemaining: remaining, lastTick: Date.now() }
    })
  }, [setState])

  const recordSession = useCallback(
    (phase: string) => {
      const session: CompletedSession = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: today,
        type: phase as CompletedSession['type'],
        duration: phase === 'work' ? settings.workDuration : phase === 'break' ? settings.breakDuration : settings.longBreakDuration,
        completedAt: new Date().toISOString(),
      }
      setSessions(prev => [...prev, session])

      if (phase === 'work') {
        setDailyStats(prev => {
          const existing = prev.find(s => s.date === today)
          if (existing) {
            return prev.map(s =>
              s.date === today
                ? { ...s, sessionsCompleted: s.sessionsCompleted + 1, focusTime: s.focusTime + settings.workDuration }
                : s,
            )
          }
          return [...prev, { date: today, sessionsCompleted: 1, focusTime: settings.workDuration }]
        })
      }
    },
    [today, settings, setSessions, setDailyStats],
  )

  const transitionToNextPhase = useCallback(
    (prev: PomodoroState): PomodoroState => {
      const newSessionCount = prev.sessionCount + 1

      if (prev.phase === 'work') {
        const isLongBreak = newSessionCount >= settings.sessionsBeforeLongBreak
        const nextPhase = isLongBreak ? 'longBreak' : 'break'
        const duration = isLongBreak ? settings.longBreakDuration * 60 : settings.breakDuration * 60
        addToast('Focus session complete!', 'success')
        if (settings.soundEnabled) playNotification()
        return {
          ...prev,
          phase: nextPhase,
          status: settings.autoStartBreaks ? 'running' : 'stopped',
          timeRemaining: duration,
          sessionCount: settings.autoStartBreaks ? 0 : newSessionCount,
          lastTick: Date.now(),
        }
      }

      addToast('Break is over! Time to focus.', 'info')
      if (settings.soundEnabled) playNotification()
      return {
        ...prev,
        phase: 'work',
        status: settings.autoStartWork ? 'running' : 'stopped',
        timeRemaining: settings.workDuration * 60,
        sessionCount: 0,
        lastTick: Date.now(),
      }
    },
    [settings, addToast],
  )

  useEffect(() => {
    if (state.status === 'running') {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clearTimer()
    }
    return clearTimer
  }, [state.status, tick, clearTimer])

  useEffect(() => {
    if (state.status === 'running' && state.timeRemaining <= 0) {
      clearTimer()
      recordSession(state.phase)
      setState(prev => transitionToNextPhase(prev))
    }
  }, [state.status, state.timeRemaining, state.phase, clearTimer, recordSession, setState, transitionToNextPhase])

  useEffect(() => {
    if (state.status === 'running' && state.phase === 'work') {
      setBadge(1)
    } else {
      setBadge(0)
    }
  }, [state.status, state.phase, setBadge])

  const start = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: prev.phase === 'idle' ? 'work' : prev.phase,
      status: 'running',
      timeRemaining:
        prev.phase === 'idle'
          ? settings.workDuration * 60
          : prev.timeRemaining,
      lastTick: Date.now(),
    }))
  }, [settings, setState])

  const pause = useCallback(() => {
    clearTimer()
    setState(prev => ({ ...prev, status: 'paused', lastTick: Date.now() }))
  }, [clearTimer, setState])

  const resume = useCallback(() => {
    setState(prev => ({ ...prev, status: 'running', lastTick: Date.now() }))
  }, [setState])

  const reset = useCallback(() => {
    clearTimer()
    setState({
      ...DEFAULT_STATE,
      timeRemaining: settings.workDuration * 60,
      lastTick: Date.now(),
    })
  }, [settings, clearTimer, setState])

  const skip = useCallback(() => {
    clearTimer()
    setState(prev => {
      recordSession(prev.phase)
      return transitionToNextPhase(prev)
    })
  }, [clearTimer, setState, recordSession, transitionToNextPhase])

  const progress =
    state.phase === 'idle'
      ? 0
      : 1 - state.timeRemaining / getDurationForPhase(state.phase)

  const phaseName =
    state.phase === 'idle'
      ? 'Ready'
      : state.phase === 'work'
        ? 'Focus'
        : state.phase === 'longBreak'
          ? 'Long Break'
          : 'Break'

  return {
    state,
    settings,
    sessions,
    dailyStats,
    start,
    pause,
    resume,
    reset,
    skip,
    progress,
    phaseName,
    isRunning: state.status === 'running',
    isPaused: state.status === 'paused',
    isStopped: state.status === 'stopped',
  }
}
