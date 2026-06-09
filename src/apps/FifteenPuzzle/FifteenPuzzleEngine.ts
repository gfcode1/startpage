import { GameEngine } from '../../framework/engine'
import type { Difficulty } from './types'
import { DIFFICULTY_CONFIG } from './types'

const ANIM_DURATION = 200

interface AnimatingTile {
  tileNum: number
  fromR: number
  fromC: number
  toR: number
  toC: number
  progress: number
}

export class FifteenPuzzleEngine extends GameEngine {
  grid: number[][] = []
  rows = 4
  cols = 4
  moveCount = 0
  solved = false
  started = false

  private puzzleImage: HTMLImageElement | null = null
  private anims: AnimatingTile[] = []
  private onMoveCb: (() => void) | null = null
  private onSolveCb: (() => void) | null = null
  private initialised = false

  init() {
    this.initialised = true
  }

  setImage(img: HTMLImageElement) {
    this.puzzleImage = img
  }

  setCallbacks(onMove: () => void, onSolve: () => void) {
    this.onMoveCb = onMove
    this.onSolveCb = onSolve
  }

  newGame(difficulty: Difficulty) {
    if (!this.initialised) this.init()

    const cfg = DIFFICULTY_CONFIG[difficulty]
    this.rows = cfg.rows
    this.cols = cfg.cols
    this.moveCount = 0
    this.solved = false
    this.anims = []

    this.grid = []
    let n = 1
    for (let r = 0; r < this.rows; r++) {
      const row: number[] = []
      for (let c = 0; c < this.cols; c++) {
        if (r === this.rows - 1 && c === this.cols - 1) row.push(0)
        else row.push(n++)
      }
      this.grid.push(row)
    }

    this.shuffle()
    this.started = true
  }

  private shuffle() {
    const moves = this.rows === 3 ? 30 : this.rows === 5 ? 200 : 100
    for (let i = 0; i < moves; i++) {
      const empty = this.findEmpty()
      const adj = this.getAdjacent(empty.r, empty.c)
      const pick = adj[Math.floor(Math.random() * adj.length)]
      this.swap(empty.r, empty.c, pick.r, pick.c)
    }
    this.moveCount = 0
  }

  findEmpty(): { r: number; c: number } {
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.grid[r][c] === 0) return { r, c }
    return { r: this.rows - 1, c: this.cols - 1 }
  }

  private getAdjacent(r: number, c: number): { r: number; c: number }[] {
    const result: { r: number; c: number }[] = []
    if (r > 0) result.push({ r: r - 1, c })
    if (r < this.rows - 1) result.push({ r: r + 1, c })
    if (c > 0) result.push({ r, c: c - 1 })
    if (c < this.cols - 1) result.push({ r, c: c + 1 })
    return result
  }

  private swap(r1: number, c1: number, r2: number, c2: number) {
    const t = this.grid[r1][c1]
    this.grid[r1][c1] = this.grid[r2][c2]
    this.grid[r2][c2] = t
  }

  tryMove(r: number, c: number): boolean {
    if (this.anims.length > 0 || this.solved || !this.started) return false
    if (this.grid[r][c] === 0) return false

    const empty = this.findEmpty()
    const adj = this.getAdjacent(empty.r, empty.c)
    const tile = adj.find(a => a.r === r && a.c === c)
    if (!tile) return false

    const tileNum = this.grid[r][c]

    this.anims.push({
      tileNum,
      fromR: r,
      fromC: c,
      toR: empty.r,
      toC: empty.c,
      progress: 0,
    })

    this.swap(r, c, empty.r, empty.c)
    this.moveCount++
    this.onMoveCb?.()
    return true
  }

  private checkSolved(): boolean {
    let n = 1
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (r === this.rows - 1 && c === this.cols - 1) {
          if (this.grid[r][c] !== 0) return false
        } else {
          if (this.grid[r][c] !== n) return false
          n++
        }
      }
    }
    return true
  }

  protected update(dt: number) {
    if (this.anims.length === 0) return

    const speed = 1000 / ANIM_DURATION
    let allDone = true
    for (const a of this.anims) {
      a.progress = Math.min(1, a.progress + dt * speed)
      allDone = allDone && a.progress >= 1
    }

    if (allDone) {
      this.anims = []
      if (this.checkSolved()) {
        this.solved = true
        this.onSolveCb?.()
      }
    }
  }

  protected render(ctx: CanvasRenderingContext2D) {
    const gap = 2
    const tileW = this.width / this.cols
    const tileH = this.height / this.rows

    ctx.fillStyle = this.getCssVar('--gf-bg-elevated') || '#1a1a2e'
    this.roundRect(0, 0, this.width, this.height, 8)
    ctx.fill()

    if (!this.puzzleImage) {
      ctx.fillStyle = this.getCssVar('--gf-text-muted') || '#666'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Select a photo to play', this.width / 2, this.height / 2)
      return
    }

    const srcTileW = this.puzzleImage.width / this.cols
    const srcTileH = this.puzzleImage.height / this.rows
    const cellW = tileW - gap * 2
    const cellH = tileH - gap * 2

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tileNum = this.grid[r][c]
        if (tileNum === 0) continue

        const anim = this.anims.find(a => a.tileNum === tileNum)

        let drawX: number
        let drawY: number
        if (anim) {
          const t = 1 - Math.pow(1 - anim.progress, 3)
          drawX = (anim.fromC + (anim.toC - anim.fromC) * t) * tileW + gap
          drawY = (anim.fromR + (anim.toR - anim.fromR) * t) * tileH + gap
        } else {
          drawX = c * tileW + gap
          drawY = r * tileH + gap
        }

        const srcCol = (tileNum - 1) % this.cols
        const srcRow = Math.floor((tileNum - 1) / this.cols)

        ctx.drawImage(
          this.puzzleImage,
          srcCol * srcTileW, srcRow * srcTileH, srcTileW, srcTileH,
          drawX, drawY, cellW, cellH,
        )

        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.lineWidth = 1
        ctx.strokeRect(drawX, drawY, cellW, cellH)
      }
    }
  }

  serialize(): unknown {
    return {
      grid: this.grid,
      rows: this.rows,
      cols: this.cols,
      moveCount: this.moveCount,
    }
  }

  deserialize(data: unknown): void {
    const s = data as { grid: number[][]; rows: number; cols: number; moveCount: number }
    this.grid = s.grid
    this.rows = s.rows
    this.cols = s.cols
    this.moveCount = s.moveCount
    this.started = true
  }
}
