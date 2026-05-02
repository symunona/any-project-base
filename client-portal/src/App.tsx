import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthLayoutRoute, CookieBanner, CommitWatermark } from '@any-project-base/commons'
import { AppLayout } from './layouts/AppLayout'
import { ClientLoginPage } from './pages/ClientLoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { BuyCreditsPage } from './pages/BuyCreditsPage'
import { BuyCreditsSuccess } from './pages/BuyCreditsSuccess'
import { BuyCreditsCancel } from './pages/BuyCreditsCancel'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayoutRoute />}>
          <Route path="/login" element={<ClientLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/profile" element={<Navigate to="/settings?tab=profile" replace />} />
          <Route path="/settings/billing" element={<Navigate to="/settings?tab=billing" replace />} />
          <Route path="/support" element={<Navigate to="/settings?tab=support" replace />} />
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
