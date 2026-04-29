import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router'
import { useAuth, Sidebar, PageLayout } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import { Users, BarChart2, MessageSquare, Settings, CreditCard, Megaphone } from 'lucide-react'
import { supabase } from '@any-project-base/commons/lib/supabase'

const NAV_ITEMS = [
  { label: 'Users',     href: '/users',     icon: Users,         roles: ['admin', 'support'] },
  { label: 'Usage',     href: '/usage',     icon: BarChart2,     roles: ['admin', 'support'] },
  { label: 'Support',   href: '/support',   icon: MessageSquare, roles: ['admin', 'support'] },
  { label: 'Broadcast', href: '/broadcast', icon: Megaphone,     roles: ['admin'] },
  { label: 'System',    href: '/system',    icon: Settings,      roles: ['admin'] },
]

const BILLING_ITEM = { label: 'Plans', href: '/plans', icon: CreditCard, roles: ['admin'] }

export function AppLayout() {
  const { user, isAdmin, isSupport, role, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isSupport))) void navigate('/login')
  }, [loading, user, isAdmin, isSupport, navigate])

  if (loading) return (
    <div
      className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]"
      style={{ background: 'linear-gradient(160deg, #F1F5F9 0%, #F8FAFC 60%, #EEF2FF 100%)' }}
    >
      Loading…
    </div>
  )
  if (!user || (!isAdmin && !isSupport)) return null

  const navItems = [
    ...NAV_ITEMS,
    ...(config.pricingModel !== 'none' ? [BILLING_ITEM] : []),
  ].filter(item => !item.roles || (role && item.roles.includes(role)))

  const handleLogout = async () => { await supabase.auth.signOut() }

  return (
    <PageLayout
      variant="admin"
      sidebar={
        <Sidebar
          navItems={navItems}
          currentPath={location.pathname}
          onNavigate={(href) => { void navigate(href) }}
          projectName={config.projectName}
          projectBadge="Admin"
          projectBadgeVariant="danger"
          user={user}
          role={role}
          onLogout={() => { void handleLogout() }}
        />
      }
    >
      <Outlet />
    </PageLayout>
  )
}
