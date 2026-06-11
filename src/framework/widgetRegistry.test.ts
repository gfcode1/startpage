import { describe, it, expect } from 'vitest'
import {
  systemWidgets, widgets, getAppDefinedWidgets,
  getWidgetById, getAllWidgets, getSystemWidgets,
} from './widgetRegistry'

describe('widgetRegistry', () => {
  describe('systemWidgets', () => {
    it('has search widget with correct properties', () => {
      const sw = systemWidgets.find(w => w.id === 'search')
      expect(sw).toBeDefined()
      expect(sw!.size).toBe('large')
      expect(sw!.category).toBe('system')
      expect(sw!.defaultActive).toBe(true)
      expect(sw!.options).toHaveLength(3)
    })
  })

  describe('standard widgets', () => {
    it('has clock, quicknote, and quote', () => {
      const ids = widgets.map(w => w.id)
      expect(ids).toContain('clock')
      expect(ids).toContain('quicknote')
      expect(ids).toContain('quote')
    })
  })

  describe('getAppDefinedWidgets', () => {
    it('returns all app-defined widgets without duplicate ids', () => {
      const appWidgets = getAppDefinedWidgets()
      const ids = appWidgets.map(w => w.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(appWidgets.length).toBeGreaterThanOrEqual(14)
    })

    it('has unique widget ids across youtube, somafm, moodist', () => {
      const appWidgets = getAppDefinedWidgets()
      const nowPlayingIds = appWidgets
        .filter(w => w.id.includes('nowplaying'))
        .map(w => w.id)
      expect(nowPlayingIds).toContain('youtube-nowplaying')
      expect(nowPlayingIds).toContain('somafm-nowplaying')
      expect(nowPlayingIds).toContain('moodist-nowplaying')
    })
  })

  describe('getWidgetById', () => {
    it('finds system widgets', () => {
      expect(getWidgetById('search')).toBeDefined()
    })

    it('finds standard widgets', () => {
      expect(getWidgetById('clock')).toBeDefined()
      expect(getWidgetById('quicknote')).toBeDefined()
      expect(getWidgetById('quote')).toBeDefined()
    })

    it('finds app widgets', () => {
      expect(getWidgetById('todo')).toBeDefined()
      expect(getWidgetById('weather')).toBeDefined()
      expect(getWidgetById('youtube-nowplaying')).toBeDefined()
    })

    it('returns undefined for unknown id', () => {
      expect(getWidgetById('nonexistent')).toBeUndefined()
    })
  })

  describe('getAllWidgets', () => {
    it('returns all three categories combined', () => {
      const all = getAllWidgets()
      const categories = new Set(all.map(w => w.category))
      expect(categories.has('system')).toBe(true)
      expect(categories.has('standard')).toBe(true)
      expect(categories.has('app')).toBe(true)
    })
  })

  describe('getSystemWidgets', () => {
    it('returns all system widgets', () => {
      const result = getSystemWidgets()
      expect(result).toHaveLength(systemWidgets.length)
      expect(result.map(w => w.id)).toContain('search')
    })
  })
})
