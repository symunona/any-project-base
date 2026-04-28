import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthLayoutRoute, LoginPage, ADMIN_DEV_USERS, CommitWatermark } from '@any-project-base/commons'
import { AppLayout } from './layouts/AppLayout'
import { UsersPage } from './pages/UsersPage'
import { UserDetailPage } from './pages/UserDetailPage'
import { PlansPage } from './pages/PlansPage'
import { UsagePage } from './pages/UsagePage'
import { SupportPage } from './pages/SupportPage'
import { SystemPage } from './pages/SystemPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayoutRoute />}>
          <Route path="/login" element={
            <LoginPage
              title="Admin Portal"
              redirectTo="/users"
              requiredRoles={['admin', 'support']}
              devUsers={ADMIN_DEV_USERS}
            />
          } />
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/usage" element={<UsagePage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/system" element={<SystemPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
      <CommitWatermark />
    </BrowserRouter>
  )
}
