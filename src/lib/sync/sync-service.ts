import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js'
import { getStorage, getEncryptedProfileId } from '@/lib/storage/engine'
import { CLOUD_CONFIG } from '@/config/cloud'
import { deriveKey, encrypt, decrypt } from '@/lib/storage/adapters/encrypted'
import { rehydrateAllStores } from './rehydrate'
import { SyncQueue, hashValue, type DataChange } from './sync-queue'
import { createAutoBackup } from '@/lib/persistence'

const LEGACY_CLOUD_SALT = new Uint8Array(32).fill(0xCF)
let globalCloudSalt: Uint8Array | null = null

export interface SyncStatus {
  isLinked: boolean
  email: string | null
  lastSyncAt: number | null
  isSyncing: boolean
  lastError: string | null
}

const VERSIONS_KEY = '_sync:versions'

interface SyncEntryVersion {
  checksum: string
  timestamp: number
  deviceId: string
}

export class SyncService {
  private static instance: SyncService | null = null

  private client: SupabaseClient | null = null
  private timerId: ReturnType<typeof setInterval> | null = null
  private cloudKey: CryptoKey | null = null
  private _email: string | null = null
  private _lastSyncAt: number | null = null
  private _isSyncing = false
  private _channel: RealtimeChannel | null = null
  private _cloudSalt: Uint8Array | null = null

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

