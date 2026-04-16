import { Outlet, useNavigate, useLocation } from 'react-router'
import { useAuth, Header, PageLayout } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'

const BASE_NAV = [
  { label: 'Users',   href: '/users',   roles: ['admin', 'support'] },
  { label: 'Usage',   href: '/usage',   roles: ['admin', 'support'] },
  { label: 'Support', href: '/support', roles: ['admin', 'support'] },
  { label: 'System',  href: '/system',  roles: ['admin'] },
]

export function AppLayout() {
  const { user, isAdmin, isSupport, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  if (!user || (!isAdmin && !isSupport)) { void navigate('/login'); return null }

  const navItems = [
    ...BASE_NAV,
    ...(config.pricingModel !== 'none' ? [{ label: 'Plans', href: '/plans', roles: ['admin'] }] : []),
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
