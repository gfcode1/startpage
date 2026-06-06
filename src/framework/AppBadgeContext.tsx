/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AppBadgeContextType {
  badges: Record<string, string | number>
  setBadge: (appId: string, count: string | number | null) => void
}

const AppBadgeContext = createContext<AppBadgeContextType>({
  badges: {},
  setBadge: () => {},
})

export function AppBadgeProvider({ children }: { children: ReactNode }) {
  const [badges, setBadges] = useState<Record<string, string | number>>({})

  const setBadge = useCallback((appId: string, count: string | number | null) => {
    setBadges(prev => {
      if (count === null) {
        const next = { ...prev }
        delete next[appId]
        return next
      }
      return { ...prev, [appId]: count }
    })
  }, [])

  return (
    <AppBadgeContext.Provider value={{ badges, setBadge }}>
      {children}
    </AppBadgeContext.Provider>
  )
}

export function useAppBadge(appId: string) {
  const { badges, setBadge } = useContext(AppBadgeContext)
  return {
    badge: badges[appId],
    setBadge: (count: string | number | null) => setBadge(appId, count),
  }
}

export function useBadges() {
  return useContext(AppBadgeContext).badges
}
