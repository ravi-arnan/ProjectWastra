import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User, Session, SupabaseClient } from '@supabase/supabase-js'

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
  // The Supabase client is imported dynamically so its ~48KB stays off the
  // landing critical path; it's only needed once we resolve auth state.
  const clientRef = useRef<SupabaseClient | null>(null)

  useEffect(() => {
    let active = true
    let subscription: { unsubscribe: () => void } | null = null

    import('../lib/supabase')
      .then(({ supabase }) => {
        if (!active) return
        clientRef.current = supabase

        supabase.auth
          .getSession()
          .then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
          })
          .catch(() => setLoading(false))

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        })
        subscription = data.subscription
      })
      .catch(() => setLoading(false))

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Prevent premature abortion of role checks while initial session is still loading
    if (loading) return

    // clientRef is always set by the time loading flips to false (see the
    // effect above), but guard anyway for safety.
    const supabase = clientRef.current
    if (!supabase || !user?.id || user.is_anonymous) {
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
    await clientRef.current?.auth.signOut()
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
