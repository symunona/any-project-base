import { Outlet } from 'react-router'
import { AuthLayout as CommonAuthLayout } from '@any-project-base/commons'

export function AuthLayout() {
  return (
    <CommonAuthLayout>
      <Outlet />
    </CommonAuthLayout>
  )
}
