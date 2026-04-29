import { Outlet, Navigate, useNavigate, useLocation } from 'react-router'
import { useAuth, useCredits, useSystemSettings, Sidebar, PageLayout } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import { LayoutDashboard, MessageSquare, CreditCard, Settings, Zap } from 'lucide-react'
import { supabase } from '@any-project-base/commons/lib/supabase'

const BASE_NAV = [
  { label: 'Dashboard', href: '/',        icon: LayoutDashboard },
  { label: 'Support',   href: '/support', icon: MessageSquare },
]

const BILLING_ITEM  = { label: 'Billing',      href: '/settings/billing',  icon: CreditCard }
const SETTINGS_ITEM = { label: 'Settings',     href: '/settings/profile',  icon: Settings }

function CreditsWidget({ onBuy }: { onBuy: () => void }) {
  const { balance } = useCredits()
  return (
    <div className="rounded-xl bg-[var(--color-primary)]/8 px-4 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-[var(--color-primary)]" />
        <span className="text-sm font-semibold text-[var(--color-primary)]">
          {balance.toLocaleString()}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">credits</span>
      </div>
      <button
        onClick={onBuy}
        className="text-xs font-medium text-[var(--color-primary)] hover:underline"
      >
        Buy →
      </button>
    </div>
  )
}

export function AppLayout() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: systemSettings } = useSystemSettings()

  if (loading) return (
    <div
      className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]"
      style={{ background: 'linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 60%, #E0F2FE 100%)' }}
    >
      Loading…
    </div>
  )
  if (!user) return <Navigate to="/login" replace />

  const navItems = [
    ...BASE_NAV,
    ...(config.pricingModel !== 'none' ? [BILLING_ITEM] : []),
    SETTINGS_ITEM,
  ]

  const handleLogout = async () => { await supabase.auth.signOut() }

  return (
    <PageLayout
      variant="client"
      sidebar={
        <Sidebar
          navItems={navItems}
          currentPath={location.pathname}
          onNavigate={(href) => { void navigate(href) }}
          projectName={config.projectName}
          user={user}
          role={role}
          onLogout={() => { void handleLogout() }}
          creditsDisplay={
            <CreditsWidget onBuy={() => { void navigate('/buy-credits') }} />
          }
        />
      }
    >
      {systemSettings?.maintenance_mode && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm text-center py-2 px-4">
          System maintenance in progress — some features may be temporarily unavailable.
        </div>
      )}
      <Outlet />
    </PageLayout>
  )
}
