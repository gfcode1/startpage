import { create } from 'zustand'
import { getStorage, setStorage, setEncryptedProfileId, getEncryptedProfileId } from '@/lib/storage/engine'
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

export interface Profile {
  id: string
  name: string
  salt: string
  verification: string
  created: number
  cloudEmail?: string
}

interface ProfileState {
  profiles: Profile[]
  activeProfileId: string | null
  isUnlocked: boolean
  isReady: boolean
  error: string | null
  cloudLinked: boolean
  cloudEmail: string | null
  lastSyncAt: number | null
  isSyncing: boolean
}

interface ProfileActions {
  loadProfiles: () => void
  createProfile: (name: string, password: string) => Promise<void>
  unlockProfile: (id: string, password: string) => Promise<boolean>
  lockProfile: () => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  clearError: () => void
  linkToCloud: (email: string, password: string) => Promise<void>
  unlinkFromCloud: () => Promise<void>
  updateSyncStatus: (lastSyncAt: number | null, isSyncing: boolean) => void
}

type ProfileStore = ProfileState & ProfileActions

let sessionKey: CryptoKey | null = null

export function getSessionKey(): CryptoKey | null {
  return sessionKey
}

function loadProfilesFromStorage(): Profile[] {
  try {
    const raw = localStorage.getItem('sd:_profiles')
    return raw ? (JSON.parse(raw) as Profile[]) : []
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

function rehydrateEagerStores() {
  const storage = getStorage()

  const volume = storage.get<number>('player:volume')
  if (volume !== null) usePlayerStore.setState({ volume })

  const widgetConfig = storage.get<WidgetState>('widget:config')
  if (widgetConfig) useWidgetStore.setState(widgetConfig)
}

export const useProfileStore = create<ProfileStore>()((set, _get) => ({
  profiles: [],
  activeProfileId: null,
  isUnlocked: false,
  isReady: false,
  error: null,
  cloudLinked: false,
  cloudEmail: null,
  lastSyncAt: null,
  isSyncing: false,

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
        cloudLinked: false,
        cloudEmail: null,
        lastSyncAt: null,
        isSyncing: false,
      })
    } catch {
      set({ error: 'Failed to create profile' })
    }
  },

  unlockProfile: async (id, password) => {
    try {
      const profiles = loadProfilesFromStorage()
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

      let cloudLinked = false
      let cloudEmail: string | null = null
      if (profile.cloudEmail) {
        cloudEmail = profile.cloudEmail
        cloudLinked = true
        try {
          const svc = SyncService.getInstance()
          await svc.restore(password, profile.cloudEmail)
        } catch {
          // cloud session restore failed, continue without sync
          cloudLinked = false
        }
      }

      set({
        profiles,
        activeProfileId: id,
        isUnlocked: true,
        error: null,
        cloudLinked,
        cloudEmail,
        lastSyncAt: null,
        isSyncing: false,
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
      set({ isUnlocked: false, activeProfileId: null, cloudLinked: false, cloudEmail: null })
      return
    }

    const svc = SyncService.getInstance()
    svc.stop()

    sessionKey = null
    getStorage()
    setStorage(getStorage())
    setEncryptedProfileId(null)

    const profiles = loadProfilesFromStorage()
    set({
      profiles,
      activeProfileId: null,
      isUnlocked: false,
      error: null,
      cloudLinked: false,
      cloudEmail: null,
      lastSyncAt: null,
      isSyncing: false,
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
      getStorage()
      setStorage(getStorage())
      setEncryptedProfileId(null)
    }

    set({ profiles, activeProfileId: null, isUnlocked: false, error: null, cloudLinked: false, cloudEmail: null, lastSyncAt: null, isSyncing: false })
  },

  linkToCloud: async (email, password) => {
    try {
      const svc = SyncService.getInstance()
      await svc.login(email, password)

      const raw = localStorage.getItem('sd:_profiles')
      if (raw) {
        const profiles = JSON.parse(raw) as Profile[]
        const updated = profiles.map((p) =>
          p.id === getEncryptedProfileId() ? { ...p, cloudEmail: email } : p,
        )
        localStorage.setItem('sd:_profiles', JSON.stringify(updated))
      }

      set({ cloudLinked: true, cloudEmail: email, error: null })
    } catch {
      set({ error: 'Failed to connect cloud account. Check your credentials.' })
    }
  },

  unlinkFromCloud: async () => {
    try {
      const svc = SyncService.getInstance()
      await svc.logout()

      const raw = localStorage.getItem('sd:_profiles')
      if (raw) {
        const profiles = JSON.parse(raw) as Profile[]
        const updated = profiles.map((p) => {
          if (p.id === getEncryptedProfileId()) {
            const copy = { ...p }
            delete copy.cloudEmail
            return copy
          }
          return p
        })
        localStorage.setItem('sd:_profiles', JSON.stringify(updated))
      }
    } catch {
      // ignore logout errors
    }

    set({ cloudLinked: false, cloudEmail: null, lastSyncAt: null, isSyncing: false })
  },

  updateSyncStatus: (lastSyncAt, isSyncing) => set({ lastSyncAt, isSyncing }),

  clearError: () => set({ error: null }),
}))

// Selectors
export const useProfiles = () => useProfileStore((s) => s.profiles)
export const useActiveProfileId = () => useProfileStore((s) => s.activeProfileId)
export const useIsUnlocked = () => useProfileStore((s) => s.isUnlocked)
export const useIsReady = () => useProfileStore((s) => s.isReady)
export const useProfileError = () => useProfileStore((s) => s.error)
export const useCloudLinked = () => useProfileStore((s) => s.cloudLinked)
export const useCloudEmail = () => useProfileStore((s) => s.cloudEmail)
export const useLastSyncAt = () => useProfileStore((s) => s.lastSyncAt)
export const useIsSyncing = () => useProfileStore((s) => s.isSyncing)

export const useActiveProfile = () =>
  useProfileStore((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? null)
