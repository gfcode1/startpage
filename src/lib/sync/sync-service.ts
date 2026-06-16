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

  async login(email: string, password: string): Promise<void> {
    this.client = createClient(CLOUD_CONFIG.supabaseUrl, CLOUD_CONFIG.supabaseAnonKey)
    const { error } = await this.client.auth.signInWithPassword({ email, password })
    if (error) {
      this.client = null
      throw error
    }
    this._email = email
    await this.deriveCloudKey(password)
  }

  async signup(email: string, password: string): Promise<void> {
    this.client = createClient(CLOUD_CONFIG.supabaseUrl, CLOUD_CONFIG.supabaseAnonKey)
    const { error } = await this.client.auth.signUp({ email, password })
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
  }

  private async deriveCloudKey(password: string): Promise<void> {
    this.cloudKey = await deriveKey(password, CLOUD_SALT)
  }

  deriveCloudKeyFromPassword(password: string): Promise<void> {
    return this.deriveCloudKey(password)
  }

  async restore(password: string, email: string): Promise<boolean> {
    this.client = createClient(CLOUD_CONFIG.supabaseUrl, CLOUD_CONFIG.supabaseAnonKey)
    this._email = email
    await this.deriveCloudKey(password)
    const { data: { session } } = await this.client.auth.getSession()
    if (!session) {
      this.client = null
      this.cloudKey = null
      this._email = null
      return false
    }
    return true
  }

  private _syncPromise: Promise<void> | null = null

  async push(): Promise<void> {
    if (!this.client || !this.cloudKey) return

    try {
      const data = getStorage().getAll()
      const encryptedBlob = await encrypt(data, this.cloudKey)

      const { data: { user } } = await this.client.auth.getUser()
      if (!user) return

      const profileId = getEncryptedProfileId()
      if (!profileId) return

      const { data: existing } = await this.client
        .from('sync_entries')
        .select('version')
        .eq('profile_id', profileId)
        .maybeSingle()

      const version = (existing?.version ?? 0) + 1

      await this.client.from('sync_entries').upsert({
        user_id: user.id,
        profile_id: profileId,
        version,
        data: encryptedBlob,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,profile_id' })

      this._lastSyncAt = Date.now()
    } catch {
      // silent fail on sync errors
    }
  }

  async pull(): Promise<boolean> {
    if (!this.client || !this.cloudKey) return false

    try {
      const profileId = getEncryptedProfileId()
      if (!profileId) return false

      const { data, error } = await this.client
        .from('sync_entries')
        .select('data')
        .eq('profile_id', profileId)
        .maybeSingle()

      if (error || !data?.data) return false

      const decrypted = await decrypt<Record<string, Record<string, unknown>>>(data.data, this.cloudKey)
      getStorage().import(decrypted)
      rehydrateAllStores()

      this._lastSyncAt = Date.now()
      return true
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
    }
  }
}
