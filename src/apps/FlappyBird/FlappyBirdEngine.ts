import { GameEngine, type GameEngineOptions } from '../../framework/engine'

interface Pipe {
  x: number
  gapY: number
  scored: boolean
}

interface SavedState {
  score: number
  bestScore: number
  birdY: number
  birdVelocity: number
  pipes: { x: number; gapY: number; scored: boolean }[]
  gameOver: boolean
  started: boolean
}

const GRAVITY = 0.45
const FLAP_VELOCITY = -7.5
const PIPE_WIDTH = 52
const PIPE_GAP = 150
const PIPE_SPEED = 2.5
const PIPE_SPAWN_DIST = 210
const BIRD_X = 80
const GROUND_H = 70
const BIRD_R = 14
const CEILING_Y = 10

export class FlappyBirdEngine extends GameEngine {
  private birdY = 0
  private birdVelocity = 0
  private birdRotation = 0
  private pipes: Pipe[] = []
  private _score = 0
  private _bestScore = 0
  private _gameOver = false
  private _started = false
  private initialised = false
  private groundOffset = 0
  private idleTimer = 0

  private bgApp = '#1a1412'
  private bgElevated = '#241d1a'
  private bgHover = '#2d2420'
  private accentColor = '#d4763a'
  private textColor = '#c4b5a5'
  private textMuted = '#7a6f65'
  private textInverse = '#0f0b0a'
  private accentR = 212
  private accentG = 118
  private accentB = 58

  private boundFlap: (e: Event) => void
  private boundKeyFlap: (e: KeyboardEvent) => void
  private boundPause: () => void

  get score(): number { return this._score }
  get bestScore(): number { return this._bestScore }
  get gameOver(): boolean { return this._gameOver }

