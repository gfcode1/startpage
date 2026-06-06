import { describe, it, expect, vi } from 'vitest'
import { TweenManager } from './TweenManager'

describe('TweenManager', () => {
  it('tweens a value over duration', () => {
    const tm = new TweenManager()
    const target = { x: 0 }
    tm.add({ target, to: { x: 100 }, duration: 100 })
    tm.update(50)
    expect(target.x).toBeGreaterThan(0)
    expect(target.x).toBeLessThan(100)
  })

  it('completes a tween', () => {
    const tm = new TweenManager()
    const target = { x: 0 }
    tm.add({ target, to: { x: 100 }, duration: 100 })
    tm.update(100)
    expect(target.x).toBe(100)
  })

  it('calls onComplete when done', () => {
    const tm = new TweenManager()
    const onComplete = vi.fn()
    tm.add({ target: { x: 0 }, to: { x: 1 }, duration: 50, onComplete })
    tm.update(50)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('handles delay before starting', () => {
    const tm = new TweenManager()
    const target = { x: 0 }
    tm.add({ target, to: { x: 100 }, duration: 50, delay: 0 })
    tm.update(25)
    expect(target.x).toBeGreaterThan(0)
  })

  it('handles non-zero delay', () => {
    const tm = new TweenManager()
    const target = { x: 0 }
    tm.add({ target, to: { x: 100 }, duration: 50, delay: 30 })
    tm.update(20)
    expect(target.x).toBe(0)
    tm.update(50)
    expect(target.x).toBe(0)
    tm.update(10)
    expect(target.x).toBeGreaterThan(0)
  })

  it('supports string easing key', () => {
    const tm = new TweenManager()
    const target = { y: 0 }
    tm.add({ target, to: { y: 50 }, duration: 50, easing: 'linear' })
    tm.update(25)
    expect(target.y).toBe(25)
  })

  it('removes completed tweens on subsequent update', () => {
    const tm = new TweenManager()
    tm.add({ target: { x: 0 }, to: { x: 1 }, duration: 10 })
    tm.update(10)
    expect(tm.active).toBe(true)
    tm.update(0)
    expect(tm.active).toBe(false)
  })

  it('clears all tweens', () => {
    const tm = new TweenManager()
    tm.add({ target: { x: 0 }, to: { x: 1 }, duration: 100 })
    tm.add({ target: { y: 0 }, to: { y: 1 }, duration: 100 })
    tm.clear()
    expect(tm.active).toBe(false)
  })

  it('handles multiple properties', () => {
    const tm = new TweenManager()
    const target = { x: 0, y: 0 }
    tm.add({ target, to: { x: 10, y: 20 }, duration: 100 })
    tm.update(100)
    expect(target.x).toBe(10)
    expect(target.y).toBe(20)
  })

  it('uses default easing when not specified', () => {
    const tm = new TweenManager()
    const target = { x: 0 }
    tm.add({ target, to: { x: 100 }, duration: 50 })
    tm.update(25)
    expect(target.x).toBeGreaterThan(0)
    expect(target.x).toBeLessThan(100)
  })
})
