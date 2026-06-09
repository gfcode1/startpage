import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'

const AUTH_ERROR_MAP: Record<string, string> = {
  InvalidLoginCredentials: 'Invalid email or password',
  EmailNotConfirmed: 'Please confirm your email before signing in',
  UserAlreadyRegistered: 'An account with this email already exists',
  PasswordTooWeak: 'Password must be at least 8 characters',
  default: 'Authentication failed. Please try again.',
}

function mapAuthError(error: { message: string; code?: string } | null): string | null {
  if (!error) return null

  if (error.code && AUTH_ERROR_MAP[error.code]) {
    return AUTH_ERROR_MAP[error.code]
  }

  for (const [key, msg] of Object.entries(AUTH_ERROR_MAP)) {
    if (error.message.includes(key)) return msg
  }

  return AUTH_ERROR_MAP.default
}

interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  state: Record<string, unknown>
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.warn('AuthContext: failed to fetch profile', error)
      return
    }

    if (data) {
      setProfile(data)
    } else {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: userId, display_name: '', avatar_url: null, state: {} })
        .select()
        .single()

      if (newProfile) setProfile(newProfile)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchProfile(s.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchProfile(s.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return mapAuthError(error)
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return mapAuthError(error)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      console.warn('AuthContext: failed to update profile', error)
      return
    }

    setProfile(prev => prev ? { ...prev, ...updates } : null)
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signIn, signUp, signOut, refreshProfile, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
