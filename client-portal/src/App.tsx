import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/settings/ProfilePage'
import { BillingPage } from './pages/settings/BillingPage'
import { SupportPage } from './pages/SupportPage'
import { CookieBanner, CommitWatermark } from '@any-project-base/commons'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/billing" element={<BillingPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
      <CommitWatermark />
    </BrowserRouter>
  )
}
