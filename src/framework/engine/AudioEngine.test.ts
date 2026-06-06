import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioEngine } from './AudioEngine'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockCtx(): any {
  return {
    state: 'running',
    currentTime: 0,
    createOscillator: vi.fn(() => ({
      type: '',
      frequency: { value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    destination: {},
    resume: vi.fn(),
  }
}

describe('AudioEngine', () => {
  let engine: AudioEngine
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCtx: any
  const OriginalAudioContext = globalThis.AudioContext

  beforeEach(() => {
    mockCtx = createMockCtx()
    const MockAudioContext = function () { return mockCtx } as unknown as typeof AudioContext
    globalThis.AudioContext = MockAudioContext
    engine = new AudioEngine()
  })

  afterEach(() => {
    globalThis.AudioContext = OriginalAudioContext
  })

  it('is not ready before init', () => {
    expect(engine.ready).toBe(false)
  })

  it('is ready after init', () => {
    engine.init()
    expect(engine.ready).toBe(true)
  })

  it('does not init twice', () => {
    engine.init()
    const ctx = engine.getContext()
    engine.init()
    expect(engine.getContext()).toBe(ctx)
  })

  it('has default volume', () => {
    expect(engine.volume).toBe(0.3)
  })

  it('is not muted by default', () => {
    expect(engine.muted).toBe(false)
  })

  it('setMute silences master gain', () => {
    engine.init()
    engine.setMute(true)
    expect(engine.muted).toBe(true)
  })

  it('setMute false re-enables audio', () => {
    engine.init()
    engine.setMute(true)
    engine.setMute(false)
    expect(engine.muted).toBe(false)
  })

  it('setVolume clamps between 0 and 1', () => {
    engine.setVolume(1.5)
    expect(engine.volume).toBe(1)
    engine.setVolume(-0.5)
    expect(engine.volume).toBe(0)
  })

  it('setVolume sets gain when not muted', () => {
    engine.init()
    engine.setVolume(0.5)
    expect(engine.volume).toBe(0.5)
  })

  it('playClick creates oscillator', () => {
    engine.init()
    engine.playClick()
    expect(mockCtx.createOscillator).toHaveBeenCalled()
    expect(mockCtx.createGain).toHaveBeenCalled()
  })

  it('playHover creates oscillator', () => {
    engine.init()
    engine.playHover()
    expect(mockCtx.createOscillator).toHaveBeenCalled()
  })

  it('playMove creates oscillator', () => {
    engine.init()
    engine.playMove()
    expect(mockCtx.createOscillator).toHaveBeenCalled()
  })

  it('playMerge creates oscillator', () => {
    engine.init()
    engine.playMerge(2)
    expect(mockCtx.createOscillator).toHaveBeenCalled()
  })

  it('playNewTile creates oscillator', () => {
    engine.init()
    engine.playNewTile()
    expect(mockCtx.createOscillator).toHaveBeenCalled()
  })

  it('playGameOver creates oscillator', () => {
    engine.init()
    engine.playGameOver()
    expect(mockCtx.createOscillator).toHaveBeenCalled()
  })

  it('playVictory creates 4 oscillators for arpeggiated notes', () => {
    engine.init()
    engine.playVictory()
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4)
  })

  it('play methods do not throw before init', () => {
    expect(() => { engine.playClick() }).not.toThrow()
    expect(() => { engine.playHover() }).not.toThrow()
  })
})
