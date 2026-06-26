import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PageLoader } from './ui/PageLoader'

export function ProtectedRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile?.profileComplete) {
    return <Navigate to="/setup-profile" replace />
  }

  return <Outlet />
}

export function GuestOnlyRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <PageLoader />
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
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.profileComplete) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
