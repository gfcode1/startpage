export type Direction = 'up' | 'down' | 'left' | 'right'

export type EasingFn = (t: number) => number

export type GameEventCallback = {
  onScoreChange?: (score: number) => void
  onBestScoreChange?: (score: number) => void
  onGameOver?: (score: number) => void
  onWin?: (score: number) => void
  onPauseState?: (paused: boolean) => void
}

export const EASING: Record<string, EasingFn> = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeOutBack: (t: number) => {
    const c = 1.70158
    return 1 + c * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
  },
  easeOutElastic: (t: number) => {
    if (t === 0 || t === 1) return t
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
  },
}
