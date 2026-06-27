import { create } from 'zustand'
import { getStorage, setStorage, setEncryptedProfileId, getEncryptedProfileId, resetStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'
import {
  deriveKey,
  generateSalt,
  encrypt,
  decrypt,
  createEncryptedAdapter,
  decryptAllForProfile,
} from '@/lib/storage/adapters/encrypted'
import { usePlayerStore } from './player-store'
import { useWidgetStore } from './widget-store'
import type { WidgetState } from './widget-store'
import { createAutoBackup } from '@/lib/persistence'
import { SyncService } from '@/lib/sync/sync-service'
import { rehydrateAllStores } from '@/lib/sync/rehydrate'

export interface CloudProfile {
  id: string
  name: string
  salt: string
  verification: string
}

interface ProfileState {
  activeProfileId: string | null
  activeProfileName: string | null
  isUnlocked: boolean
  isReady: boolean
  error: string | null
  lastSyncAt: number | null
  isSyncing: boolean
  syncError: string | null
  cloudProfiles: CloudProfile[]
  cloudAuthEmail: string | null
  cloudAuthLoading: boolean
}

interface ProfileActions {
  checkCloudSession: () => Promise<void>
  cloudLogin: (email: string, password: string) => Promise<void>
  cloudSignup: (email: string, password: string) => Promise<void>
  cloudLogout: () => void
  createCloudProfile: (name: string, localPassword: string) => Promise<void>
  unlockCloudProfile: (cloudProfile: CloudProfile, localPassword: string) => Promise<boolean>
  lockProfile: () => void
  deleteProfile: (id: string) => Promise<void>
  clearError: () => void
  updateSyncStatus: (lastSyncAt: number | null, isSyncing: boolean, syncError?: string | null) => void
}

type ProfileStore = ProfileState & ProfileActions

let sessionKey: CryptoKey | null = null

export function getSessionKey(): CryptoKey | null {
  return sessionKey
}

function rehydrateEagerStores() {
  const storage = getStorage()

  const volume = storage.get<number>('player:volume')
  if (volume !== null) usePlayerStore.setState({ volume })

  const widgetConfig = storage.get<WidgetState>('widget:config')
  if (widgetConfig) useWidgetStore.setState(widgetConfig)
}

export const useProfileStore = create<ProfileStore>()((set, get) => ({
  activeProfileId: null,
  activeProfileName: null,
  isUnlocked: false,
  isReady: false,
  error: null,
  lastSyncAt: null,
  isSyncing: false,
  syncError: null,
  cloudProfiles: [],
  cloudAuthEmail: null,
  cloudAuthLoading: false,

  checkCloudSession: async () => {
    try {
      const svc = SyncService.getInstance()
      const hasSession = await svc.checkSession()
      if (hasSession) {
        const profiles = await svc.fetchCloudProfiles()
        set({
          cloudProfiles: profiles,
          cloudAuthEmail: svc.email,
          isReady: true,
        })
      } else {
        set({ isReady: true })
      }
    } catch {
      set({ isReady: true })
    }
  },

  cloudLogin: async (email, password) => {
    set({ cloudAuthLoading: true, error: null })
    try {
      const svc = SyncService.getInstance()
      await svc.login(email, password)
      const profiles = await svc.fetchCloudProfiles()
      set({ cloudProfiles: profiles, cloudAuthEmail: email, cloudAuthLoading: false, error: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect'
      set({ cloudAuthLoading: false, error: msg })
    }
  },

  cloudSignup: async (email, password) => {
    set({ cloudAuthLoading: true, error: null })
    try {
      const svc = SyncService.getInstance()
      await svc.signup(email, password)
      const hasSession = await svc.checkSession()
      if (!hasSession) {
        set({ cloudAuthLoading: false, error: 'Account created. Please check your email to confirm before signing in.' })
        return
      }
      set({ cloudProfiles: [], cloudAuthEmail: email, cloudAuthLoading: false, error: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sign up'
      set({ cloudAuthLoading: false, error: msg })
    }
  },

  cloudLogout: () => {
    SyncService.getInstance().logout().catch(() => {})
    set({ cloudProfiles: [], cloudAuthEmail: null, cloudAuthLoading: false, isReady: true, activeProfileName: null })
  },

  createCloudProfile: async (name, localPassword) => {
    set({ error: null })
    try {
      const id = generateId()
      const salt = generateSalt()
      const key = await deriveKey(localPassword, salt)
      const verification = await encrypt('ok', key)
      const saltBase64 = btoa(String.fromCharCode(...salt))

      const svc = SyncService.getInstance()

      // Push profile metadata to cloud (best-effort atomic)
      await svc.pushProfileMeta([{
        id,
        name: name.trim(),
        salt: saltBase64,
        verification,
      }])
      try {
        await svc.registerProfile(id, name.trim())
      } catch {
        // If registry fails, clean up the meta row
        await svc.deleteProfileData(id).catch(() => {})
        throw new Error('Failed to register profile')
      }

      // Set up encrypted storage
      const storage = getStorage()
      const cache = await decryptAllForProfile(storage, id, key)
      const encrypted = createEncryptedAdapter(storage, { profileId: id, key })
      for (const [k, v] of cache) {
        encrypted.set(k, v)
      }

      sessionKey = key
      setStorage(encrypted)
      setEncryptedProfileId(id)
      svc.setProfileKey(key)

      rehydrateEagerStores()

      const email = get().cloudAuthEmail

      set({
        activeProfileId: id,
        activeProfileName: name.trim(),
        isUnlocked: true,
        error: null,
        lastSyncAt: null,
        isSyncing: false,
        syncError: null,
        cloudAuthEmail: email,
      })

      // Start sync
      createAutoBackup()
      svc.start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create profile'
      set({ error: msg })
    }
  },

  unlockCloudProfile: async (cloudProfile, localPassword) => {
    set({ error: null })
    try {
      const salt = new Uint8Array(
        atob(cloudProfile.salt)
          .split('')
          .map((c) => c.charCodeAt(0)),
      )
      const key = await deriveKey(localPassword, salt)

      const check = await decrypt<string>(cloudProfile.verification, key)
      if (check !== 'ok') {
        set({ error: 'Wrong password' })
        return false
      }

      sessionKey = key
      const svc = SyncService.getInstance()
      svc.setProfileKey(key)

      // Set up encrypted storage
      const storage = getStorage()
      const cache = await decryptAllForProfile(storage, cloudProfile.id, key)
      const encrypted = createEncryptedAdapter(storage, {
        profileId: cloudProfile.id,
        key,
      })
      for (const [k, v] of cache) {
        encrypted.set(k, v)
      }

      setStorage(encrypted)
      setEncryptedProfileId(cloudProfile.id)

      rehydrateEagerStores()

      const email = get().cloudAuthEmail

      set({
        activeProfileId: cloudProfile.id,
        activeProfileName: cloudProfile.name,
        isUnlocked: true,
        error: null,
        lastSyncAt: null,
        isSyncing: false,
        syncError: null,
        cloudAuthEmail: email,
      })

      // Pull cloud data (initial full sync)
      try {
        createAutoBackup()
        await svc.fullPull(cloudProfile.id)
      } catch {
        // non-blocking; sync retries
      }
      rehydrateAllStores()

      svc.start()

      return true
    } catch {
      set({ error: 'Wrong password' })
      return false
    }
  },

  lockProfile: () => {
    const id = getEncryptedProfileId()
    const svc = SyncService.getInstance()
    svc.stop()
    svc.clearProfileKey()

    if (id) {
      // Clean up encrypted local data and sync metadata
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(`sd:${id}:`)) keysToRemove.push(k)
      }
      // Also clear sync metadata to avoid cross-profile contamination
      keysToRemove.push('sd:_sync:versions', 'sd:_sync:lastPullAt', 'sd:_sync:meta')
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    }

    sessionKey = null
    resetStorage()

    set({
      activeProfileId: null,
      activeProfileName: null,
      isUnlocked: false,
      error: null,
      lastSyncAt: null,
      isSyncing: false,
      syncError: null,
    })
  },

  deleteProfile: async (id) => {
    // Remove from cloudProfiles immediately for responsive UI
    set((s) => ({ cloudProfiles: s.cloudProfiles.filter((p) => p.id !== id) }))
    try {
      const svc = SyncService.getInstance()
      if (svc.isLinked) {
        await svc.deleteProfileData(id)
      }
    } catch {
      // best-effort
    }

    // Clean up local data
    const prefix = `sd:${id}:`
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefix)) keysToRemove.push(k)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))

    if (getEncryptedProfileId() === id) {
      sessionKey = null
      SyncService.getInstance().stop()
      SyncService.getInstance().clearProfileKey()
      resetStorage()
    }

    set({
      activeProfileId: null,
      activeProfileName: null,
      isUnlocked: false,
      error: null,
      lastSyncAt: null,
      isSyncing: false,
      syncError: null,
    })
  },

  clearError: () => set({ error: null }),

  updateSyncStatus: (lastSyncAt, isSyncing, syncError) =>
    set({ lastSyncAt, isSyncing, syncError: syncError ?? null }),
}))

// Selectors
export const useActiveProfileId = () => useProfileStore((s) => s.activeProfileId)
export const useIsUnlocked = () => useProfileStore((s) => s.isUnlocked)
export const useIsReady = () => useProfileStore((s) => s.isReady)
export const useProfileError = () => useProfileStore((s) => s.error)
export const useLastSyncAt = () => useProfileStore((s) => s.lastSyncAt)
export const useIsSyncing = () => useProfileStore((s) => s.isSyncing)
export const useSyncError = () => useProfileStore((s) => s.syncError)
export const useCloudProfiles = () => useProfileStore((s) => s.cloudProfiles)
export const useCloudAuthEmail = () => useProfileStore((s) => s.cloudAuthEmail)
export const useCloudAuthLoading = () => useProfileStore((s) => s.cloudAuthLoading)
export const useCloudEmail = () => useProfileStore((s) => s.cloudAuthEmail)

export const useActiveProfile = () => {
  const activeId = useProfileStore((s) => s.activeProfileId)
  const activeName = useProfileStore((s) => s.activeProfileName)
  if (!activeId || !activeName) return null
  return { id: activeId, name: activeName }
}
