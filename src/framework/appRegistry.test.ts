import { describe, it, expect } from 'vitest'
import { apps, getAppById, getAppByPath } from './appRegistry'

describe('appRegistry', () => {
  it('registers all apps', () => {
    expect(apps).toHaveLength(17)
  })

  it('each app has required fields', () => {
    for (const app of apps) {
      expect(app.id).toBeTruthy()
      expect(app.name).toBeTruthy()
      expect(app.description).toBeTruthy()
      expect(app.path).toMatch(/^\//)
      expect(app.color).toMatch(/^#/)
      expect(app.gradient).toMatch(/^linear-gradient/)
      expect(['music', 'games', 'productivity', 'utilities']).toContain(app.category)
      expect(typeof app.component).toBe('object')
    }
  })

  it('all app ids are unique', () => {
    const ids = apps.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all app paths are unique', () => {
    const paths = apps.map(a => a.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('returns correct categories', () => {
    const music = apps.filter(a => a.category === 'music')
    const games = apps.filter(a => a.category === 'games')
    const productivity = apps.filter(a => a.category === 'productivity')
    const utilities = apps.filter(a => a.category === 'utilities')

    expect(music.length).toBeGreaterThanOrEqual(4)
    expect(games.length).toBeGreaterThanOrEqual(4)
    expect(productivity.length).toBeGreaterThanOrEqual(3)
    expect(utilities.length).toBeGreaterThanOrEqual(2)
  })

  describe('getAppById', () => {
    it('finds existing app', () => {
      const app = getAppById('todo')
      expect(app).toBeDefined()
      expect(app!.name).toBe('Todo List')
    })

    it('returns undefined for missing app', () => {
      expect(getAppById('nonexistent')).toBeUndefined()
    })

    it('finds all apps by id', () => {
      for (const app of apps) {
        expect(getAppById(app.id)?.id).toBe(app.id)
      }
    })
  })

  describe('getAppByPath', () => {
    it('finds existing path', () => {
      const app = getAppByPath('/weather')
      expect(app).toBeDefined()
      expect(app!.name).toBe('Weather')
    })

    it('returns undefined for missing path', () => {
      expect(getAppByPath('/nonexistent')).toBeUndefined()
    })

    it('finds all apps by path', () => {
      for (const app of apps) {
        expect(getAppByPath(app.path)?.path).toBe(app.path)
      }
    })
  })
})