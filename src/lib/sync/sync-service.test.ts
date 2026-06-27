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

function makeMockSupabase(overrides?: Record<string, unknown>) {
  return {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    ...overrides,
  }
}

let mockSupabase: ReturnType<typeof makeMockSupabase>

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

describe('SyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStorage()
    SyncService.resetInstance()
    setStorage(mockInnerStorage)
    mockSupabase = makeMockSupabase()
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

  it('login authenticates and sets state', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

    const svc = SyncService.getInstance()
    await svc.login('test@test.com', 'password')

    expect(svc.isLinked).toBe(true)
    expect(svc.email).toBe('test@test.com')
  })

  it('login throws on invalid credentials', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: new Error('invalid credentials'),
    })

    const svc = SyncService.getInstance()
    await expect(svc.login('test@test.com', 'password')).rejects.toThrow()
    expect(svc.isLinked).toBe(false)
  })

  it('checkSession returns true when session exists', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'test@test.com' } } },
    })

    const svc = SyncService.getInstance()
    const result = await svc.checkSession()

    expect(result).toBe(true)
    expect(svc.isLinked).toBe(true)
    expect(svc.email).toBe('test@test.com')
  })

  it('checkSession returns false when no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    })

    const svc = SyncService.getInstance()
    const result = await svc.checkSession()

    expect(result).toBe(false)
    expect(svc.isLinked).toBe(false)
  })

  it('signup authenticates and sets state', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null })

    const svc = SyncService.getInstance()
    await svc.signup('test@test.com', 'password')

    expect(svc.isLinked).toBe(true)
    expect(svc.email).toBe('test@test.com')
  })

  it('logout clears all state', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    const svc = SyncService.getInstance()
    svc['client'] = mockSupabase as never
    svc['_email'] = 'test@test.com'
    svc['_lastSyncAt'] = Date.now()
    svc['_lastError'] = 'some error'
    svc.setProfileKey(await createTestKey())

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

  it('pushProfileMeta calls upsert', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue({ upsert: upsertMock })

    const svc = SyncService.getInstance()
    svc['client'] = mockSupabase as never

    await svc.pushProfileMeta([{
      id: 'profile-1',
      name: 'Test',
      salt: 'abc',
      verification: 'xyz',
    }])

    expect(upsertMock).toHaveBeenCalled()
  })

  it('fullPull downloads and imports data', async () => {
    const key = await createTestKey()
    const { encrypt } = await import('@/lib/storage/adapters/encrypted')
    const encrypted = await encrypt(0.8, key)

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const orderMock = vi.fn().mockResolvedValue({
      data: [{
        namespace: 'player',
        entry_key: 'volume',
        value: encrypted,
        checksum: 'abc',
        timestamp: 1000,
        device_id: 'device-1',
      }],
      error: null,
    })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    mockSupabase.from.mockReturnValue({ select: selectMock })

    const svc = SyncService.getInstance()
    svc['client'] = mockSupabase as never
    svc.setProfileKey(key)

    const result = await svc.fullPull('profile-1')

    expect(result).toBe(true)
    expect(mockInnerStorage.get<number>('player:volume')).toBe(0.8)
  })

  it('fullPull returns false when no data', async () => {
    const key = await createTestKey()

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const orderMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    mockSupabase.from.mockReturnValue({ select: selectMock })

    const svc = SyncService.getInstance()
    svc['client'] = mockSupabase as never
    svc.setProfileKey(key)

    const result = await svc.fullPull('profile-1')
    expect(result).toBe(false)
  })

  it('pushChanges encrypts and inserts rows', async () => {
    const key = await createTestKey()

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue({ insert: insertMock })

    const svc = SyncService.getInstance()
    svc['client'] = mockSupabase as never
    svc.setProfileKey(key)

    setEncryptedProfileId('profile-1')

    await svc.pushChanges([{
      namespace: 'player',
      entryKey: 'volume',
      value: 0.8,
      checksum: 'ch1',
      timestamp: Date.now(),
      deviceId: 'device-1',
    }])

    expect(insertMock).toHaveBeenCalled()
  })
})

async function createTestKey() {
  const { deriveKey, generateSalt } = await import('@/lib/storage/adapters/encrypted')
  const salt = generateSalt()
  return deriveKey('test-password', salt)
}
