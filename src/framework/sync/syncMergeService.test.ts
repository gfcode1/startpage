import { describe, it, expect } from 'vitest'
import { mergeStorageData } from './syncMergeService'

const local = {
  app1: { theme: 'dark', volume: 0.8 },
  app2: { name: 'local' },
}

const cloud = {
  app1: { theme: 'light', lastOpened: '2025-01-01' },
  app3: { data: 'from-cloud' },
}

describe('mergeStorageData', () => {
  it('local_wins: local values override cloud, cloud-only keys are kept', () => {
    const result = mergeStorageData(local, cloud, 'local_wins')
    expect(result.app1.theme).toBe('dark')
    expect(result.app1.volume).toBe(0.8)
    expect(result.app1.lastOpened).toBe('2025-01-01')
    expect(result.app2.name).toBe('local')
    expect(result.app3.data).toBe('from-cloud')
  })

  it('cloud_wins: cloud values override local, local-only keys are kept', () => {
    const result = mergeStorageData(local, cloud, 'cloud_wins')
    expect(result.app1.theme).toBe('light')
    expect(result.app1.volume).toBe(0.8)
    expect(result.app1.lastOpened).toBe('2025-01-01')
    expect(result.app2.name).toBe('local')
    expect(result.app3.data).toBe('from-cloud')
  })

  it('fill_missing: cloud fills gaps in local, does not overwrite existing', () => {
    const result = mergeStorageData(local, cloud, 'fill_missing')
    expect(result.app1.theme).toBe('dark')
    expect(result.app1.volume).toBe(0.8)
    expect(result.app1.lastOpened).toBe('2025-01-01')
    expect(result.app2.name).toBe('local')
    expect(result.app3.data).toBe('from-cloud')
  })

  it('returns local when cloud is empty', () => {
    const result = mergeStorageData(local, {}, 'local_wins')
    expect(result).toEqual(local)
  })

  it('returns local when cloud is undefined', () => {
    const result = mergeStorageData(local, undefined, 'local_wins')
    expect(result).toEqual(local)
  })

  it('handles empty local state', () => {
    const result = mergeStorageData({}, cloud, 'cloud_wins')
    expect(result).toEqual(cloud)
  })
})
