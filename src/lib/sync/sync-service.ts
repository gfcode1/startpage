import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getStorage, getEncryptedProfileId } from '@/lib/storage/engine'
import { CLOUD_CONFIG } from '@/config/cloud'
import { deriveKey, encrypt, decrypt } from '@/lib/storage/adapters/encrypted'
import { rehydrateAllStores } from './rehydrate'

const CLOUD_SALT = new Uint8Array(32).fill(0xCF)

export interface SyncStatus {
  isLinked: boolean
  email: string | null
  lastSyncAt: number | null
  isSyncing: boolean
  lastError: string | null
}

export class SyncService {
  private static instance: SyncService | null = null

  private client: SupabaseClient | null = null
  private timerId: ReturnType<typeof setInterval> | null = null
  private cloudKey: CryptoKey | null = null
  private _email: string | null = null
  private _lastSyncAt: number | null = null
  private _isSyncing = false

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
    return this.client !== null
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

  async login(email: string, password: string): Promise<void> {
    const { error } = await this.ensureClient().auth.signInWithPassword({ email, password })
    if (error) {
      this.client = null
      throw error
    }
    this._email = email
    await this.deriveCloudKey(password)
  }

  async signup(email: string, password: string): Promise<void> {
    const { error } = await this.ensureClient().auth.signUp({ email, password })
    if (error) {
      this.client = null
      throw error
    }
    this._email = email
    await this.deriveCloudKey(password)
  }

  async logout(): Promise<void> {
    this.stop()
    await this.client?.auth.signOut()
    this.client = null
    this.cloudKey = null
    this._email = null
    this._lastSyncAt = null
    this._lastError = null
  }

  private async deriveCloudKey(password: string): Promise<void> {
    this.cloudKey = await deriveKey(password, CLOUD_SALT)
  }

  deriveCloudKeyFromPassword(password: string): Promise<void> {
    return this.deriveCloudKey(password)
  }

  async restore(password: string, email: string): Promise<boolean> {
    this._email = email
    await this.deriveCloudKey(password)
    const session = await this.getSessionSafe()
    if (!session) {
      this.client = null
      this.cloudKey = null
      this._email = null
      return false
    }
    return true
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

    if (error || !data) return []
    return (data as Array<{ profile_id: string; name: string; salt: string; verification: string }>).map((r) => ({
      id: r.profile_id,
      name: r.name,
      salt: r.salt,
      verification: r.verification,
    }))
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

        const decrypted = await decrypt<Record<string, Record<string, unknown>>>(data.data, this.cloudKey!)
        getStorage().import(decrypted)
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

  async syncNow(): Promise<void> {
    if (this._syncPromise) return this._syncPromise
    this._syncPromise = (async () => {
      this._isSyncing = true
      try {
        await this.pull()
        await this.push()
      } catch {
        // _lastError already set by withRetry
      } finally {
        this._isSyncing = false
        this._syncPromise = null
      }
    })()
    return this._syncPromise
  }

  start(intervalMs = CLOUD_CONFIG.syncInterval): void {
    this.stop()
    this.timerId = setInterval(() => { this.syncNow().catch(() => {}) }, intervalMs)
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
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