  private generateCloudSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32))
  }

  async login(email: string, password: string): Promise<void> {
    const { error } = await this.ensureClient().auth.signInWithPassword({ email, password })
    if (error) throw error
    this._email = email

    const salt = await this.fetchCloudSalt()
    if (salt) {
      this._cloudSalt = salt
      await this.deriveCloudKey(password, salt)
    } else {
      await this.deriveCloudKey(password, LEGACY_CLOUD_SALT)
      this._cloudSalt = LEGACY_CLOUD_SALT
    }
  }

  async signup(email: string, password: string): Promise<void> {
    const { error } = await this.ensureClient().auth.signUp({ email, password })
    if (error) throw error
    this._email = email
    this._cloudSalt = this.generateCloudSalt()
    await this.deriveCloudKey(password, this._cloudSalt)
    await this.upsertCloudSalt()
  }

  async logout(): Promise<void> {
    this.stop()
    this.unsubscribeRealtime()
    try {
      await this.client?.auth.signOut()
    } catch {
      // ignore signOut errors
    }
    this.cloudKey = null
    this._email = null
    this._lastSyncAt = null
    this._lastError = null
    this._cloudSalt = null
  }

  private async deriveCloudKey(password: string, salt: Uint8Array): Promise<void> {
    this.cloudKey = await deriveKey(password, salt)
  }

  async restore(password: string, email: string): Promise<boolean> {
    this._email = email

    const salt = await this.fetchCloudSalt()
    if (salt) {
      this._cloudSalt = salt
      await this.deriveCloudKey(password, salt)
    } else {
      await this.deriveCloudKey(password, LEGACY_CLOUD_SALT)
      this._cloudSalt = LEGACY_CLOUD_SALT
    }

    const session = await this.getSessionSafe()
    if (!session) {
      this.cloudKey = null
      this._email = null
      this._cloudSalt = null
      return false
    }
    return true
  }

  private async fetchCloudSalt(): Promise<Uint8Array | null> {
    globalCloudSalt = null
    try {
      const { data: { user } } = await this.ensureClient().auth.getUser()
      if (!user) return null

      const { data, error } = await this.client!
        .from('profile_meta')
        .select('cloud_salt')
        .eq('user_id', user.id)
        .not('cloud_salt', 'is', null)
        .limit(1)
        .maybeSingle()

      if (error || !data) return null
      const record = data as { cloud_salt: string }
      if (!record.cloud_salt) return null

      globalCloudSalt = Uint8Array.from(atob(record.cloud_salt), (c) => c.charCodeAt(0))
      return globalCloudSalt
    } catch {
      return null
    }
  }

  private async upsertCloudSalt(): Promise<void> {
    if (!this.client || !this._cloudSalt) return
    try {
      const { data: { user } } = await this.client.auth.getUser()
      if (!user) return

      const saltB64 = btoa(String.fromCharCode(...this._cloudSalt))
      const { error } = await this.client.from('profile_meta').upsert({
        user_id: user.id,
        profile_id: '00000000-0000-0000-0000-000000000000',
        name: '__salt_reserved__',
        salt: '',
        verification: '',
        cloud_salt: saltB64,
      }, { onConflict: 'user_id,profile_id' })
      if (error) throw error
    } catch {
      // non-blocking
    }
  }

  private async getSessionSafe(): Promise<boolean> {
    try {
      const { data: { session } } = await this.ensureClient().auth.getSession()
      return !!session
    } catch {
      return false
    }
  }

  // ── Profile registry ─────────────────────────────────────────────

  async pushProfileMeta(profiles: Array<{ id: string; name: string; salt: string; verification: string }>): Promise<void> {
    if (!this.client) throw new Error('Not authenticated')

    const { data: { user } } = await this.client.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const saltB64 = this._cloudSalt
      ? btoa(String.fromCharCode(...this._cloudSalt))
      : null

    const rows = profiles.map((p) => ({
      user_id: user.id,
      profile_id: p.id,
      name: p.name,
      salt: p.salt,
      verification: p.verification,
      cloud_salt: saltB64,
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
      .neq('profile_id', '00000000-0000-0000-0000-000000000000')

    if (error || !data) return []
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
        this.client.from('sync_entries').delete().eq('profile_id', profileId),
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

  async listRemoteProfiles(): Promise<Array<{ profileId: string; name: string }>> {
    if (!this.client) return []

    const { data: { user } } = await this.client.auth.getUser()
    if (!user) return []

    const { data, error } = await this.client
      .from('profile_registry')
      .select('profile_id, name')
      .eq('user_id', user.id)

    if (error || !data) return []
    return (data as Array<{ profile_id: string; name: string }>).map((r) => ({
      profileId: r.profile_id,
      name: r.name,
    }))
  }

  // ── Version tracking ─────────────────────────────────────────────

  private getVersions(): Record<string, SyncEntryVersion> {
    return getStorage().get<Record<string, SyncEntryVersion>>(VERSIONS_KEY) ?? {}
  }

  private setVersions(v: Record<string, SyncEntryVersion>): void {
    getStorage().set(VERSIONS_KEY, v)
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

    // Detect deletions: keys in versions but not in allData
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

  // ── Incremental push ─────────────────────────────────────────────

  async pushChanges(changes: DataChange[], profileId?: string): Promise<void> {
    if (!this.client || !this.cloudKey || changes.length === 0) return

    try {
      await this.withRetry(async () => {
        const { data: { user } } = await this.client!.auth.getUser()
        if (!user) throw new Error('No authenticated user')

        const pid = profileId ?? getEncryptedProfileId()
        if (!pid) throw new Error('No active profile')

        const rows = await Promise.all(changes.map(async (c) => {
          const encrypted = await encrypt(c.value, this.cloudKey!)
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

        // Update versions
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
      // Queue failed changes for retry
      for (const c of changes) {
        SyncQueue.enqueue(c)
      }
      this._lastError = err instanceof Error ? err.message : String(err)
      throw err
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
    if (!this.cloudKey) return

    const storage = getStorage()
    const versions = this.getVersions()
    const key = `${change.namespace}:${change.entry_key}`
    const localVersion = versions[key]

    // Conflict resolution: latest timestamp wins
    if (localVersion && localVersion.timestamp > change.timestamp) {
      // Local is newer — push local change back
      const localValue = storage.get(key)
      if (localValue !== null) {
        const ch = hashValue(localValue)
        if (ch !== change.checksum) {
          await this.pushChanges([{
            namespace: change.namespace,
            entryKey: change.entry_key,
            value: localValue as Record<string, unknown>,
            checksum: ch,
            timestamp: localVersion.timestamp,
            deviceId: SyncQueue.getDeviceId(),
          }])
        }
      }
      return
    }

    // Remote is newer or same — apply remote
    try {
      const decrypted = await decrypt<unknown>(change.value, this.cloudKey)
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
          // Skip own device changes
          if (newData.device_id === SyncQueue.getDeviceId()) return

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

  private getLocalVersion(): number {
    return getStorage().get<number>('_sync:version') ?? 0
  }

  private setLocalVersion(v: number): void {
    getStorage().set('_sync:version', v)
  }

  private persistSyncMeta(): void {
    getStorage().set('_sync:meta', {
      lastSyncAt: this._lastSyncAt,
      lastError: this._lastError,
    })
  }

  // ── Full push / pull (legacy, for initial sync) ──────────────────

  async push(): Promise<void> {
    if (!this.client || !this.cloudKey) return

    try {
      await this.withRetry(async () => {
        const data = getStorage().getAll()
        const encryptedBlob = await encrypt(data, this.cloudKey!)

        const { data: { user } } = await this.client!.auth.getUser()
        if (!user) throw new Error('No authenticated user')

        const profileId = getEncryptedProfileId()
        if (!profileId) throw new Error('No active profile')

        const { data: existing } = await this.client!
          .from('sync_entries')
          .select('version')
          .eq('profile_id', profileId)
          .maybeSingle()

        const remoteVersion = existing?.version ?? 0
        const localVersion = this.getLocalVersion()
        const version = Math.max(remoteVersion, localVersion) + 1

        await this.client!.from('sync_entries').upsert({
          user_id: user.id,
          profile_id: profileId,
          version,
          data: encryptedBlob,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,profile_id' })

        this.setLocalVersion(version)
      })
      this._lastError = null
      this._lastSyncAt = Date.now()
      this.persistSyncMeta()
    } catch {
      // _lastError already set by withRetry
    }
  }

  async pull(): Promise<boolean> {
    if (!this.client || !this.cloudKey) return false

    try {
      const result = await this.withRetry(async (): Promise<{ applied: boolean }> => {
        const profileId = getEncryptedProfileId()
        if (!profileId) throw new Error('No active profile')

        const { data, error } = await this.client!
          .from('sync_entries')
          .select('data, version')
          .eq('profile_id', profileId)
          .maybeSingle()

        if (error) throw error
        if (!data?.data) return { applied: false }

        const remoteVersion = (data as { data: string; version: number }).version ?? 0
        const localVersion = this.getLocalVersion()

        if (remoteVersion <= localVersion) return { applied: false }

        createAutoBackup()
        const decrypted = await decrypt<Record<string, Record<string, unknown>>>(data.data, this.cloudKey!)
        getStorage().import(decrypted)

        // Initialize version tracking
        const versions: Record<string, SyncEntryVersion> = {}
        const deviceId = SyncQueue.getDeviceId()
        const now = Date.now()
        for (const [ns, entries] of Object.entries(decrypted)) {
          for (const [entryKey, value] of Object.entries(entries)) {
            versions[`${ns}:${entryKey}`] = {
              checksum: hashValue(value),
              timestamp: now,
              deviceId,
            }
          }
        }
        this.setVersions(versions)
        this.setLocalVersion(remoteVersion)
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
          // 1. Full pull (initial data)
          await this.pull()

          // 2. Push incremental changes
          const changes = this.getLocalChanges()
          if (changes.length > 0) {
            await this.pushChanges(changes, profileId)
          }

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

        // Notify waiting callers
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
