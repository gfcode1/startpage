import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InputManager } from './InputManager'

describe('InputManager', () => {
  let element: HTMLElement
  let input: InputManager

  beforeEach(() => {
    element = document.createElement('div')
    element.tabIndex = 0
    document.body.appendChild(element)
    input = new InputManager(element)
  })

  afterEach(() => {
    input.destroy()
    document.body.removeChild(element)
  })

  it('emits direction on arrow keys', () => {
    const cb = vi.fn()
    input.onDirection(cb)
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(cb).toHaveBeenCalledWith('left')
  })

  it('emits direction on WASD keys', () => {
    const cb = vi.fn()
    input.onDirection(cb)
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }))
    expect(cb).toHaveBeenCalledWith('up')
  })

  it('emits confirm action on Enter', () => {
    const cb = vi.fn()
    input.onAction('confirm', cb)
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(cb).toHaveBeenCalledOnce()
  })

  it('emits pause action on Escape', () => {
    const cb = vi.fn()
    input.onAction('pause', cb)
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(cb).toHaveBeenCalledOnce()
  })

  it('emits pause action on Space', () => {
    const cb = vi.fn()
    input.onAction('pause', cb)
    element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    expect(cb).toHaveBeenCalledOnce()
  })

  it('emits confirm on tap (small pointer move)', () => {
    const cb = vi.fn()
    input.onAction('confirm', cb)
    element.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
    element.dispatchEvent(new PointerEvent('pointerup', { clientX: 105, clientY: 103 }))
    expect(cb).toHaveBeenCalledOnce()
  })

  it('emits direction on swipe', () => {
    const cb = vi.fn()
    input.onDirection(cb)
    element.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
    element.dispatchEvent(new PointerEvent('pointerup', { clientX: 200, clientY: 105 }))
    expect(cb).toHaveBeenCalledWith('right')
  })

  it('can unregister direction callback', () => {
    const cb = vi.fn()
    input.onDirection(cb)
    input.offDirection(cb)
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(cb).not.toHaveBeenCalled()
  })

  it('can unregister action callback', () => {
    const cb = vi.fn()
    input.onAction('confirm', cb)
    input.offAction('confirm', cb)
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(cb).not.toHaveBeenCalled()
  })

  it('destroy removes event listeners', () => {
    const cb = vi.fn()
    input.onDirection(cb)
    input.destroy()
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(cb).not.toHaveBeenCalled()
  })
})
