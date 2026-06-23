import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type ProtectedRouteProps = {
  requireProfile?: boolean
}

export function ProtectedRoute({ requireProfile = true }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireProfile && !profile?.profileComplete) {
    return <Navigate to="/setup-profile" replace />
  }

  return <Outlet />
}

export function GuestOnlyRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  if (user && profile?.profileComplete) {
    return <Navigate to="/" replace />
  }

  if (user && !profile?.profileComplete) {
    return <Navigate to="/setup-profile" replace />
  }

  return <Outlet />
}

export function ProfileSetupRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.profileComplete) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
