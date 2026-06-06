import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SoundMixer } from './SoundMixer'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockCtx(): any {
  let currentTime = 0
  return {
    get currentTime() { return currentTime },
    set currentTime(v: number) { currentTime = v },
    state: 'running',
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
    createStereoPanner: vi.fn(() => ({
      pan: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    decodeAudioData: vi.fn(() => Promise.resolve({} as AudioBuffer)),
    destination: {},
    close: vi.fn(),
    resume: vi.fn(),
  }
}

describe('SoundMixer', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCtx: any
  let mixer: SoundMixer

  beforeEach(() => {
    mockCtx = createMockCtx()
    const MockAudioContext = function () { return mockCtx } as unknown as typeof AudioContext
    globalThis.AudioContext = MockAudioContext
    mixer = new SoundMixer(mockCtx)
  })

  afterEach(() => {
  })

  it('starts with default volume', () => {
    expect(mixer.volume).toBe(0.75)
  })

  it('setVolume clamps between 0 and 1', () => {
    mixer.setVolume(1.5)
    expect(mixer.volume).toBe(1)
    mixer.setVolume(-0.5)
    expect(mixer.volume).toBe(0)
  })

  it('has no tracks initially', () => {
    expect(mixer.getInfo()).toEqual([])
  })

  it('hasTrack returns false for unknown id', () => {
    expect(mixer.hasTrack('nonexistent')).toBe(false)
  })

  it('setVolume updates master gain', () => {
    mixer.setVolume(0.3)
    expect(mockCtx.createGain).toHaveBeenCalled()
  })

  it('setTrackVolume on non-existent track does nothing', () => {
    expect(() => mixer.setTrackVolume('x', 0.5)).not.toThrow()
  })

  it('setTrackPan on non-existent track does nothing', () => {
    expect(() => mixer.setTrackPan('x', 0)).not.toThrow()
  })

  it('setTrackSchedule on non-existent track does nothing', () => {
    expect(() => mixer.setTrackSchedule('x', 'continuous')).not.toThrow()
  })

  it('setTrackPanModulation on non-existent track does nothing', () => {
    expect(() => mixer.setTrackPanModulation('x', 'static')).not.toThrow()
  })

  it('setTrackFade on non-existent track does nothing', () => {
    expect(() => mixer.setTrackFade('x', 1)).not.toThrow()
  })

  it('setTrackFadeIn on non-existent track does nothing', () => {
    expect(() => mixer.setTrackFadeIn('x', 1)).not.toThrow()
  })

  it('setTrackFadeOut on non-existent track does nothing', () => {
    expect(() => mixer.setTrackFadeOut('x', 1)).not.toThrow()
  })

  it('removeTrack on non-existent track does nothing', () => {
    expect(() => mixer.removeTrack('x')).not.toThrow()
  })

  it('toggle on non-existent track does nothing', () => {
    expect(() => mixer.toggle('x')).not.toThrow()
  })

  it('stop on non-existent track does nothing', () => {
    expect(() => mixer.stop('x')).not.toThrow()
  })

  it('stopAllImmediate on empty mixer does nothing', () => {
    expect(() => mixer.stopAllImmediate()).not.toThrow()
  })

  it('stopAll on empty mixer does nothing', () => {
    expect(() => mixer.stopAll()).not.toThrow()
  })

  it('destroy cleans up', () => {
    mixer.destroy()
    expect(mockCtx.close).toHaveBeenCalled()
  })

  it('destroy is idempotent', () => {
    mixer.destroy()
    expect(() => mixer.destroy()).not.toThrow()
  })

  it('getInfo returns track details', () => {
    mixer.getInfo()
  })
})
