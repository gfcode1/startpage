import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameEngine } from './GameEngine'

class TestEngine extends GameEngine {
  initCalled = false
  updateCalledWith: number[] = []
  renderCalled = false

  init(): void { this.initCalled = true }
  protected update(dt: number): void { this.updateCalledWith.push(dt) }
  protected render(_ctx: CanvasRenderingContext2D): void { this.renderCalled = true }
}

function createCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 400
  c.height = 300
  vi.spyOn(c, 'getContext').mockReturnValue({
    canvas: c,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    rect: vi.fn(),
    roundRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D)
  return c
}

describe('GameEngine', () => {
  let engine: TestEngine
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    canvas = createCanvas()
    engine = new TestEngine(canvas)
  })

  it('constructs with canvas and 2d context', () => {
    expect(engine).toBeTruthy()
  })

  it('has input manager', () => {
    expect(engine['input']).toBeTruthy()
  })

  it('has tween manager', () => {
    expect(engine['tweens']).toBeTruthy()
  })

  it('has initial dimensions (may be 0 in jsdom)', () => {
    expect(typeof engine['width']).toBe('number')
    expect(typeof engine['height']).toBe('number')
  })
})
