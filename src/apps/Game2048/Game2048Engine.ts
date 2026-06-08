import { GameEngine, type GameEngineOptions } from '../../framework/engine'
import type { Direction } from '../../framework/engine'
import {
  type Grid,
  type Tile,
  GRID_SIZE,
  createGrid,
  cloneGrid,
  addRandomTile,
  move,
  isGameOver,
  resetIdCounter,
  serializeGrid,
  deserializeGrid,
  tileAlpha,
} from './game2048'

interface AnimTile {
  id: number
  value: number
  row: number
  col: number
  scale: number
  opacity: number
  merged: boolean
}

interface SavedState {
  score: number
  bestScore: number
  won: boolean
  wonContinued: boolean
  gridData: string
}

export class Game2048Engine extends GameEngine {
  private grid: Grid = createGrid()
  private animTiles: AnimTile[] = []
  private _score = 0
  private _bestScore = 0
  private _won = false
  private _wonContinued = false
  private _gameOver = false
  private inputBlocked = false
  private initialised = false
  private animRafId = 0

  private bgColor = ''
  private cellColor = ''
  private accentColor = ''
  private textColor = ''
  private textInverseColor = ''
  private accentR = 0
  private accentG = 0
  private accentB = 0

  private margin = 8
  private gap = 6
  private cellSize = 0
  private gridOffsetX = 0
  private gridOffsetY = 0

  constructor(canvas: HTMLCanvasElement, options?: GameEngineOptions) {
    super(canvas, options)
    this.input.onDirection((dir: Direction) => this.handleInput(dir))
    this.input.onAction('pause', () => { if (!this.inputBlocked) this.pause() })
  }

  get score(): number { return this._score }
  get bestScore(): number { return this._bestScore }
  get won(): boolean { return this._won }
  get gameOver(): boolean { return this._gameOver }

  init(): void {
    if (this.animRafId) {
      cancelAnimationFrame(this.animRafId)
      this.animRafId = 0
    }
    this.readTheme()
    resetIdCounter()
    this.grid = createGrid()
    addRandomTile(this.grid)
    addRandomTile(this.grid)
    this._score = 0
    this._won = false
    this._wonContinued = false
    this._gameOver = false
    this.inputBlocked = false
    this.syncAnimTiles()
    this.tweens.clear()
    this.initialised = true
  }

  loadGameFromState(data: unknown): void {
    try {
      const saved = data as SavedState
      if (!saved?.gridData) { this.init(); return }
      this.readTheme()
      resetIdCounter()
      const g = deserializeGrid(saved.gridData)
      if (!g) { this.init(); return }
      this.grid = g
      this._score = saved.score ?? 0
      this._bestScore = saved.bestScore ?? 0
      this._won = saved.won ?? false
      this._wonContinued = saved.wonContinued ?? false
      this._gameOver = isGameOver(this.grid)
      this.syncAnimTiles()
      this.tweens.clear()
      this.inputBlocked = false
      this.initialised = true
      if (this._gameOver) {
        this.callbacks?.onGameOver?.(this._score)
      } else if (this._won) {
        this.callbacks?.onWin?.(this._score)
      }
    } catch (e) {
      console.warn('Game2048Engine: deserialize failed', e)
      this.init()
    }
  }

  continueAfterWin(): void {
    this._wonContinued = true
    this._won = false
  }

  newGame(): void {
    this.init()
    this.clearSavedState()
  }

  private readTheme(): void {
    this.bgColor = this.getCssVar('--gf-bg-app') || '#1a1412'
    this.cellColor = this.getCssVar('--gf-bg-elevated') || '#241d1a'
    this.accentColor = this.getCssVar('--gf-accent') || '#d4763a'
    this.textColor = this.getCssVar('--gf-text') || '#c4b5a5'
    this.textInverseColor = this.getCssVar('--gf-text-inverse') || '#0f0b0a'

    const hex = this.accentColor.replace('#', '')
    this.accentR = parseInt(hex.slice(0, 2), 16) || 212
    this.accentG = parseInt(hex.slice(2, 4), 16) || 118
    this.accentB = parseInt(hex.slice(4, 6), 16) || 58
  }

  private gridSize(): number {
    return Math.min(this.width, this.height)
  }

  private computeLayout(): void {
    const size = this.gridSize()
    const available = size - this.margin * 2
    this.cellSize = (available - this.gap * (GRID_SIZE - 1)) / GRID_SIZE
    this.gridOffsetX = (this.width - available) / 2
    this.gridOffsetY = (this.height - available) / 2
  }

