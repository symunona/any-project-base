import { Outlet, Navigate, useNavigate, useLocation } from 'react-router'
import { useAuth, Header, PageLayout } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'

const BASE_NAV = [
  { label: 'Dashboard', href: '/' },
  { label: 'Support',   href: '/support' },
]

export function AppLayout() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]" style={{ background: 'linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 60%, #E0F2FE 100%)' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />

  const navItems = [
    ...BASE_NAV,
    ...(config.pricingModel !== 'none' ? [{ label: 'Billing', href: '/settings/billing' }] : []),
  ]

  return (
    <PageLayout
      variant="client"
      header={
        <Header
          navItems={navItems}
          onNavigate={(href) => { void navigate(href) }}
          currentPath={location.pathname}
        />
      }
    >
      <Outlet />
    </PageLayout>
  )
}
