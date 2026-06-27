import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js'
import { getStorage, getEncryptedProfileId } from '@/lib/storage/engine'
import { CLOUD_CONFIG } from '@/config/cloud'
import { encrypt, decrypt } from '@/lib/storage/adapters/encrypted'
import { rehydrateAllStores } from './rehydrate'
import { SyncQueue, hashValue, type DataChange } from './sync-queue'
import { createAutoBackup } from '@/lib/persistence'

export interface SyncStatus {
  isLinked: boolean
  email: string | null
  lastSyncAt: number | null
  isSyncing: boolean
  lastError: string | null
}

const VERSIONS_KEY = '_sync:versions'
const LAST_PULL_KEY = '_sync:lastPullAt'

interface SyncEntryVersion {
  checksum: string
  timestamp: number
  deviceId: string
}

export class SyncService {
  private static instance: SyncService | null = null

  private client: SupabaseClient | null = null
  private timerId: ReturnType<typeof setInterval> | null = null
  private profileKey: CryptoKey | null = null
  private _email: string | null = null
  private _lastSyncAt: number | null = null
  private _isSyncing = false
  private _channel: RealtimeChannel | null = null

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  static resetInstance(): void {
    SyncService.instance = null
  }

  private constructor() {}

  get isLinked(): boolean {
    return this.client !== null && this._email !== null
  }

  get email(): string | null {
    return this._email
  }

  get lastSyncAt(): number | null {
    return this._lastSyncAt
  }

  get isSyncing(): boolean {
    return this._isSyncing
  }

