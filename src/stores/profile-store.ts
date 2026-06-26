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
import { SyncService } from '@/lib/sync/sync-service'
import { rehydrateAllStores } from '@/lib/sync/rehydrate'

export interface CloudProfile {
  id: string
  name: string
  salt: string
  verification: string
}

export interface Profile {
  id: string
  name: string
  salt: string
  verification: string
  created: number
  cloudEmail: string
}

interface ProfileState {
  profiles: Profile[]
  activeProfileId: string | null
  isUnlocked: boolean
  isReady: boolean
  error: string | null
  cloudEmail: string | null
  lastSyncAt: number | null
  isSyncing: boolean
  syncError: string | null
  cloudProfiles: CloudProfile[]
  cloudAuthEmail: string | null
  cloudAuthLoading: boolean
}

interface ProfileActions {
  loadProfiles: () => void
  createProfile: (name: string, password: string) => Promise<void>
  unlockProfile: (id: string, password: string) => Promise<boolean>
  lockProfile: () => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  clearError: () => void
  linkToCloud: (email: string, cloudPassword: string) => Promise<void>
  unlinkFromCloud: () => Promise<void>
  restoreCloudSession: (cloudPassword: string) => Promise<boolean>
  updateSyncStatus: (lastSyncAt: number | null, isSyncing: boolean, syncError?: string | null) => void
  cloudLogin: (email: string, password: string) => Promise<void>
  cloudLogout: () => void
  adoptCloudProfile: (cloudProfile: CloudProfile, password: string) => Promise<void>
}

type ProfileStore = ProfileState & ProfileActions

let sessionKey: CryptoKey | null = null

export function getSessionKey(): CryptoKey | null {
  return sessionKey
}

function loadProfilesFromStorage(): Profile[] {
  try {
    const raw = localStorage.getItem('sd:_profiles')
    if (!raw) return []
    const profiles = JSON.parse(raw) as Profile[]
    // Migration: add cloudEmail to profiles that don't have it
    return profiles.map((p) => ({
      ...p,
      cloudEmail: p.cloudEmail ?? '',
    }))
  } catch {
    return []
  }
}

function saveProfilesToStorage(profiles: Profile[]) {
  try {
    localStorage.setItem('sd:_profiles', JSON.stringify(profiles))
  } catch (_e) {
    console.warn('Failed to save profiles:', _e)
  }
}

function migrateProfileKeys(oldId: string, newId: string) {
  const oldPrefix = `sd:${oldId}:`
  const newPrefix = `sd:${newId}:`
  const toRename: Array<{ oldKey: string; newKey: string }> = []

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k?.startsWith(oldPrefix)) continue
    const rest = k.slice(oldPrefix.length)
    toRename.push({ oldKey: k, newKey: `${newPrefix}${rest}` })
  }

  for (const { oldKey, newKey } of toRename) {
    const value = localStorage.getItem(oldKey)
    if (value !== null) {
      localStorage.setItem(newKey, value)
    }
    localStorage.removeItem(oldKey)
  }
}

function rehydrateEagerStores() {
  const storage = getStorage()

  const volume = storage.get<number>('player:volume')
  if (volume !== null) usePlayerStore.setState({ volume })

  const widgetConfig = storage.get<WidgetState>('widget:config')
  if (widgetConfig) useWidgetStore.setState(widgetConfig)
}

