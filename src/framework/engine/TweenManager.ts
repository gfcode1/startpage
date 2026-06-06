import type { EasingFn } from './types'
import { EASING } from './types'

interface TweenConfig {
  target: Record<string, number>
  to: Record<string, number>
  duration: number
  easing?: EasingFn | string
  delay?: number
  onComplete?: () => void
}

interface ActiveTween {
  target: Record<string, number>
  from: Record<string, number>
  to: Record<string, number>
  duration: number
  elapsed: number
  delay: number
  delayElapsed: number
  easing: EasingFn
  keys: string[]
  onComplete?: () => void
  done: boolean
}

export class TweenManager {
  private tweens: ActiveTween[] = []

  add(config: TweenConfig): void {
    const easing =
      typeof config.easing === 'string'
        ? EASING[config.easing] || EASING.easeOutCubic
        : config.easing || EASING.easeOutCubic

    const keys = Object.keys(config.to)
    const from: Record<string, number> = {}

    for (const k of keys) {
      from[k] = config.target[k] ?? 0
    }

    this.tweens.push({
      target: config.target,
      from,
      to: config.to,
      duration: config.duration,
      elapsed: 0,
      delay: config.delay ?? 0,
      delayElapsed: 0,
      easing,
      keys,
      onComplete: config.onComplete,
      done: false,
    })
  }

  update(dt: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i]
      if (tw.done) {
        this.tweens.splice(i, 1)
        continue
      }

      if (tw.delayElapsed < tw.delay) {
        tw.delayElapsed += dt
        continue
      }

      tw.elapsed += dt
      const t = Math.min(tw.elapsed / tw.duration, 1)
      const eased = tw.easing(t)

      for (const k of tw.keys) {
        tw.target[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * eased
      }

      if (t >= 1) {
        tw.done = true
        tw.onComplete?.()
      }
    }
  }

  clear(): void {
    this.tweens = []
  }

  get active(): boolean {
    return this.tweens.length > 0
  }
}
