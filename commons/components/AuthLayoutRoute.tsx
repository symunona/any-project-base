import { Outlet } from 'react-router'
import { AuthLayout } from './AuthLayout'

export function AuthLayoutRoute() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  )
}