export const useProfileStore = create<ProfileStore>()((set, get) => ({
  profiles: [],
  activeProfileId: null,
  isUnlocked: false,
  isReady: false,
  error: null,
  cloudEmail: null,
  lastSyncAt: null,
  isSyncing: false,
  syncError: null,
  cloudProfiles: [],
  cloudAuthEmail: null,
  cloudAuthLoading: false,

  loadProfiles: () => {
    const profiles = loadProfilesFromStorage()
    set({ profiles, isReady: true })
  },

  createProfile: async (name, password) => {
    try {
      const id = generateId()
      const salt = generateSalt()
      const key = await deriveKey(password, salt)
      const verification = await encrypt('ok', key)
      const saltBase64 = btoa(String.fromCharCode(...salt))

      const newProfile: Profile = {
        id,
        name: name.trim(),
        salt: saltBase64,
        verification,
        created: Date.now(),
        cloudEmail: '',
      }

      const profiles = [...loadProfilesFromStorage(), newProfile]
      saveProfilesToStorage(profiles)

      const storage = getStorage()
      const encrypted = createEncryptedAdapter(storage, {
        profileId: id,
        key,
      })
      sessionKey = key
      setStorage(encrypted)
      setEncryptedProfileId(id)

      rehydrateEagerStores()

      set({
        profiles,
        activeProfileId: id,
        isUnlocked: true,
        error: null,
        cloudEmail: null,
        lastSyncAt: null,
        isSyncing: false,
        syncError: null,
      })
    } catch {
      set({ error: 'Failed to create profile' })
    }
  },

  unlockProfile: async (id, password) => {
    try {
      let profiles = loadProfilesFromStorage()
      const profile = profiles.find((p) => p.id === id)
      if (!profile) {
        set({ error: 'Profile not found' })
        return false
      }

      const salt = new Uint8Array(
        atob(profile.salt)
          .split('')
          .map((c) => c.charCodeAt(0)),
      )
      const key = await deriveKey(password, salt)

      const check = await decrypt<string>(profile.verification, key)
      if (check !== 'ok') {
        set({ error: 'Wrong password' })
        return false
      }

      const storage = getStorage()
      const cache = await decryptAllForProfile(storage, id, key)

      const encrypted = createEncryptedAdapter(storage, {
        profileId: id,
        key,
      })

      for (const [k, v] of cache) {
        encrypted.set(k, v)
      }

      sessionKey = key
      setStorage(encrypted)
      setEncryptedProfileId(id)

      rehydrateEagerStores()

      const cloudEmail: string | null = profile.cloudEmail || null
      let lastSyncAt: number | null = null
      let syncError: string | null = null
      let finalProfileId = id

      // If cloud is connected, check if remote profileId differs from local
      if (cloudEmail) {
        try {
          const svc = SyncService.getInstance()
          const remote = await svc.findProfileByName(profile.name)
          if (remote && remote.profileId !== finalProfileId) {
            migrateProfileKeys(finalProfileId, remote.profileId)

            const updatedProfiles = loadProfilesFromStorage().map((p) =>
              p.id === finalProfileId ? { ...p, id: remote.profileId } : p,
            )
            saveProfilesToStorage(updatedProfiles)

            const cache = await decryptAllForProfile(storage, remote.profileId, key)
            const encrypted = createEncryptedAdapter(storage, { profileId: remote.profileId, key })
            for (const [k, v] of cache) {
              encrypted.set(k, v)
            }
            setStorage(encrypted)
            setEncryptedProfileId(remote.profileId)

            finalProfileId = remote.profileId
            profiles = updatedProfiles
          }
        } catch {
          // registry lookup failed, continue with local id
        }
      }

      const syncMeta = getStorage().get<{ lastSyncAt: number | null; lastError: string | null }>('_sync:meta')
      if (syncMeta) {
        lastSyncAt = syncMeta.lastSyncAt
        syncError = syncMeta.lastError
      }

      set({
        profiles,
        activeProfileId: finalProfileId,
        isUnlocked: true,
        error: null,
        cloudEmail,
        lastSyncAt,
        isSyncing: false,
        syncError,
      })
      return true
    } catch {
      set({ error: 'Wrong password' })
      return false
    }
  },

  lockProfile: async () => {
    const id = getEncryptedProfileId()
    if (!id) {
      set({ isUnlocked: false, activeProfileId: null, cloudEmail: null })
      return
    }

    const svc = SyncService.getInstance()
    svc.stop()

    sessionKey = null
    resetStorage()

    const profiles = loadProfilesFromStorage()
    set({
      profiles,
      activeProfileId: null,
      isUnlocked: false,
      error: null,
      cloudEmail: null,
      lastSyncAt: null,
      isSyncing: false,
      syncError: null,
    })
  },

  deleteProfile: async (id) => {
    const profiles = loadProfilesFromStorage().filter((p) => p.id !== id)
    saveProfilesToStorage(profiles)

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
      resetStorage()
    }

    set({ profiles, activeProfileId: null, isUnlocked: false, error: null, cloudEmail: null, lastSyncAt: null, isSyncing: false, syncError: null })
  },

  unlinkFromCloud: async () => {
    try {
      const svc = SyncService.getInstance()
      await svc.logout()

      const localId = getEncryptedProfileId()
      const raw = localStorage.getItem('sd:_profiles')
      if (raw && localId) {
        const profiles = JSON.parse(raw) as Profile[]
        const updated = profiles.map((p) =>
          p.id === localId ? { ...p, cloudEmail: '' } : p,
        )
        localStorage.setItem('sd:_profiles', JSON.stringify(updated))
      }
    } catch {
      // ignore logout errors
    }

    set({ cloudEmail: null, lastSyncAt: null, isSyncing: false, syncError: null })
  },

  linkToCloud: async (email, cloudPassword) => {
    set({ error: null })
    try {
      const localId = getEncryptedProfileId()
      if (!localId) {
        set({ error: 'No active profile' })
        return
      }

      const profiles = loadProfilesFromStorage()
      const profile = profiles.find((p) => p.id === localId)
      if (!profile) {
        set({ error: 'Profile not found' })
        return
      }

      const svc = SyncService.getInstance()
      await svc.login(email, cloudPassword)
      await svc.registerProfile(localId, profile.name)

      // Push profile metadata for cross-device discovery
      await svc.pushProfileMeta([{
        id: localId,
        name: profile.name,
        salt: profile.salt,
        verification: profile.verification,
      }])

      // Save cloudEmail in local profile
      const updatedProfiles = profiles.map((p) =>
        p.id === localId ? { ...p, cloudEmail: email } : p,
      )
      saveProfilesToStorage(updatedProfiles)

      set({
        profiles: updatedProfiles,
        cloudEmail: email,
        lastSyncAt: null,
        isSyncing: false,
        syncError: null,
      })

      // Start sync
      svc.start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to link to cloud'
      set({ error: msg })
    }
  },

  restoreCloudSession: async (cloudPassword) => {
    try {
      const localId = getEncryptedProfileId()
      if (!localId) return false

      const profiles = loadProfilesFromStorage()
      const profile = profiles.find((p) => p.id === localId)
      if (!profile?.cloudEmail) return false

      const svc = SyncService.getInstance()
      await svc.restore(cloudPassword, profile.cloudEmail)
      svc.start()

      set({ cloudEmail: profile.cloudEmail })
      return true
    } catch {
      return false
    }
  },

  updateSyncStatus: (lastSyncAt, isSyncing, syncError) =>
    set({ lastSyncAt, isSyncing, syncError: syncError ?? null }),

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

  cloudLogout: () => {
    SyncService.getInstance().logout().catch(() => {})
    set({ cloudProfiles: [], cloudAuthEmail: null, cloudAuthLoading: false })
  },

  adoptCloudProfile: async (cloudProfile, password) => {
    try {
      const salt = new Uint8Array(
        atob(cloudProfile.salt)
          .split('')
          .map((c) => c.charCodeAt(0)),
      )
      const key = await deriveKey(password, salt)

      const check = await decrypt<string>(cloudProfile.verification, key)
      if (check !== 'ok') {
        set({ error: 'Wrong password' })
        return
      }

      const localProfiles = loadProfilesFromStorage()
      const existing = localProfiles.find((p) => p.id === cloudProfile.id)

      if (existing) {
        // Delegate to existing unlock logic
        const act = get().unlockProfile
        await act(cloudProfile.id, password)
        return
      }

      const cloudEmail = get().cloudAuthEmail ?? ''

      const newProfile: Profile = {
        id: cloudProfile.id,
        name: cloudProfile.name,
        salt: cloudProfile.salt,
        verification: cloudProfile.verification,
        created: Date.now(),
        cloudEmail,
      }

      const updatedProfiles = [...localProfiles, newProfile]
      saveProfilesToStorage(updatedProfiles)

      const storage = getStorage()
      const cache = await decryptAllForProfile(storage, cloudProfile.id, key)
      const encrypted = createEncryptedAdapter(storage, {
        profileId: cloudProfile.id,
        key,
      })
      for (const [k, v] of cache) {
        encrypted.set(k, v)
      }

      sessionKey = key
      setStorage(encrypted)
      setEncryptedProfileId(cloudProfile.id)

      rehydrateEagerStores()

      set({
        profiles: updatedProfiles,
        activeProfileId: cloudProfile.id,
        isUnlocked: true,
        error: null,
        cloudEmail: cloudEmail || null,
        lastSyncAt: null,
        isSyncing: false,
        syncError: null,
        cloudProfiles: [],
        cloudAuthEmail: null,
      })

      // Register profile on cloud for cross-device discovery
      try {
        const svc = SyncService.getInstance()
        await svc.registerProfile(cloudProfile.id, cloudProfile.name)
        await svc.pushProfileMeta([{
          id: cloudProfile.id,
          name: cloudProfile.name,
          salt: cloudProfile.salt,
          verification: cloudProfile.verification,
        }])
      } catch {
        // registration failed, non-blocking
      }

      // Immediately sync to download cloud data
      try {
        const svc = SyncService.getInstance()
        const { createAutoBackup } = await import('@/lib/persistence')
        createAutoBackup()
        await svc.pull()
        rehydrateAllStores()
      } catch {
        // sync failure is non-blocking; retry happens via interval
      }
    } catch {
      set({ error: 'Wrong password' })
    }
  },

  clearError: () => set({ error: null }),
}))

// Selectors
export const useProfiles = () => useProfileStore((s) => s.profiles)
export const useActiveProfileId = () => useProfileStore((s) => s.activeProfileId)
export const useIsUnlocked = () => useProfileStore((s) => s.isUnlocked)
export const useIsReady = () => useProfileStore((s) => s.isReady)
export const useProfileError = () => useProfileStore((s) => s.error)
export const useCloudEmail = () => useProfileStore((s) => s.cloudEmail)
export const useLastSyncAt = () => useProfileStore((s) => s.lastSyncAt)
export const useIsSyncing = () => useProfileStore((s) => s.isSyncing)
export const useSyncError = () => useProfileStore((s) => s.syncError)
export const useCloudProfiles = () => useProfileStore((s) => s.cloudProfiles)
export const useCloudAuthEmail = () => useProfileStore((s) => s.cloudAuthEmail)
export const useCloudAuthLoading = () => useProfileStore((s) => s.cloudAuthLoading)

export const useActiveProfile = () =>
  useProfileStore((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? null)
