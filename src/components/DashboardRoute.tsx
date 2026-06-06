import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isCheckingRoles, isAdmin, isLocalManager } = useAuth()

  if (loading || isCheckingRoles) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant font-body">Memuat...</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  if (!isAdmin && !isLocalManager) return <Navigate to="/app" replace />

  return <>{children}</>
}
