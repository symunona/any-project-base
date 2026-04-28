import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthLayoutRoute, LoginPage, CLIENT_DEV_USERS, CookieBanner, CommitWatermark } from '@any-project-base/commons'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/settings/ProfilePage'
import { BillingPage } from './pages/settings/BillingPage'
import { SupportPage } from './pages/SupportPage'
import { BuyCreditsPage } from './pages/BuyCreditsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayoutRoute />}>
          <Route path="/login" element={
            <LoginPage
              redirectTo="/"
              showForgotPassword
              devUsers={CLIENT_DEV_USERS}
            />
          } />
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/billing" element={<BillingPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/buy-credits" element={<BuyCreditsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
      <CommitWatermark />
    </BrowserRouter>
  )
}
