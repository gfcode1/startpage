import { GameEngine, type GameEngineOptions } from '../../framework/engine'
import type { Direction } from '../../framework/engine'

const COLS = 20
const ROWS = 20
const INITIAL_SPEED = 150
const SPEED_INCREMENT = 2
const MIN_SPEED = 60
const MAX_QUEUE = 2

interface Segment {
  x: number
  y: number
}

interface SavedState {
  snake: Segment[]
  food: Segment
  direction: Direction
  score: number
  bestScore: number
  stepInterval: number
}

type GameState = 'idle' | 'playing' | 'gameOver'

export class SnakeEngine extends GameEngine {
  private snake: Segment[] = []
  private food: Segment = { x: 0, y: 0 }
  private direction: Direction = 'right'
  private dirQueue: Direction[] = []
  private _score = 0
  private _bestScore = 0
  private _gameOver = false
  private _state: GameState = 'idle'
  private stepAcc = 0
  private stepInterval = INITIAL_SPEED
  private initialised = false

  private cellSize = 0
  private gap = 0
  private offsetX = 0
  private offsetY = 0
  private gridPx = 0

  private bgColor = ''
  private cellColor = ''
  private accentColor = ''
  private textColor = ''
  private textMuted = ''
  private foodColor = ''
  private headColor = ''
  private bodyColor = ''

  constructor(canvas: HTMLCanvasElement, options?: GameEngineOptions) {
    super(canvas, options)
    this.input.onDirection((dir) => this.handleDirection(dir))
    this.input.onAction('pause', () => {
      if (this._state === 'playing') this.pause()
    })
  }

  get score(): number { return this._score }
  get bestScore(): number { return this._bestScore }
  get gameOver(): boolean { return this._gameOver }
  get state(): GameState { return this._state }

