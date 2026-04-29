import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthLayoutRoute, CookieBanner, CommitWatermark } from '@any-project-base/commons'
import { AppLayout } from './layouts/AppLayout'
import { ClientLoginPage } from './pages/ClientLoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/settings/ProfilePage'
import { BillingPage } from './pages/settings/BillingPage'
import { SupportPage } from './pages/SupportPage'
import { BuyCreditsPage } from './pages/BuyCreditsPage'
import { BuyCreditsSuccess } from './pages/BuyCreditsSuccess'
import { BuyCreditsCancel } from './pages/BuyCreditsCancel'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayoutRoute />}>
          <Route path="/login" element={<ClientLoginPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/billing" element={<BillingPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/buy-credits" element={<BuyCreditsPage />} />
          <Route path="/buy-credits/success" element={<BuyCreditsSuccess />} />
          <Route path="/buy-credits/cancel"  element={<BuyCreditsCancel />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
      <CommitWatermark />
    </BrowserRouter>
  )
}
