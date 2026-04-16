import { Outlet, useNavigate, useLocation } from 'react-router'
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  if (!user) { void navigate('/login'); return null }

  const navItems = [
    ...BASE_NAV,
    ...(config.pricingModel !== 'none' ? [{ label: 'Billing', href: '/settings/billing' }] : []),
  ]

  return (
    <PageLayout
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
