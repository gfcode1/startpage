import type { GameEventCallback } from './types'
import type { StorageProvider } from '../storage/types'
import { TweenManager } from './TweenManager'
import { InputManager } from './InputManager'
import { AudioEngine } from './AudioEngine'

export interface GameEngineOptions {
  storage?: StorageProvider
  audio?: AudioEngine
  callbacks?: GameEventCallback
}

const MAX_DT = 100
const MIN_CANVAS_SIZE = 280

export abstract class GameEngine {
  protected canvas: HTMLCanvasElement
  protected ctx: CanvasRenderingContext2D
  protected width = 0
  protected height = 0
  protected dpr = 1
  protected tweens: TweenManager
  protected input: InputManager
  readonly audio?: AudioEngine
  protected storage?: StorageProvider
  protected callbacks?: GameEventCallback

  private rafId = 0
  private lastTime = 0
  private _running = false
  private _paused = false
  private boundLoop: (t: number) => void
  private boundResize: () => void
  private boundVisibility: () => void
  private boundBlur: () => void

  constructor(canvas: HTMLCanvasElement, options?: GameEngineOptions) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Cannot get 2d context')
    this.ctx = context

    this.storage = options?.storage
    this.audio = options?.audio
    this.callbacks = options?.callbacks

    this.tweens = new TweenManager()
    this.input = new InputManager(canvas)

    this.boundLoop = this.loop.bind(this)
    this.boundResize = this.resize.bind(this)
    this.boundVisibility = this.onVisibility.bind(this)
    this.boundBlur = () => this.pause()
  }

  abstract init(): void
  protected abstract update(dt: number): void
  protected abstract render(ctx: CanvasRenderingContext2D): void

  protected onPause(): void {}
  protected onResume(): void {}

  start(): void {
    if (this._running) return
    this._running = true
    this._paused = false
    this.resize()
    this.lastTime = performance.now()
    window.addEventListener('resize', this.boundResize)
    document.addEventListener('visibilitychange', this.boundVisibility)
    window.addEventListener('blur', this.boundBlur)
    this.rafId = requestAnimationFrame(this.boundLoop)
  }

  stop(): void {
    if (!this._running) return
    this._running = false
    cancelAnimationFrame(this.rafId)
    window.removeEventListener('resize', this.boundResize)
    document.removeEventListener('visibilitychange', this.boundVisibility)
    window.removeEventListener('blur', this.boundBlur)
  }

  destroy(): void {
    this.stop()
    this.input.destroy()
  }

  pause(): void {
    if (this._paused || !this._running) return
    this._paused = true
    this.onPause()
    this.callbacks?.onPauseState?.(true)
  }

  resume(): void {
    if (!this._paused) return
    this._paused = false
    this.lastTime = performance.now()
    this.onResume()
    this.callbacks?.onPauseState?.(false)
  }

  get paused(): boolean {
    return this._paused
  }

  get running(): boolean {
    return this._running
  }

  protected getCssVar(name: string): string {
    return getComputedStyle(this.canvas).getPropertyValue(name).trim()
  }

  private loop(time: number): void {
    if (!this._running) return
    this.rafId = requestAnimationFrame(this.boundLoop)
    if (this._paused) return

    const rawDt = time - this.lastTime
    this.lastTime = time
    const dt = Math.min(rawDt, MAX_DT)

    this.tweens.update(dt)
    this.update(dt)
    this.render(this.ctx)
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = window.devicePixelRatio || 1
    const w = Math.max(rect.width, MIN_CANVAS_SIZE)
    const h = Math.max(rect.height, MIN_CANVAS_SIZE)
    this.width = w
    this.height = h
    this.canvas.width = w * this.dpr
    this.canvas.height = h * this.dpr
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private onVisibility(): void {
    if (document.hidden) {
      this.saveState()
      this.pause()
    }
  }

  protected saveState(): void {
    const data = this.serialize()
    if (data && this.storage) {
      this.storage.setItem('gameState', data)
    }
  }

  protected loadState<T>(): T | null {
    return this.storage?.getItem<T>('gameState') ?? null
  }

  protected clearSavedState(): void {
    this.storage?.removeItem('gameState')
  }

  serialize(): unknown {
    return null
  }

  deserialize(_data: unknown): void {}

  // drawing helpers

  protected cls(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  protected roundRect(
    x: number, y: number, w: number, h: number, r: number
  ): void {
    const c = this.ctx
    c.beginPath()
    c.moveTo(x + r, y)
    c.lineTo(x + w - r, y)
    c.arcTo(x + w, y, x + w, y + r, r)
    c.lineTo(x + w, y + h - r)
    c.arcTo(x + w, y + h, x + w - r, y + h, r)
    c.lineTo(x + r, y + h)
    c.arcTo(x, y + h, x, y + h - r, r)
    c.lineTo(x, y + r)
    c.arcTo(x, y, x + r, y, r)
    c.closePath()
  }

  protected fillRoundRect(
    x: number, y: number, w: number, h: number, r: number, color: string
  ): void {
    const c = this.ctx
    this.roundRect(x, y, w, h, r)
    c.fillStyle = color
    c.fill()
  }

  protected strokeRoundRect(
    x: number, y: number, w: number, h: number, r: number, color: string, lw = 1
  ): void {
    const c = this.ctx
    this.roundRect(x, y, w, h, r)
    c.strokeStyle = color
    c.lineWidth = lw
    c.stroke()
  }

  protected fillText(
    text: string, x: number, y: number,
    options?: {
      size?: number
      color?: string
      align?: CanvasTextAlign
      baseline?: CanvasTextBaseline
      font?: string
      maxWidth?: number
    }
  ): void {
    const c = this.ctx
    const size = options?.size ?? 16
    const font = options?.font || this.getCssVar('--gf-font-ui') || 'sans-serif'
    c.font = `${size}px ${font}`
    c.textAlign = options?.align ?? 'center'
    c.textBaseline = options?.baseline ?? 'middle'
    c.fillStyle = options?.color ?? (this.getCssVar('--gf-text') || '#fff')

    const str = String(text)
    if (options?.maxWidth && c.measureText(str).width > options.maxWidth) {
      c.fillText(this.truncate(str, c, options.maxWidth), x, y)
    } else {
      c.fillText(str, x, y)
    }
  }

  protected measureText(text: string, size: number, font?: string): TextMetrics {
    const c = this.ctx
    c.font = `${size}px ${font || this.getCssVar('--gf-font-ui') || 'sans-serif'}`
    return c.measureText(String(text))
  }

  private truncate(text: string, ctx: CanvasRenderingContext2D, maxW: number): string {
    if (ctx.measureText(text).width <= maxW) return text
    let t = text
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) {
      t = t.slice(0, -1)
    }
    return t + '…'
  }
}
