import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SyncService } from './sync-service'
import { setStorage, resetStorage, setEncryptedProfileId } from '@/lib/storage/engine'
import type { StorageAdapter } from '@/lib/storage/types'

const mockInnerStorage: StorageAdapter = (() => {
  const store = new Map<string, unknown>()
  return {
    get: <T>(k: string) => (store.get(k) as T) ?? null,
    set: <T>(k: string, v: T) => { store.set(k, v) },
    remove: (k: string) => { store.delete(k) },
    subscribe: () => () => {},
    getAll: () => {
      const r: Record<string, Record<string, unknown>> = {}
      for (const [k, v] of store) {
        const colon = k.indexOf(':')
        if (colon === -1) continue
        const ns = k.slice(0, colon)
        const ek = k.slice(colon + 1)
        if (!r[ns]) r[ns] = {}
        r[ns][ek] = v
      }
      return r
    },
    import: (data) => {
      for (const [ns, entries] of Object.entries(data)) {
        for (const [ek, v] of Object.entries(entries)) {
          store.set(`${ns}:${ek}`, v)
        }
      }
    },
  }
})()

const mockMaybeSingle = vi.fn()
const mockUpsert = vi.fn()

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: mockMaybeSingle,
      })),
    })),
    upsert: mockUpsert,
  })),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

describe('SyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStorage()
    SyncService.resetInstance()
    setStorage(mockInnerStorage)
  })



  it('getInstance returns a singleton', () => {
    const a = SyncService.getInstance()
    const b = SyncService.getInstance()
    expect(a).toBe(b)
  })

  it('resetInstance clears the singleton', () => {
    const a = SyncService.getInstance()
    SyncService.resetInstance()
    const b = SyncService.getInstance()
    expect(a).not.toBe(b)
  })

  it('login creates a client and derives key', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const svc = SyncService.getInstance()
    await svc.login('test@test.com', 'password')

    expect(svc.isLinked).toBe(true)
    expect(svc.email).toBe('test@test.com')
  })

  it('login sets client null on error', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: new Error('invalid credentials'),
    })

    const svc = SyncService.getInstance()
    await expect(svc.login('test@test.com', 'password')).rejects.toThrow()
    expect(svc.isLinked).toBe(false)
  })

  it('restore returns true when session exists', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    })

    const svc = SyncService.getInstance()
    const result = await svc.restore('password', 'test@test.com')

    expect(result).toBe(true)
    expect(svc.isLinked).toBe(true)
  })

  it('restore returns false when no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    })

    const svc = SyncService.getInstance()
    const result = await svc.restore('password', 'test@test.com')

    expect(result).toBe(false)
    expect(svc.isLinked).toBe(false)
    expect(svc.email).toBeNull()
  })

  it('push writes version and updates local version', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockUpsert.mockResolvedValue({ error: null })

    const svc = SyncService.getInstance()
    svc['client'] = mockSupabase as never
    svc['cloudKey'] = await createTestKey()
    svc['_email'] = 'test@test.com'

    setEncryptedProfileId('profile-1')

    await svc.push()

    expect(mockUpsert).toHaveBeenCalled()
    const localVersion = mockInnerStorage.get<number>('_sync:version')
    expect(localVersion).toBe(1)
  })

  it('pull reads remote data and imports locally', async () => {
    const key = await createTestKey()
    const { encrypt } = await import('@/lib/storage/adapters/encrypted')
    const encrypted = await encrypt({ player: { volume: 0.8 } }, key)

    mockMaybeSingle.mockResolvedValue({
      data: { data: encrypted, version: 5 },
      error: null,
    })

    const svc = SyncService.getInstance()
    svc['client'] = mockSupabase as never
    svc['cloudKey'] = key
    svc['_email'] = 'test@test.com'

    setEncryptedProfileId('profile-1')
    mockInnerStorage.set('_sync:version', 3)

    const result = await svc.pull()

    expect(result).toBe(true)
    expect(mockInnerStorage.get<number>('_sync:version')).toBe(5)
    expect(mockInnerStorage.get<number>('player:volume')).toBe(0.8)
  })

  it('pull skips when remote version is not newer', async () => {
    const key = await createTestKey()
    const { encrypt } = await import('@/lib/storage/adapters/encrypted')
    const encrypted = await encrypt({ player: { volume: 0.8 } }, key)

    mockMaybeSingle.mockResolvedValue({
      data: { data: encrypted, version: 2 },
      error: null,
    })

    const svc = SyncService.getInstance()
    svc['cloudKey'] = key
    svc['_email'] = 'test@test.com'

    setEncryptedProfileId('profile-1')
    mockInnerStorage.set('_sync:version', 5)

    const result = await svc.pull()
    expect(result).toBe(false)
  })

  it('logout clears all state', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    const svc = SyncService.getInstance()
    svc['client'] = mockSupabase as never
    svc['cloudKey'] = await createTestKey()
    svc['_email'] = 'test@test.com'
    svc['_lastSyncAt'] = Date.now()
    svc['_lastError'] = 'some error'

    await svc.logout()

    expect(svc.isLinked).toBe(false)
    expect(svc.email).toBeNull()
    expect(svc.lastSyncAt).toBeNull()
    expect(svc.lastError).toBeNull()
  })

  it('getStatus returns current state', () => {
    const svc = SyncService.getInstance()
    svc['client'] = {} as never
    svc['_email'] = 'test@test.com'
    svc['_lastSyncAt'] = 1000
    svc['_isSyncing'] = true
    svc['_lastError'] = null

    const status = svc.getStatus()
    expect(status.isLinked).toBe(true)
    expect(status.email).toBe('test@test.com')
    expect(status.lastSyncAt).toBe(1000)
    expect(status.isSyncing).toBe(true)
    expect(status.lastError).toBeNull()
  })
})

async function createTestKey() {
  const { deriveKey, generateSalt } = await import('@/lib/storage/adapters/encrypted')
  const salt = generateSalt()
  return deriveKey('test-password', salt)
}
