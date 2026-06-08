import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'

export interface TopbarAction {
  id: string
  icon: string
  label: string
  onClick: () => void
  variant?: 'primary' | 'default'
}

export interface TopbarSearch {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

interface TopbarContextValue {
  actions: TopbarAction[]
  search: TopbarSearch | null
  customSearch: ReactNode | null
  setActions: (actions: TopbarAction[]) => void
  setSearch: (search: TopbarSearch | null) => void
  setCustomSearch: (node: ReactNode | null) => void
  clearConfig: () => void
}

const TopbarContext = createContext<TopbarContextValue | null>(null)

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<TopbarAction[]>([])
  const [search, setSearch] = useState<TopbarSearch | null>(null)
  const [customSearch, setCustomSearch] = useState<ReactNode | null>(null)

  const clearConfig = useCallback(() => {
    setActions([])
    setSearch(null)
    setCustomSearch(null)
  }, [])

  const value = useMemo<TopbarContextValue>(() => ({
    actions,
    search,
    customSearch,
    setActions,
    setSearch,
    setCustomSearch,
    clearConfig,
  }), [actions, search, customSearch, clearConfig])

  return (
    <TopbarContext.Provider value={value}>
      {children}
    </TopbarContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTopbar(): TopbarContextValue {
  const ctx = useContext(TopbarContext)
  if (!ctx) throw new Error('useTopbar must be used within TopbarProvider')
  return ctx
}
