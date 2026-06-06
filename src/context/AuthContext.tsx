import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isCheckingRoles: boolean
  isAdmin: boolean
  isLocalManager: boolean
  localManagerDestId: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isCheckingRoles: true,
  isAdmin: false,
  isLocalManager: false,
  localManagerDestId: null,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function getUserDisplayName(user: User | null, guestLabel = 'Tamu'): string {
  if (!user) return 'Traveler'
  if (user.is_anonymous) return guestLabel
  return user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Traveler'
}

export function getUserInitials(user: User | null): string {
  if (!user) return 'T'
  if (user.is_anonymous) return 'G'
  const name = user.user_metadata?.full_name
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return (user.email?.slice(0, 2) || 'U').toUpperCase()
}

export function getUserFullName(user: User | null, guestLabel = 'Tamu'): string {
  if (!user) return 'Traveler'
  if (user.is_anonymous) return guestLabel
  return user.user_metadata?.full_name || user.email || 'Traveler'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCheckingRoles, setIsCheckingRoles] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [localManagerDestId, setLocalManagerDestId] = useState<string | null>(null)

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      subscription = data.subscription
    } catch {
      setLoading(false)
    }

    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    // Prevent premature abortion of role checks while initial session is still loading
    if (loading) return

    if (!user?.id || user.is_anonymous) {
      setIsAdmin(false)
      setLocalManagerDestId(null)
      setIsCheckingRoles(false)
      return
    }
    
    let cancelled = false
    setIsCheckingRoles(true)
    
    // Check Super Admin & Local Manager concurrently
    Promise.all([
      supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('local_managers').select('destination_id').eq('user_id', user.id).maybeSingle()
    ]).then(([adminRes, managerRes]) => {
      if (!cancelled) {
        setIsAdmin(!!adminRes.data)
        setLocalManagerDestId(managerRes.data?.destination_id || null)
        setIsCheckingRoles(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [user?.id, user?.is_anonymous, loading])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setIsAdmin(false)
    setLocalManagerDestId(null)
  }

  const isLocalManager = !!localManagerDestId

  return (
    <AuthContext.Provider value={{ user, session, loading, isCheckingRoles, isAdmin, isLocalManager, localManagerDestId, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