  private ensureClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(CLOUD_CONFIG.supabaseUrl, CLOUD_CONFIG.supabaseAnonKey)
    }
    return this.client
  }

  // ── Profile key management (set by profile-store after unlock) ───

  setProfileKey(key: CryptoKey): void {
    this.profileKey = key
  }

  clearProfileKey(): void {
    this.profileKey = null
  }

  // ── Auth (cloud login only, no key derivation) ────────────────────

  async checkSession(): Promise<boolean> {
    try {
      const { data: { session } } = await this.ensureClient().auth.getSession()
      if (session) {
        this._email = session.user.email ?? null
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async login(email: string, password: string): Promise<void> {
    const { error } = await this.ensureClient().auth.signInWithPassword({ email, password })
    if (error) throw error
    this._email = email
  }

  async signup(email: string, password: string): Promise<void> {
    const { error } = await this.ensureClient().auth.signUp({ email, password })
    if (error) throw error
    this._email = email
  }

  async logout(): Promise<void> {
    this.stop()
    try {
      await this.client?.auth.signOut()
    } catch {
      // ignore signOut errors
    }
    this.profileKey = null
    this._email = null
    this._lastSyncAt = null
    this._lastError = null
  }

  // ── Profile registry (cloud profile metadata) ─────────────────────

  async pushProfileMeta(profiles: Array<{ id: string; name: string; salt: string; verification: string }>): Promise<void> {
    if (!this.client) throw new Error('Not authenticated')

    const { data: { user } } = await this.client.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const rows = profiles.map((p) => ({
      user_id: user.id,
      profile_id: p.id,
      name: p.name,
      salt: p.salt,
      verification: p.verification,
    }))

    const { error } = await this.client.from('profile_meta').upsert(rows, {
      onConflict: 'user_id,profile_id',
      ignoreDuplicates: false,
    })

    if (error) throw error
  }

  async fetchCloudProfiles(): Promise<Array<{ id: string; name: string; salt: string; verification: string }>> {
    if (!this.client) return []

    const { data: { user } } = await this.client.auth.getUser()
    if (!user) return []

    const { data, error } = await this.client
      .from('profile_meta')
      .select('profile_id, name, salt, verification')
      .eq('user_id', user.id)

    if (error) throw error
    if (!data) return []
    return (data as Array<{ profile_id: string; name: string; salt: string; verification: string }>).map((r) => ({
      id: r.profile_id,
      name: r.name,
      salt: r.salt,
      verification: r.verification,
    }))
  }

  async deleteProfileData(profileId: string): Promise<void> {
    if (!this.client) return
    try {
      const { data: { user } } = await this.client.auth.getUser()
      if (!user) return

      await Promise.all([
        this.client.from('profile_meta').delete().eq('user_id', user.id).eq('profile_id', profileId),
        this.client.from('profile_registry').delete().eq('user_id', user.id).eq('profile_id', profileId),
        this.client.from('sync_log').delete().eq('profile_id', profileId),
      ])
    } catch {
      // best-effort cleanup
    }
  }

  async registerProfile(profileId: string, profileName: string): Promise<void> {
    if (!this.client) throw new Error('Not authenticated')

    const { data: { user } } = await this.client.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { error } = await this.client.from('profile_registry').upsert({
      user_id: user.id,
      profile_id: profileId,
      name: profileName,
    }, { onConflict: 'user_id,profile_id' })

    if (error) throw error
  }

  async findProfileByName(profileName: string): Promise<{ profileId: string } | null> {
    if (!this.client) return null

    const { data: { user } } = await this.client.auth.getUser()
    if (!user) return null

    const { data, error } = await this.client
      .from('profile_registry')
      .select('profile_id')
      .eq('user_id', user.id)
      .eq('name', profileName)
      .maybeSingle()

    if (error || !data) return null
    return { profileId: data.profile_id as string }
  }

  // ── Version tracking (incremental sync change detection) ──────────

  private getVersions(): Record<string, SyncEntryVersion> {
    return getStorage().get<Record<string, SyncEntryVersion>>(VERSIONS_KEY) ?? {}
  }

  private setVersions(v: Record<string, SyncEntryVersion>): void {
    getStorage().set(VERSIONS_KEY, v)
  }

  private getLastPullAt(): number {
    return getStorage().get<number>(LAST_PULL_KEY) ?? 0
  }

  private setLastPullAt(t: number): void {
    getStorage().set(LAST_PULL_KEY, t)
  }

  private getLocalChanges(): DataChange[] {
    const storage = getStorage()
    const allData = storage.getAll()
    const versions = this.getVersions()
    const changes: DataChange[] = []
    const deviceId = SyncQueue.getDeviceId()
    const now = Date.now()

    for (const [ns, entries] of Object.entries(allData)) {
      if (ns.startsWith('_')) continue
      for (const [entryKey, value] of Object.entries(entries)) {
        const key = `${ns}:${entryKey}`
        const ch = hashValue(value)
        const prev = versions[key]
        if (prev && prev.checksum === ch) continue

        changes.push({
          namespace: ns,
          entryKey,
          value: value as Record<string, unknown>,
          checksum: ch,
          timestamp: prev ? Math.max(prev.timestamp + 1, now) : now,
          deviceId,
        })
      }
    }

    for (const key of Object.keys(versions)) {
      const colon = key.indexOf(':')
      if (colon === -1) continue
      const ns = key.slice(0, colon)
      const ek = key.slice(colon + 1)
      if (!allData[ns]?.[ek]) {
        changes.push({
          namespace: ns,
          entryKey: ek,
          value: null,
          checksum: hashValue(null),
          timestamp: now,
          deviceId,
        })
      }
    }

    return changes
  }

  // ── Incremental push (encrypt with profile key) ───────────────────

  async pushChanges(changes: DataChange[], profileId?: string): Promise<void> {
    if (!this.client || !this.profileKey || changes.length === 0) return

    try {
      await this.withRetry(async () => {
        const { data: { user } } = await this.client!.auth.getUser()
        if (!user) throw new Error('No authenticated user')

        const pid = profileId ?? getEncryptedProfileId()
        if (!pid) throw new Error('No active profile')

        const rows = await Promise.all(changes.map(async (c) => {
          const encrypted = await encrypt(c.value, this.profileKey!)
          return {
            profile_id: pid,
            namespace: c.namespace,
            entry_key: c.entryKey,
            value: encrypted,
            checksum: c.checksum,
            timestamp: c.timestamp,
            device_id: c.deviceId,
          }
        }))

        const { error } = await this.client!.from('sync_log').insert(rows)
        if (error) throw error

        const versions = this.getVersions()
        for (const c of changes) {
          versions[`${c.namespace}:${c.entryKey}`] = {
            checksum: c.checksum,
            timestamp: c.timestamp,
            deviceId: c.deviceId,
          }
        }
        this.setVersions(versions)
      })
    } catch (err) {
      this._lastError = err instanceof Error ? err.message : String(err)
      throw err
    }
  }

  // ── Pull: fetch new entries from sync_log since last pull ─────────

  async pullChanges(profileId: string): Promise<boolean> {
    if (!this.client || !this.profileKey) return false

    try {
      const result = await this.withRetry(async (): Promise<{ applied: boolean }> => {
        const lastPull = this.getLastPullAt()

        const { data, error } = await this.client!
          .from('sync_log')
          .select('namespace, entry_key, value, checksum, timestamp, device_id')
          .eq('profile_id', profileId)
          .gt('timestamp', lastPull)
          .order('timestamp', { ascending: true })

        if (error) throw error
        if (!data || data.length === 0) return { applied: false }

        const storage = getStorage()
        const versions = this.getVersions()
        let maxTimestamp = lastPull
        let hadChanges = false

        for (const row of data as Array<{
          namespace: string
          entry_key: string
          value: string
          checksum: string
          timestamp: number
          device_id: string
        }>) {
          try {
            const key = `${row.namespace}:${row.entry_key}`
            const localVersion = versions[key]

            if (localVersion && localVersion.checksum === row.checksum) {
              maxTimestamp = Math.max(maxTimestamp, row.timestamp)
              continue
            }

            const decrypted = await decrypt<unknown>(row.value, this.profileKey!)
            storage.set(key, decrypted)
            versions[key] = {
              checksum: row.checksum,
              timestamp: row.timestamp,
              deviceId: row.device_id,
            }
            hadChanges = true
            maxTimestamp = Math.max(maxTimestamp, row.timestamp)
          } catch {
            // skip entries that fail to decrypt — do NOT advance maxTimestamp
          }
        }

        if (hadChanges) {
          this.setVersions(versions)
          rehydrateAllStores()
        }
        this.setLastPullAt(maxTimestamp)

        return { applied: hadChanges }
      })

      this._lastError = null
      this._lastSyncAt = Date.now()
      this.persistSyncMeta()
      return result.applied
    } catch {
      return false
    }
  }

  // ── Full sync: pull all entries (for initial sync on new device) ──

  async fullPull(profileId: string): Promise<boolean> {
    if (!this.client || !this.profileKey) return false

    try {
      const result = await this.withRetry(async (): Promise<{ applied: boolean }> => {
        const { data, error } = await this.client!
          .from('sync_log')
          .select('namespace, entry_key, value, checksum, timestamp, device_id')
          .eq('profile_id', profileId)
          .order('timestamp', { ascending: true })

        if (error) throw error
        if (!data || data.length === 0) return { applied: false }

        createAutoBackup()

        const storage = getStorage()
        const versions: Record<string, SyncEntryVersion> = {}
        let maxTimestamp = 0

        for (const row of data as Array<{
          namespace: string
          entry_key: string
          value: string
          checksum: string
          timestamp: number
          device_id: string
        }>) {
          try {
            const key = `${row.namespace}:${row.entry_key}`
            const localVersion = versions[key]

            if (localVersion && localVersion.checksum === row.checksum) {
              maxTimestamp = Math.max(maxTimestamp, row.timestamp)
              continue
            }

            const decrypted = await decrypt<unknown>(row.value, this.profileKey!)
            if (decrypted === null) {
              storage.remove(key)
            } else {
              storage.set(key, decrypted)
            }
            versions[key] = {
              checksum: row.checksum,
              timestamp: row.timestamp,
              deviceId: row.device_id,
            }
            maxTimestamp = Math.max(maxTimestamp, row.timestamp)
          } catch {
            // skip entries that fail to decrypt — do NOT advance maxTimestamp
          }
        }

        this.setVersions(versions)
        this.setLastPullAt(maxTimestamp)
        rehydrateAllStores()

        return { applied: true }
      })

      this._lastError = null
      this._lastSyncAt = Date.now()
      this.persistSyncMeta()
      return result.applied
    } catch {
      return false
    }
  }

  // ── Apply remote change (with conflict resolution) ───────────────

  private async applyRemoteChange(change: {
    namespace: string
    entry_key: string
    value: string
    checksum: string
    timestamp: number
    device_id: string
  }): Promise<void> {
    if (!this.profileKey) return

    const storage = getStorage()
    const versions = this.getVersions()
    const key = `${change.namespace}:${change.entry_key}`
    const localVersion = versions[key]

    if (localVersion && localVersion.checksum === change.checksum) return

    try {
      const decrypted = await decrypt<unknown>(change.value, this.profileKey)
      storage.set(key, decrypted)
      versions[key] = {
        checksum: change.checksum,
        timestamp: change.timestamp,
        deviceId: change.device_id,
      }
      this.setVersions(versions)
    } catch {
      // skip entries that fail to decrypt
    }
  }

  // ── Realtime subscription ────────────────────────────────────────

  subscribeRealtime(profileId: string): void {
    this.unsubscribeRealtime()

    this._channel = this.ensureClient().channel(`sync_log:${profileId}`)
      .on(
        'postgres_changes' as never,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sync_log',
          filter: `profile_id=eq.${profileId}`,
        },
        async (payload: { new: Record<string, unknown> }) => {
          const newData = payload.new as {
            namespace: string
            entry_key: string
            value: string
            checksum: string
            timestamp: number
            device_id: string
          }

          await this.applyRemoteChange(newData)
          rehydrateAllStores()

          this._lastSyncAt = Date.now()
          this.persistSyncMeta()
        },
      )
      .subscribe()
  }

  private unsubscribeRealtime(): void {
    if (this._channel) {
      this.client?.removeChannel(this._channel)
      this._channel = null
    }
  }

  // ── Error handling ───────────────────────────────────────────────

  private _syncPromise: Promise<void> | null = null
  private _lastError: string | null = null

  get lastError(): string | null {
    return this._lastError
  }

  private async withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (err) {
        this._lastError = err instanceof Error ? err.message : String(err)
        if (attempt === maxAttempts) throw err
        await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)))
      }
    }
    throw new Error('Unreachable')
  }

  private persistSyncMeta(): void {
    getStorage().set('_sync:meta', {
      lastSyncAt: this._lastSyncAt,
      lastError: this._lastError,
    })
  }

  // ── Sync orchestration ──────────────────────────────────────────

  private _syncQueue: Array<() => void> = []

  async syncNow(): Promise<void> {
    if (this._syncPromise) {
      return new Promise<void>((resolve) => {
        this._syncQueue.push(resolve)
      })
    }

    const profileId = getEncryptedProfileId()

    this._syncPromise = (async () => {
      this._isSyncing = true
      try {
        if (profileId) {
          // 0. Snapshot before sync
          createAutoBackup()

          // 1. Push local incremental changes
          const changes = this.getLocalChanges()
          if (changes.length > 0) {
            await this.pushChanges(changes, profileId)
          }

          // 2. Pull remote changes (incremental since last pull)
          await this.pullChanges(profileId)

          // 3. Process queued changes (only those due for retry)
          const queue = SyncQueue.getDue()
          if (queue.length > 0) {
            const queuedChanges: DataChange[] = queue.map((q) => ({
              namespace: q.namespace,
              entryKey: q.entryKey,
              value: q.value,
              checksum: q.checksum,
              timestamp: q.timestamp,
              deviceId: q.deviceId,
            }))
            await this.pushChanges(queuedChanges, profileId)
            SyncQueue.clear()
          }
        }
      } catch {
        // _lastError already set
      } finally {
        this._isSyncing = false
        this._syncPromise = null

        const pending = this._syncQueue.splice(0)
        for (const resolve of pending) resolve()
      }
    })()
    return this._syncPromise
  }

  start(intervalMs = CLOUD_CONFIG.syncInterval): void {
    this.stop()
    const profileId = getEncryptedProfileId()
    if (profileId) {
      this.subscribeRealtime(profileId)
    }
    this.timerId = setInterval(() => { this.syncNow().catch(() => {}) }, intervalMs)
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.unsubscribeRealtime()
  }

  getStatus(): SyncStatus {
    return {
      isLinked: this.isLinked,
      email: this._email,
      lastSyncAt: this._lastSyncAt,
      isSyncing: this._isSyncing,
      lastError: this._lastError,
    }
  }
}
