import { GameEngine } from '../../framework/engine'
import type { Difficulty } from './types'
import { DIFFICULTY_CONFIG } from './types'

interface SwapAnimTarget {
  [key: string]: number
  tileNum: number
  fromR: number
  fromC: number
  toR: number
  toC: number
  p: number
}

export class SwapPuzzleEngine extends GameEngine {
  grid: number[][] = []
  rows = 4
  cols = 4
  swapCount = 0
  solved = false
  selectedR = -1
  selectedC = -1

  private puzzleImage: HTMLImageElement | null = null
  private animTargets: SwapAnimTarget[] = []
  private animCount = 0
  private onSwapCb: (() => void) | null = null
  private onSolveCb: (() => void) | null = null
  private initialised = false

  init() {
    this.initialised = true
  }

  setImage(img: HTMLImageElement) {
    this.puzzleImage = img
  }

  setCallbacks(onSwap: () => void, onSolve: () => void) {
    this.onSwapCb = onSwap
    this.onSolveCb = onSolve
  }

  newGame(difficulty: Difficulty) {
    if (!this.initialised) this.init()

    const cfg = DIFFICULTY_CONFIG[difficulty]
    this.rows = cfg.rows
    this.cols = cfg.cols
    this.swapCount = 0
    this.solved = false
    this.animTargets = []
    this.animCount = 0
    this.tweens.clear()
    this.selectedR = -1
    this.selectedC = -1

    this.grid = []
    let n = 1
    for (let r = 0; r < this.rows; r++) {
      const row: number[] = []
      for (let c = 0; c < this.cols; c++) row.push(n++)
      this.grid.push(row)
    }

    this.shuffle()
  }

  private shuffle() {
    const flat: number[] = []
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        flat.push(this.grid[r][c])

    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]]
    }

    let idx = 0
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        this.grid[r][c] = flat[idx++]
  }

  trySelectTile(r: number, c: number): boolean {
    if (this.animCount > 0 || this.solved) return false

    if (this.selectedR === r && this.selectedC === c) {
      this.selectedR = -1
      this.selectedC = -1
      return true
    }

    if (this.selectedR === -1) {
      this.selectedR = r
      this.selectedC = c
      return true
    }

    const fromR = this.selectedR
    const fromC = this.selectedC
    const tileA = this.grid[fromR][fromC]
    const tileB = this.grid[r][c]

    this.grid[fromR][fromC] = tileB
    this.grid[r][c] = tileA

    const animA: SwapAnimTarget = { tileNum: tileA, fromR, fromC, toR: r, toC: c, p: 0 }
    const animB: SwapAnimTarget = { tileNum: tileB, fromR: r, fromC: c, toR: fromR, toC: fromC, p: 0 }
    this.animTargets.push(animA, animB)
    this.animCount = 2

    const checkDone = () => {
      this.animCount--
      if (this.animCount > 0) return
      this.animTargets = this.animTargets.filter(
        t => t.tileNum !== tileA && t.tileNum !== tileB
      )
      if (this.checkSolved()) {
        this.solved = true
        this.onSolveCb?.()
      }
    }

    this.tweens.add({ target: animA, to: { p: 1 }, duration: 280, easing: 'easeOutBack', onComplete: checkDone })
    this.tweens.add({ target: animB, to: { p: 1 }, duration: 280, easing: 'easeOutBack', onComplete: checkDone })

    this.swapCount++
    this.selectedR = -1
    this.selectedC = -1
    this.onSwapCb?.()
    return true
  }

  private checkSolved(): boolean {
    let n = 1
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== n) return false
        n++
      }
    return true
  }

  protected update(_dt: number) {}

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
        const anim = this.animTargets.find(a => a.tileNum === tileNum)

        let drawX: number
        let drawY: number
        if (anim) {
          const t = anim.p
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

        const isSelected = !anim && r === this.selectedR && c === this.selectedC
        if (isSelected) {
          ctx.strokeStyle = this.getCssVar('--gf-accent') || '#06b6d4'
          ctx.lineWidth = 3
          ctx.strokeRect(drawX - 1.5, drawY - 1.5, cellW + 3, cellH + 3)
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.12)'
          ctx.lineWidth = 1
          ctx.strokeRect(drawX, drawY, cellW, cellH)
        }
      }
    }
  }

  serialize(): unknown {
    return {
      grid: this.grid,
      rows: this.rows,
      cols: this.cols,
      swapCount: this.swapCount,
    }
  }

  deserialize(data: unknown): void {
    const s = data as { grid: number[][]; rows: number; cols: number; swapCount: number }
    this.grid = s.grid
    this.rows = s.rows
    this.cols = s.cols
    this.swapCount = s.swapCount
  }
}
