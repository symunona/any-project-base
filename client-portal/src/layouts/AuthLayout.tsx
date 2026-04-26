import { Outlet, Navigate } from 'react-router'
import { AuthLayout as CommonAuthLayout, useAuth } from '@any-project-base/commons'

export function AuthLayout() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]"
         style={{ background: 'linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 60%, #E0F2FE 100%)' }}>
      Loading…
    </div>
  )
  if (user) return <Navigate to="/" replace />

  return (
    <CommonAuthLayout variant="client">
      <Outlet />
    </CommonAuthLayout>
  )
}
