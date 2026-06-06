import type { Direction } from './types'

type DirectionCallback = (dir: Direction) => void
type ActionCallback = () => void

interface PointerState {
  startX: number
  startY: number
  started: boolean
}

const SWIPE_THRESHOLD = 30

export class InputManager {
  private element: HTMLElement
  private dirCbs: DirectionCallback[] = []
  private actionCbs: Record<string, ActionCallback[]> = {}
  private boundKeydown: (e: KeyboardEvent) => void
  private boundPointerdown: (e: PointerEvent) => void
  private boundPointerup: (e: PointerEvent) => void
  private pointer: PointerState = { startX: 0, startY: 0, started: false }

  constructor(element: HTMLElement) {
    this.element = element

    this.boundKeydown = this.onKeydown.bind(this)
    this.boundPointerdown = this.onPointerdown.bind(this)
    this.boundPointerup = this.onPointerup.bind(this)

    element.addEventListener('keydown', this.boundKeydown)
    element.addEventListener('pointerdown', this.boundPointerdown)
    element.addEventListener('pointerup', this.boundPointerup)
  }

  onDirection(cb: DirectionCallback): void {
    this.dirCbs.push(cb)
  }

  offDirection(cb: DirectionCallback): void {
    this.dirCbs = this.dirCbs.filter(c => c !== cb)
  }

  onAction(action: string, cb: ActionCallback): void {
    if (!this.actionCbs[action]) this.actionCbs[action] = []
    this.actionCbs[action].push(cb)
  }

  offAction(action: string, cb: ActionCallback): void {
    if (!this.actionCbs[action]) return
    this.actionCbs[action] = this.actionCbs[action].filter(c => c !== cb)
  }

  destroy(): void {
    this.element.removeEventListener('keydown', this.boundKeydown)
    this.element.removeEventListener('pointerdown', this.boundPointerdown)
    this.element.removeEventListener('pointerup', this.boundPointerup)
  }

  private emitDirection(dir: Direction): void {
    for (const cb of this.dirCbs) cb(dir)
  }

  private emitAction(action: string): void {
    const cbs = this.actionCbs[action]
    if (cbs) for (const cb of cbs) cb()
  }

  private onKeydown(e: KeyboardEvent): void {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down',
      ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', W: 'up',
      s: 'down', S: 'down',
      a: 'left', A: 'left',
      d: 'right', D: 'right',
    }
    const dir = keyMap[e.key]
    if (dir) {
      e.preventDefault()
      this.emitDirection(dir)
      return
    }

    if (e.key === 'Enter') this.emitAction('confirm')
    if (e.key === 'Escape') this.emitAction('pause')
    if (e.key === ' ') { e.preventDefault(); this.emitAction('pause') }
  }

  private onPointerdown(e: PointerEvent): void {
    this.pointer.startX = e.clientX
    this.pointer.startY = e.clientY
    this.pointer.started = true
  }

  private onPointerup(e: PointerEvent): void {
    if (!this.pointer.started) return
    this.pointer.started = false

    const dx = e.clientX - this.pointer.startX
    const dy = e.clientY - this.pointer.startY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) {
      this.emitAction('confirm')
      return
    }

    if (absDx > absDy) {
      this.emitDirection(dx > 0 ? 'right' : 'left')
    } else {
      this.emitDirection(dy > 0 ? 'down' : 'up')
    }
  }
}
