import '@testing-library/jest-dom'

const store = {}
const mockStorage = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value) },
  removeItem: (key) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  get length() { return Object.keys(store).length },
  key: (i) => Object.keys(store)[i] ?? null,
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true,
  configurable: true,
})

if (!Element.prototype.animate) {
  Element.prototype.animate = function () {
    return {
      finished: Promise.resolve(),
      cancel: () => {},
      play: () => {},
      pause: () => {},
      reverse: () => {},
      currentTime: 0,
      playbackRate: 1,
      startTime: null,
      timeline: null,
      playState: 'finished',
      onfinish: null,
      oncancel: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      effect: null,
      persist: () => {},
    }
  }
}