  constructor(canvas: HTMLCanvasElement, options?: GameEngineOptions) {
    super(canvas, options)
    this.boundFlap = (e: Event) => { e.preventDefault(); this.flap() }
    this.boundKeyFlap = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        this.flap()
      }
    }
    this.boundPause = () => {
      if (this._gameOver) return
      if (this.paused) this.resume()
      else this.pause()
    }

    canvas.addEventListener('pointerdown', this.boundFlap)
    canvas.addEventListener('keydown', this.boundKeyFlap, { capture: true })
    this.input.onAction('pause', this.boundPause)
  }

  init(): void {
    this.readTheme()
    const rect = this.canvas.getBoundingClientRect()
    this.birdY = Math.max(rect.height, 280) / 2
    this.birdVelocity = 0
    this.birdRotation = 0
    this.pipes = []
    this._score = 0
    this._gameOver = false
    this._started = false
    this.groundOffset = 0
    this.idleTimer = 0
    this.initialised = true
  }

  newGame(): void {
    this.init()
    this.clearSavedState()
  }

  loadGameFromState(data: unknown): void {
    try {
      const saved = data as SavedState
      if (!saved) { this.newGame(); return }
      this.readTheme()
      const rect = this.canvas.getBoundingClientRect()
      this.birdY = saved.birdY ?? Math.max(rect.height, 280) / 2
      this.birdVelocity = saved.birdVelocity ?? 0
      this.birdRotation = 0
      this.pipes = (saved.pipes ?? []).map(p => ({ ...p }))
      this._score = saved.score ?? 0
      this._bestScore = saved.bestScore ?? 0
      this.callbacks?.onBestScoreChange?.(this._bestScore)
      this._gameOver = saved.gameOver ?? false
      this._started = saved.started ?? false
      this.groundOffset = 0
      this.initialised = true

      if (this._gameOver) {
        this.callbacks?.onGameOver?.(this._score)
      }
    } catch (e) {
      console.warn('FlappyBirdEngine: deserialize failed', e)
      this.newGame()
    }
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.boundFlap)
    this.canvas.removeEventListener('keydown', this.boundKeyFlap)
    super.destroy()
  }

  private readTheme(): void {
    this.bgApp = this.getCssVar('--gf-bg-app') || '#1a1412'
    this.bgElevated = this.getCssVar('--gf-bg-elevated') || '#241d1a'
    this.bgHover = this.getCssVar('--gf-bg-hover') || '#2d2420'
    this.accentColor = this.getCssVar('--gf-accent') || '#d4763a'
    this.textColor = this.getCssVar('--gf-text') || '#c4b5a5'
    this.textMuted = this.getCssVar('--gf-text-muted') || '#7a6f65'
    this.textInverse = this.getCssVar('--gf-text-inverse') || '#0f0b0a'

    const hex = this.accentColor.replace('#', '')
    this.accentR = parseInt(hex.slice(0, 2), 16) || 212
    this.accentG = parseInt(hex.slice(2, 4), 16) || 118
    this.accentB = parseInt(hex.slice(4, 6), 16) || 58
  }

  private groundY(): number {
    return this.height - GROUND_H
  }

  private randomGapY(): number {
    const halfGap = PIPE_GAP / 2
    const minCenter = CEILING_Y + halfGap + 30
    const maxCenter = this.groundY() - halfGap - 30
    if (maxCenter <= minCenter) return minCenter
    return minCenter + Math.random() * (maxCenter - minCenter)
  }

  private spawnPipe(): void {
    const last = this.pipes[this.pipes.length - 1]
    const x = last ? last.x + PIPE_SPAWN_DIST + PIPE_WIDTH : this.width + PIPE_WIDTH
    this.pipes.push({ x, gapY: this.randomGapY(), scored: false })
  }

  flap(): void {
    if (!this.initialised || this._gameOver) return
    if (this.paused) return
    if (!this._started) {
      this._started = true
      this.spawnPipe()
    }
    this.birdVelocity = FLAP_VELOCITY
    this.audio?.playMove()
  }

  protected update(dt: number): void {
    if (!this.initialised || this.paused) return

    this.groundOffset = (this.groundOffset + PIPE_SPEED) % 24

    if (!this._started) {
      this.idleTimer += dt * 0.004
      this.birdY += Math.sin(this.idleTimer) * 3
      return
    }

    this.birdVelocity += GRAVITY
    this.birdY += this.birdVelocity
    this.birdRotation = Math.max(-0.5, Math.min(1.5, this.birdVelocity * 0.08))

    const groundLevel = this.groundY()

    for (const p of this.pipes) {
      p.x -= PIPE_SPEED
    }

    this.pipes = this.pipes.filter(p => p.x > -PIPE_WIDTH * 2)

    if (!this._gameOver) {
      if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.width - PIPE_SPAWN_DIST) {
        this.spawnPipe()
      }

      let scoredThisFrame = false
      for (const p of this.pipes) {
        if (!p.scored && p.x + PIPE_WIDTH < BIRD_X) {
          p.scored = true
          this._score++
          scoredThisFrame = true
          this.callbacks?.onScoreChange?.(this._score)
          if (this._score > this._bestScore) {
            this._bestScore = this._score
            this.callbacks?.onBestScoreChange?.(this._bestScore)
          }
        }
      }

      if (this.checkCollision()) {
        this._gameOver = true
        this.playGameOverSound()
        this.callbacks?.onGameOver?.(this._score)
      } else if (scoredThisFrame) {
        this.playScoreSound()
      }
    } else {
      this.birdY = Math.min(this.birdY, groundLevel - BIRD_R)
    }
  }

  private checkCollision(): boolean {
    const groundLevel = this.groundY()
    if (this.birdY + BIRD_R >= groundLevel) return true
    if (this.birdY - BIRD_R <= CEILING_Y) return true

    for (const p of this.pipes) {
      const halfW = PIPE_WIDTH / 2
      const dx = Math.abs(BIRD_X - (p.x + halfW))
      if (dx > halfW + BIRD_R) continue

      const halfGap = PIPE_GAP / 2
      const topPipeBottom = p.gapY - halfGap
      const bottomPipeTop = p.gapY + halfGap

      if (this.birdY - BIRD_R < topPipeBottom || this.birdY + BIRD_R > bottomPipeTop) {
        return true
      }
    }
    return false
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    if (!this.initialised) return
    this.readTheme()
    this.cls()

    this.drawSky(ctx)
    this.drawPipes(ctx)
    this.drawBird(ctx)
    this.drawGround(ctx)
    this.drawScore(ctx)

    if (!this._started) {
      this.drawMessage(ctx, 'Tap to start')
    }
  }

  private drawSky(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.bgApp
    ctx.fillRect(0, 0, this.width, this.height)
  }

  private drawGround(ctx: CanvasRenderingContext2D): void {
    const gy = this.groundY()
    ctx.fillStyle = this.bgElevated
    ctx.fillRect(0, gy, this.width, GROUND_H)

    ctx.fillStyle = this.bgHover
    ctx.fillRect(0, gy, this.width, 3)

    ctx.fillStyle = `rgba(${this.accentR},${this.accentG},${this.accentB},0.25)`
    for (let x = -this.groundOffset; x < this.width; x += 24) {
      ctx.fillRect(x, gy - 6, 14, 6)
    }
  }

  private drawPipes(_ctx: CanvasRenderingContext2D): void {
    const pipeBody = `rgba(${this.accentR},${this.accentG},${this.accentB},0.55)`
    const pipeCap = `rgba(${this.accentR},${this.accentG},${this.accentB},0.75)`

    for (const p of this.pipes) {
      const halfGap = PIPE_GAP / 2
      const topH = p.gapY - halfGap
      const bottomY = p.gapY + halfGap
      const bottomH = this.groundY() - bottomY

      const r = 6
      this.fillRoundRect(p.x, 0, PIPE_WIDTH, topH, r, pipeBody)
      this.fillRoundRect(p.x - 3, topH - 22, PIPE_WIDTH + 6, 22, 4, pipeCap)

      this.fillRoundRect(p.x, bottomY, PIPE_WIDTH, bottomH, r, pipeBody)
      this.fillRoundRect(p.x - 3, bottomY, PIPE_WIDTH + 6, 22, 4, pipeCap)
    }
  }

  private drawBird(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(BIRD_X, this.birdY)
    ctx.rotate(this.birdRotation)

    const borderR = Math.max(0, this.accentR - 50)
    const borderG = Math.max(0, this.accentG - 50)
    const borderB = Math.max(0, this.accentB - 50)

    ctx.beginPath()
    ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2)
    ctx.fillStyle = `rgb(${this.accentR},${this.accentG},${this.accentB})`
    ctx.fill()
    ctx.strokeStyle = `rgba(${borderR},${borderG},${borderB},0.6)`
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(4, -4, 5, 0, Math.PI * 2)
    ctx.fillStyle = this.textInverse
    ctx.fill()

    ctx.beginPath()
    ctx.arc(6, -4, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = this.textColor
    ctx.fill()

    const beakR = Math.min(255, this.accentR + 60)
    const beakG = Math.max(0, this.accentG - 30)
    const beakB = Math.max(0, this.accentB - 30)
    ctx.beginPath()
    ctx.moveTo(BIRD_R + 2, 0)
    ctx.lineTo(BIRD_R + 12, -4)
    ctx.lineTo(BIRD_R + 2, 4)
    ctx.closePath()
    ctx.fillStyle = `rgb(${beakR},${beakG},${beakB})`
    ctx.fill()

    ctx.restore()
  }

  private drawScore(ctx: CanvasRenderingContext2D): void {
    const str = String(this._score)
    const size = 48
    const font = this.getCssVar('--gf-font-display') || 'sans-serif'
    ctx.font = `800 ${size}px ${font}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const bgHex = this.bgApp.replace('#', '')
    const bgR = parseInt(bgHex.slice(0, 2), 16) || 26
    const bgG = parseInt(bgHex.slice(2, 4), 16) || 20
    const bgB = parseInt(bgHex.slice(4, 6), 16) || 18
    ctx.strokeStyle = `rgba(${bgR},${bgG},${bgB},0.5)`
    ctx.lineWidth = 3
    ctx.strokeText(str, this.width / 2, 30)

    ctx.fillStyle = this.textColor
    ctx.fillText(str, this.width / 2, 30)
  }

  private drawMessage(ctx: CanvasRenderingContext2D, msg: string): void {
    const font = this.getCssVar('--gf-font-ui') || 'sans-serif'
    ctx.font = `600 20px ${font}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = this.textMuted
    ctx.fillText(msg, this.width / 2, this.height / 2 + BIRD_R + 40)
  }

  private playScoreSound(): void {
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
      score: this._score,
      bestScore: this._bestScore,
      birdY: this.birdY,
      birdVelocity: this.birdVelocity,
      pipes: this.pipes.map(p => ({ x: p.x, gapY: p.gapY, scored: p.scored })),
      gameOver: this._gameOver,
      started: this._started,
    }
  }
}
