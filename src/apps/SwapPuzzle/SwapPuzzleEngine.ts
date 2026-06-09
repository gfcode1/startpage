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

const ANIM_DURATION = 280
const TILE_GAP = 2

export class SwapPuzzleEngine extends GameEngine {
  grid: number[][] = []
  rows = 4
  cols = 4
  swapCount = 0
  solved = false
  selectedR = -1
  selectedC = -1
  focusR = 0
  focusC = 0

  private puzzleImage: HTMLImageElement | null = null
  private animTargets: SwapAnimTarget[] = []
  private animCount = 0
  private onSwapCb: (() => void) | null = null
  private onSolveCb: (() => void) | null = null
  private initialised = false

  private themeBg = '#1a1a2e'
  private themeMuted = '#666'
  private themeAccent = '#06b6d4'
  private tileScale = 1

  init() {
    this.initialised = true
    this.readTheme()
  }

  private readTheme(): void {
    this.themeBg = this.getCssVar('--gf-bg-elevated') || '#1a1a2e'
    this.themeMuted = this.getCssVar('--gf-text-muted') || '#666'
    this.themeAccent = this.getCssVar('--gf-accent') || '#06b6d4'
  }

  protected onResume(): void {
    this.readTheme()
  }

  protected onPause(): void {
    this.saveGameState()
  }

  stop() {
    super.stop()
    this.animTargets = []
    this.animCount = 0
    this.selectedR = -1
    this.selectedC = -1
  }

  setImage(img: HTMLImageElement) {
    this.puzzleImage = img
  }

  setFocus(r: number, c: number) {
    this.focusR = r
    this.focusC = c
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
    this.focusR = 0
    this.focusC = 0
    this.tileScale = 1

    this.grid = []
    let n = 1
    for (let r = 0; r < this.rows; r++) {
      const row: number[] = []
      for (let c = 0; c < this.cols; c++) row.push(n++)
      this.grid.push(row)
    }

    this.shuffle()
    this.animateEntrance()
  }

  loadGameFromState(data: unknown) {
    this.deserialize(data)
    if (!this.initialised) this.init()
    this.solved = false
    this.selectedR = -1
    this.selectedC = -1
    this.animTargets = []
    this.animCount = 0
    this.tweens.clear()
  }

  private animateEntrance() {
    let delay = 0
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const target = { scale: 1 }
        this.tweens.add({
          target,
          to: { scale: 1 },
          duration: 200,
          delay,
          easing: 'easeOutBack',
        })
        delay += 20
      }
    }
  }

  private animateVictory() {
    const rows = this.rows
    const cols = this.cols
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const target = { pulse: 1 }
        this.tweens.add({
          target,
          to: { pulse: 0 },
          duration: 500,
          delay: (r * cols + c) * 30,
          easing: 'easeOutCubic',
        })
      }
    }
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
      this.audio?.playClick()
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
        this.animateVictory()
        this.playVictorySound()
        this.onSolveCb?.()
      }
    }

    this.tweens.add({ target: animA, to: { p: 1 }, duration: ANIM_DURATION, easing: 'easeOutBack', onComplete: checkDone })
    this.tweens.add({ target: animB, to: { p: 1 }, duration: ANIM_DURATION, easing: 'easeOutBack', onComplete: checkDone })

    this.swapCount++
    this.selectedR = -1
    this.selectedC = -1
    this.audio?.playMove()
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
    const gap = TILE_GAP
    const tileW = this.width / this.cols
    const tileH = this.height / this.rows

    ctx.fillStyle = this.themeBg
    this.roundRect(0, 0, this.width, this.height, 8)
    ctx.fill()

    if (!this.puzzleImage) {
      ctx.fillStyle = this.themeMuted
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

        ctx.save()
        const cx = drawX + cellW / 2
        const cy = drawY + cellH / 2
        ctx.translate(cx, cy)
        ctx.scale(this.tileScale, this.tileScale)
        ctx.drawImage(
          this.puzzleImage,
          srcCol * srcTileW, srcRow * srcTileH, srcTileW, srcTileH,
          -cellW / 2, -cellH / 2, cellW, cellH,
        )
        ctx.restore()

        const isSelected = !anim && r === this.selectedR && c === this.selectedC
        if (isSelected) {
          ctx.strokeStyle = this.themeAccent
          ctx.lineWidth = 3
          ctx.strokeRect(drawX - 1.5, drawY - 1.5, cellW + 3, cellH + 3)
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.12)'
          ctx.lineWidth = 1
          ctx.strokeRect(drawX, drawY, cellW, cellH)
        }
      }
    }

    const focusSel = this.selectedR === -1
    const fx = this.focusC * tileW + gap
    const fy = this.focusR * tileH + gap
    ctx.strokeStyle = focusSel ? this.themeAccent : 'rgba(255,255,255,0.3)'
    ctx.lineWidth = focusSel ? 3 : 2
    ctx.setLineDash([6, 4])
    ctx.strokeRect(fx - 1.5, fy - 1.5, cellW + 3, cellH + 3)
    ctx.setLineDash([])
  }

  private saveGameState(): void {
    if (!this.storage) return
    this.storage.setItem('gameState', this.serialize())
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
