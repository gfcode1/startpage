import { createContext, useContext, useEffect, useRef, useCallback, ReactNode, useState } from 'react'
import { supabase, isSupabaseEnabled } from '../supabase/client'
import { useAuth } from '../auth/AuthContext'
import { storageEngine } from '../storage/StorageEngine'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface SyncContextValue {
  status: SyncStatus
  syncNow: () => Promise<void>
  lastSynced: number | null
}

const SyncContext = createContext<SyncContextValue | null>(null)

const DEBOUNCE_MS = 2000

const NOOP_CONTEXT: SyncContextValue = {
  status: 'idle',
  syncNow: async () => {},
  lastSynced: null,
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth()
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const initialPullDone = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const pushToCloud = useCallback(async () => {
    if (!user || !supabase) return

    setStatus('syncing')
    try {
      const state = storageEngine.getAllState()
      const { error } = await supabase
        .from('profiles')
        .update({ state })
        .eq('id', user.id)

      if (error) throw error

      if (mountedRef.current) {
        setStatus('synced')
        setLastSynced(Date.now())
      }
    } catch (e) {
      console.warn('SyncContext: push failed', e)
      if (mountedRef.current) setStatus('error')
    }
  }, [user])

  const pullFromCloud = useCallback(async () => {
    if (!user || !profile) return

    try {
      const cloudState = profile.state as Record<string, Record<string, unknown>> | undefined
      if (!cloudState || Object.keys(cloudState).length === 0) return

      const localState = storageEngine.getAllState()

      const merged: Record<string, Record<string, unknown>> = {}
      const allAppIds = new Set([...Object.keys(localState), ...Object.keys(cloudState)])

      for (const appId of allAppIds) {
        const localApp = localState[appId] ?? {}
        const cloudApp = cloudState[appId] ?? {}
        merged[appId] = { ...cloudApp, ...localApp }
      }

      storageEngine.importState(merged)

      if (mountedRef.current) {
        setLastSynced(Date.now())
      }
    } catch (e) {
      console.warn('SyncContext: pull failed', e)
    }
  }, [user, profile])

  const syncNow = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    await pushToCloud()
  }, [pushToCloud])

  useEffect(() => {
    if (!user || !profile || initialPullDone.current) return
    initialPullDone.current = true

    const timer = setTimeout(() => {
      pullFromCloud()
    }, 0)

    return () => clearTimeout(timer)
  }, [user, profile, pullFromCloud])

  useEffect(() => {
    if (!user) return

    const unsub = storageEngine.subscribe(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        pushToCloud()
      }, DEBOUNCE_MS)
    })

    return () => {
      unsub()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [user, pushToCloud])

  useEffect(() => {
    if (!user || !supabase) return

    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        async () => {
          await refreshProfile()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, refreshProfile])

  useEffect(() => {
    if (!profile?.state) return
    const cloudState = profile.state as Record<string, Record<string, unknown>> | undefined
    if (!cloudState) return

    const localState = storageEngine.getAllState()

    let needsMerge = false
    for (const [appId, keys] of Object.entries(cloudState)) {
      const localApp = localState[appId] ?? {}
      for (const key of Object.keys(keys)) {
        if (!(key in localApp)) {
          needsMerge = true
          break
        }
      }
      if (needsMerge) break
    }

    if (needsMerge) {
      const merged: Record<string, Record<string, unknown>> = { ...cloudState }
      for (const [appId, keys] of Object.entries(localState)) {
        merged[appId] = { ...(merged[appId] ?? {}), ...keys }
      }
      storageEngine.importState(merged)
    }
  }, [profile])

  if (!isSupabaseEnabled) {
    return <SyncContext.Provider value={NOOP_CONTEXT}>{children}</SyncContext.Provider>
  }

  return (
    <SyncContext.Provider value={{ status, syncNow, lastSynced }}>
      {children}
    </SyncContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}
