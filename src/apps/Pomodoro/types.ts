export type PomodoroPhase = 'idle' | 'work' | 'break' | 'longBreak'
export type PomodoroStatus = 'stopped' | 'running' | 'paused'

export interface PomodoroState {
  phase: PomodoroPhase
  status: PomodoroStatus
  timeRemaining: number
  sessionCount: number
  lastTick: number
  currentTaskId: string | null
}

export interface PomodoroSettings {
  workDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
  soundEnabled: boolean
  autoStartBreaks: boolean
  autoStartWork: boolean
}

export interface CompletedSession {
  id: string
  date: string
  type: 'work' | 'break' | 'longBreak'
  duration: number
  completedAt: string
}

export interface DailyStats {
  date: string
  sessionsCompleted: number
  focusTime: number
}

export const DEFAULT_STATE: PomodoroState = {
  phase: 'idle',
  status: 'stopped',
  timeRemaining: 25 * 60,
  sessionCount: 0,
  lastTick: Date.now(),
  currentTaskId: null,
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  autoStartBreaks: true,
  autoStartWork: true,
}

export const PHASE_LABELS: Record<PomodoroPhase, string> = {
  idle: 'Ready',
  work: 'Focus',
  break: 'Break',
  longBreak: 'Long Break',
}

export const PHASE_ICONS: Record<PomodoroPhase, string> = {
  idle: 'play',
  work: 'play',
  break: 'coffee',
  longBreak: 'coffee',
}
