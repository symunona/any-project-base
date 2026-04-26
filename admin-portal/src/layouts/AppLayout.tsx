import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router'
import { useAuth } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import { Users, BarChart2, MessageSquare, Settings, CreditCard, Menu, X, LogOut } from 'lucide-react'
import { supabase } from '@any-project-base/commons/lib/supabase'

const NAV_ITEMS = [
  { label: 'Users',   href: '/users',   icon: Users,         roles: ['admin', 'support'] },
  { label: 'Usage',   href: '/usage',   icon: BarChart2,     roles: ['admin', 'support'] },
  { label: 'Support', href: '/support', icon: MessageSquare, roles: ['admin', 'support'] },
  { label: 'System',  href: '/system',  icon: Settings,      roles: ['admin'] },
]

const BILLING_ITEM = { label: 'Plans', href: '/plans', icon: CreditCard, roles: ['admin'] }

export function AppLayout() {
  const { user, isAdmin, isSupport, role, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isSupport))) void navigate('/login')
  }, [loading, user, isAdmin, isSupport, navigate])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">Loading…</div>
  )
  if (!user || (!isAdmin && !isSupport)) return null

  const navItems = [
    ...NAV_ITEMS,
    ...(config.pricingModel !== 'none' ? [BILLING_ITEM] : []),
  ].filter(item => !item.roles || (role && item.roles.includes(role)))

  const handleLogout = async () => { await supabase.auth.signOut() }

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/')

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <>
      {navItems.map(({ label, href, icon: Icon }) => (
        <button
          key={href}
          onClick={() => { void navigate(href); onNav?.() }}
          className={[
            'w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors',
            isActive(href)
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
          ].join(' ')}
        >
          <Icon size={18} strokeWidth={isActive(href) ? 2.5 : 2} />
          {label}
        </button>
      ))}
    </>
  )

  const userInitial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] fixed top-0 left-0 z-30">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-[var(--color-border)]">
          <span className="font-bold text-[var(--color-primary)] tracking-tight">{config.projectName}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">
            Admin
          </span>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
              <p className="text-xs text-[var(--color-text-muted)] capitalize">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors flex-shrink-0"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
        <span className="font-bold text-[var(--color-primary)]">{config.projectName}</span>
        <button
          onClick={() => { setMobileOpen(v => !v) }}
          className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setMobileOpen(false) }} />
          <aside className="relative w-64 bg-[var(--color-surface)] flex flex-col">
            <div className="h-14 flex items-center px-6 border-b border-[var(--color-border)]">
              <span className="font-bold text-[var(--color-primary)]">{config.projectName}</span>
            </div>
            <nav className="flex-1 p-3 flex flex-col gap-1">
              <NavLinks onNav={() => { setMobileOpen(false) }} />
            </nav>
            <div className="p-4 border-t border-[var(--color-border)]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pt-20 md:pt-6">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