  private cellX(col: number): number {
    return this.gridOffsetX + col * (this.cellSize + this.gap)
  }

  private cellY(row: number): number {
    return this.gridOffsetY + row * (this.cellSize + this.gap)
  }

  private syncAnimTiles(): void {
    this.animTiles = []
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const t = this.grid[r][c]
        if (t) {
          this.animTiles.push({
            id: t.id, value: t.value, row: r, col: c,
            scale: 1, opacity: 1, merged: false,
          })
        }
      }
    }
  }

  protected update(_dt: number): void {}

  protected render(ctx: CanvasRenderingContext2D): void {
    if (!this.initialised) return
    this.cls()
    this.computeLayout()

    const r = 6
    const w = GRID_SIZE * this.cellSize + (GRID_SIZE - 1) * this.gap
    const h = w

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    this.fillRoundRect(
      this.gridOffsetX - 4, this.gridOffsetY - 4,
      w + 8, h + 8, r + 2, this.bgColor
    )

    for (let r0 = 0; r0 < GRID_SIZE; r0++) {
      for (let c0 = 0; c0 < GRID_SIZE; c0++) {
        const x = this.cellX(c0)
        const y = this.cellY(r0)
        this.fillRoundRect(x, y, this.cellSize, this.cellSize, r, this.cellColor)
      }
    }

    const sorted = [...this.animTiles].sort((a, b) => {
      if (a.merged && !b.merged) return 1
      if (!a.merged && b.merged) return -1
      return 0
    })

    for (const at of sorted) {
      const x = this.cellX(at.col)
      const y = this.cellY(at.row)
      const cs = this.cellSize
      const pad = cs * (1 - at.scale) / 2
      const drawX = x + pad
      const drawY = y + pad
      const drawSize = cs * at.scale

      ctx.globalAlpha = at.opacity
      const color = this.tileColor(at.value)

      if (at.merged) {
        ctx.shadowColor = this.accentColor
        ctx.shadowBlur = 16
        this.fillRoundRect(drawX, drawY, drawSize, drawSize, 4, color)
        ctx.shadowBlur = 0
      } else if (at.value >= 128) {
        ctx.shadowColor = this.accentColor
        ctx.shadowBlur = 8
        this.fillRoundRect(drawX, drawY, drawSize, drawSize, 4, color)
        ctx.shadowBlur = 0
      } else {
        this.fillRoundRect(drawX, drawY, drawSize, drawSize, 4, color)
      }
      ctx.globalAlpha = 1

      const textColor = this.tileTextColor(at.value)
      const str = String(at.value)
      const maxW = drawSize * 0.8
      let fontSize = drawSize * 0.42
      const m = this.measureText(str, fontSize)
      if (m.width > maxW) {
        fontSize = fontSize * (maxW / m.width) * 0.95
      }
      fontSize = Math.max(fontSize, 10)
      this.fillText(str, drawX + drawSize / 2, drawY + drawSize / 2, {
        size: fontSize,
        color: textColor,
        font: this.getCssVar('--gf-font-ui') || 'sans-serif',
      })
    }
  }

  private tileColor(value: number): string {
    const a = tileAlpha(value)
    return `rgba(${this.accentR},${this.accentG},${this.accentB},${a})`
  }

  private tileTextColor(value: number): string {
    return tileAlpha(value) >= 0.55 ? this.textInverseColor : this.textColor
  }

  private handleInput(dir: Direction): void {
    if (this.inputBlocked || this.paused || this._gameOver || !this.initialised) return

    const oldGrid = cloneGrid(this.grid)
    const result = move(this.grid, dir)
    if (!result.moved) {
      if (result.gameOver) {
        this._gameOver = true
        this.callbacks?.onGameOver?.(this._score)
      }
      return
    }

    this.grid = result.grid
    this._score += result.score
    if (this._score > this._bestScore) {
      this._bestScore = this._score
      this.callbacks?.onBestScoreChange?.(this._bestScore)
    }
    this.callbacks?.onScoreChange?.(this._score)

    this.audio?.playMove()

    const hadMerge = this.hasMerges(result.grid)
    if (hadMerge) this.playMergeSound()

    if (result.won && !this._wonContinued) {
      this._won = true
      this.callbacks?.onWin?.(this._score)
      this.playVictorySound()
    }

    this._gameOver = result.gameOver
    this.animateTransition(oldGrid, result.gameOver)
  }

  private hasMerges(grid: Grid): boolean {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c]?.mergedFrom) return true
      }
    }
    return false
  }

  private animateTransition(oldGrid: Grid, endsGameOver: boolean): void {
    this.inputBlocked = true
    this.tweens.clear()

    const oldMap = new Map<number, { row: number; col: number }>()
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const t = oldGrid[r][c]
        if (t) oldMap.set(t.id, { row: r, col: c })
      }
    }

    const newAnimTiles: AnimTile[] = []
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const t = this.grid[r][c]
        if (!t) continue

        if (t.mergedFrom) {
          newAnimTiles.push({
            id: t.id, value: t.value, row: r, col: c,
            scale: 0, opacity: 1, merged: true,
          })
        } else if (t.isNew) {
          newAnimTiles.push({
            id: t.id, value: t.value, row: r, col: c,
            scale: 0, opacity: 1, merged: false,
          })
        } else {
          const old = oldMap.get(t.id)
          if (old) {
            newAnimTiles.push({
              id: t.id, value: t.value,
              row: old.row, col: old.col,
              scale: 1, opacity: 1, merged: false,
            })
          } else {
            newAnimTiles.push({
              id: t.id, value: t.value, row: r, col: c,
              scale: 1, opacity: 1, merged: false,
            })
          }
        }
      }
    }

    this.animTiles = newAnimTiles

    const gridTileMap = new Map<number, Tile>()
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const gt = this.grid[r][c]
        if (gt) gridTileMap.set(gt.id, gt)
      }
    }

    for (const at of this.animTiles) {
      const t = gridTileMap.get(at.id)
      if (!t) continue

      if (t.mergedFrom) {
        at.scale = 0
        this.tweens.add({
          target: at as unknown as Record<string, number>,
          to: { scale: 1.2 },
          duration: 150,
          easing: 'easeOutBack',
        })
        this.tweens.add({
          target: at as unknown as Record<string, number>,
          to: { scale: 1 },
          duration: 60,
          delay: 150,
        })
      } else if (t.isNew) {
        at.scale = 0
        this.tweens.add({
          target: at as unknown as Record<string, number>,
          to: { scale: 1 },
          duration: 150,
          easing: 'easeOutBack',
        })
      } else {
        const old = oldMap.get(t.id)
        if (old && (old.row !== t.row || old.col !== t.col)) {
          at.row = old.row
          at.col = old.col
          this.tweens.add({
            target: at as unknown as Record<string, number>,
            to: { row: t.row, col: t.col },
            duration: 100,
            easing: 'easeOutCubic',
          })
        }
      }
    }

    const waitForAnim = (): void => {
      if (!this.tweens.active) {
        this.animRafId = 0
        this.inputBlocked = false
        this.syncAnimTiles()
        if (endsGameOver) {
          this.playGameOverSound()
          this.callbacks?.onGameOver?.(this._score)
        }
        this.saveGameState()
      } else {
        this.animRafId = requestAnimationFrame(waitForAnim)
      }
    }
    this.animRafId = requestAnimationFrame(waitForAnim)
  }

  destroy(): void {
    if (this.animRafId) {
      cancelAnimationFrame(this.animRafId)
      this.animRafId = 0
    }
    super.destroy()
  }

  protected onPause(): void {
    this.saveGameState()
  }

  protected onResume(): void {
    this.readTheme()
  }

  serialize(): SavedState {
    return {
      score: this._score,
      bestScore: this._bestScore,
      won: this._won,
      wonContinued: this._wonContinued,
      gridData: serializeGrid(this.grid),
    }
  }

  deserialize(data: unknown): void {
    this.loadGameFromState(data)
  }

  private playMergeSound(): void {
    this.audio?.playSweep(440, 880, 'sine', 0.1, 0.2)
  }

  private playVictorySound(): void {
    const engine = this.audio
    if (!engine) return
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        engine.playTone(freq, 'sine', 0.12, 0.2, 0.001)
      }, i * 120)
    })
  }

  private playGameOverSound(): void {
    this.audio?.playSweep(400, 80, 'sawtooth', 0.4, 0.15)
  }

  private saveGameState(): void {
    if (!this.storage) return
    this.storage.setItem('gameState', this.serialize())
  }
}