  init(): void {
    this.readTheme()
    const midX = Math.floor(COLS / 2)
    const midY = Math.floor(ROWS / 2)
    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ]
    this.direction = 'right'
    this.dirQueue = []
    this._score = 0
    this._bestScore = this._bestScore || 0
    this._gameOver = false
    this._state = 'idle'
    this.stepAcc = 0
    this.stepInterval = INITIAL_SPEED
    this.placeFood()
    this.initialised = true
  }

  newGame(): void {
    this.init()
    this.clearSavedState()
  }

  loadGameFromState(data: unknown): void {
    try {
      const saved = data as SavedState
      if (!saved?.snake?.length) { this.init(); return }
      this.readTheme()
      this.snake = saved.snake
      this.food = saved.food
      this.direction = saved.direction
      this._score = saved.score
      this._bestScore = saved.bestScore
      this.stepInterval = saved.stepInterval
      this.dirQueue = []
      this._gameOver = false
      this._state = 'playing'
      this.stepAcc = 0
      this.initialised = true
    } catch (e) {
      console.warn('SnakeEngine: deserialize failed', e)
      this.init()
    }
  }

  protected update(dt: number): void {
    if (this._state !== 'playing' || this._gameOver || !this.initialised) return
    this.stepAcc += dt
    while (this.stepAcc >= this.stepInterval) {
      this.stepAcc -= this.stepInterval
      this.tick()
      if (this._gameOver) break
    }
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    if (!this.initialised) return
    this.readTheme()
    this.cls()
    this.computeLayout()
    this.drawGrid(ctx)
    this.drawFood(ctx)
    this.drawSnake(ctx)
    if (this._state === 'idle') {
      this.drawIdleOverlay(ctx)
    }
  }

  private tick(): void {
    if (this.dirQueue.length > 0) {
      this.direction = this.dirQueue.shift()!
    }

    const head = this.snake[0]
    const newHead = { x: head.x, y: head.y }
    switch (this.direction) {
      case 'up': newHead.y--; break
      case 'down': newHead.y++; break
      case 'left': newHead.x--; break
      case 'right': newHead.x++; break
    }

    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      this.endGame()
      return
    }

    const willEat = newHead.x === this.food.x && newHead.y === this.food.y
    const checkLen = willEat ? this.snake.length : this.snake.length - 1
    for (let i = 0; i < checkLen; i++) {
      if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
        this.endGame()
        return
      }
    }

    this.snake.unshift(newHead)

    if (willEat) {
      this._score++
      this.playCollectSound()
      if (this._score > this._bestScore) {
        this._bestScore = this._score
        this.callbacks?.onBestScoreChange?.(this._bestScore)
      }
      this.callbacks?.onScoreChange?.(this._score)
      this.stepInterval = Math.max(MIN_SPEED, this.stepInterval - SPEED_INCREMENT)
      this.placeFood()
    } else {
      this.snake.pop()
    }
  }

  private handleDirection(dir: Direction): void {
    if (this._state === 'idle') {
      this.startPlaying()
    }
    if (this._state !== 'playing' || this._gameOver) return

    const last = this.dirQueue.length > 0
      ? this.dirQueue[this.dirQueue.length - 1]
      : this.direction

    if (this.isOpposite(dir, last) || dir === last) return
    if (this.dirQueue.length < MAX_QUEUE) {
      this.dirQueue.push(dir)
    }
  }

  private startPlaying(): void {
    this._state = 'playing'
    this.stepAcc = 0
    this.dirQueue = []
  }

  private endGame(): void {
    this._gameOver = true
    this._state = 'gameOver'
    this.playGameOverSound()
    this.callbacks?.onGameOver?.(this._score)
    this.saveState()
  }

  private placeFood(): void {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`))
    const free: Segment[] = []
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (!occupied.has(`${x},${y}`)) {
          free.push({ x, y })
        }
      }
    }
    if (free.length > 0) {
      this.food = free[Math.floor(Math.random() * free.length)]
    }
  }

  private isOpposite(a: Direction, b: Direction): boolean {
    return (a === 'up' && b === 'down') ||
      (a === 'down' && b === 'up') ||
      (a === 'left' && b === 'right') ||
      (a === 'right' && b === 'left')
  }

  private readTheme(): void {
    this.bgColor = this.getCssVar('--gf-bg-app') || '#1a1a2e'
    this.cellColor = this.getCssVar('--gf-bg-elevated') || '#16213e'
    this.accentColor = this.getCssVar('--gf-accent') || '#22c55e'
    this.textColor = this.getCssVar('--gf-text') || '#e0e0e0'
    this.textMuted = this.getCssVar('--gf-text-muted') || '#888'
    this.foodColor = this.getCssVar('--gf-border-accent') || '#ef4444'
    this.headColor = this.accentColor
    this.bodyColor = this.getCssVar('--gf-accent-muted') || 'rgba(34,197,94,0.5)'
  }

  private computeLayout(): void {
    const size = Math.min(this.width, this.height) * 0.92
    this.gap = Math.max(1, Math.floor(size * 0.004))
    this.cellSize = (size - this.gap * (Math.max(COLS, ROWS) - 1)) / Math.max(COLS, ROWS)
    this.gridPx = this.cellSize * COLS + this.gap * (COLS - 1)
    const gridPy = this.cellSize * ROWS + this.gap * (ROWS - 1)
    this.offsetX = (this.width - this.gridPx) / 2
    this.offsetY = (this.height - gridPy) / 2
  }

  private cellX(col: number): number {
    return Math.round(this.offsetX + col * (this.cellSize + this.gap))
  }

  private cellY(row: number): number {
    return Math.round(this.offsetY + row * (this.cellSize + this.gap))
  }

  private drawGrid(_ctx: CanvasRenderingContext2D): void {
    const r = Math.max(4, this.cellSize * 0.15)
    this.fillRoundRect(
      this.offsetX - this.gap, this.offsetY - this.gap,
      this.gridPx + this.gap * 2,
      this.cellSize * ROWS + this.gap * (ROWS - 1) + this.gap * 2,
      r, this.bgColor
    )

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cx = this.cellX(x)
        const cy = this.cellY(y)
        this.fillRoundRect(cx, cy, this.cellSize, this.cellSize, r * 0.6, this.cellColor)
      }
    }
  }

  private drawFood(ctx: CanvasRenderingContext2D): void {
    const cx = this.cellX(this.food.x) + this.cellSize / 2
    const cy = this.cellY(this.food.y) + this.cellSize / 2
    const r = this.cellSize * 0.42

    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = this.foodColor
    ctx.fill()

    ctx.beginPath()
    ctx.arc(cx - r * 0.2, cy - r * 0.3, r * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fill()
  }

  private drawSnake(ctx: CanvasRenderingContext2D): void {
    const r = Math.max(3, this.cellSize * 0.2)
    const pad = this.cellSize * 0.04

    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i]
      const cx = this.cellX(seg.x) + pad
      const cy = this.cellY(seg.y) + pad
      const sz = this.cellSize - pad * 2
      const isHead = i === 0

      if (isHead) {
        ctx.shadowColor = this.headColor
        ctx.shadowBlur = 8
        this.fillRoundRect(cx, cy, sz, sz, r, this.headColor)
        ctx.shadowBlur = 0

        const eyeSize = sz * 0.12
        let ex1: number, ey1: number, ex2: number, ey2: number
        const center = sz / 2
        switch (this.direction) {
          case 'up':
            ex1 = cx + center - eyeSize * 2; ey1 = cy + eyeSize
            ex2 = cx + center + eyeSize * 2; ey2 = cy + eyeSize
            break
          case 'down':
            ex1 = cx + center - eyeSize * 2; ey1 = cy + sz - eyeSize
            ex2 = cx + center + eyeSize * 2; ey2 = cy + sz - eyeSize
            break
          case 'left':
            ex1 = cx + eyeSize; ey1 = cy + center - eyeSize * 2
            ex2 = cx + eyeSize; ey2 = cy + center + eyeSize * 2
            break
          case 'right':
            ex1 = cx + sz - eyeSize; ey1 = cy + center - eyeSize * 2
            ex2 = cx + sz - eyeSize; ey2 = cy + center + eyeSize * 2
            break
        }
        ctx.beginPath()
        ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2)
        ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
      } else {
        const t = i / this.snake.length
        const alpha = 0.3 + t * 0.5
        const color = this.blendColors(this.accentColor, this.bgColor, alpha)
        this.fillRoundRect(cx, cy, sz, sz, r, color)
      }
    }
  }

  private drawIdleOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(this.offsetX - this.gap, this.offsetY - this.gap,
      this.gridPx + this.gap * 2,
      this.cellSize * ROWS + this.gap * (ROWS - 1) + this.gap * 2)

    this.fillText(
      'Press any direction',
      this.width / 2, this.height / 2 - 16,
      { size: Math.max(16, this.cellSize * 0.8), color: this.textColor }
    )
    this.fillText(
      'Arrow keys or WASD',
      this.width / 2, this.height / 2 + 16,
      { size: Math.max(12, this.cellSize * 0.5), color: this.textMuted }
    )
  }

  private blendColors(c1: string, c2: string, ratio: number): string {
    const parse = (c: string) => {
      const hex = c.replace('#', '')
      return [parseInt(hex.slice(0, 2), 16) || 0,
              parseInt(hex.slice(2, 4), 16) || 0,
              parseInt(hex.slice(4, 6), 16) || 0]
    }
    const [r1, g1, b1] = parse(c1)
    const [r2, g2, b2] = parse(c2)
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio)
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio)
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio)
    return `rgb(${r},${g},${b})`
  }

  private playCollectSound(): void {
    this.audio?.playTone(600, 'sine', 0.06, 0.12, 0.001)
  }

  private playGameOverSound(): void {
    this.audio?.playSweep(400, 80, 'sawtooth', 0.4, 0.15)
  }

  protected onPause(): void {
    this.saveState()
  }

  protected onResume(): void {
    this.readTheme()
  }

  serialize(): SavedState {
    return {
      snake: this.snake,
      food: this.food,
      direction: this.direction,
      score: this._score,
      bestScore: this._bestScore,
      stepInterval: this.stepInterval,
    }
  }

  deserialize(data: unknown): void {
    this.loadGameFromState(data)
  }
}
