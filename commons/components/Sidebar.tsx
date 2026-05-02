import { useState } from 'react'
import { Menu, X, LogOut } from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

type BadgeVariant = 'primary' | 'danger' | 'warning'

type SidebarProps = {
  navItems: NavItem[]
  profileNavItems?: NavItem[]
  currentPath: string
  onNavigate: (href: string) => void
  projectName: string
  projectBadge?: string
  projectBadgeVariant?: BadgeVariant
  user: { name?: string | null; email?: string }
  role?: string | null
  onLogout: () => void
  onProfileClick?: () => void
  creditsDisplay?: React.ReactNode
}

function isActive(currentPath: string, href: string) {
  return currentPath === href || currentPath.startsWith(href + '/')
}

function NavLinks({
  navItems,
  currentPath,
  onNavigate,
  onNav,
}: {
  navItems: NavItem[]
  currentPath: string
  onNavigate: (href: string) => void
  onNav?: () => void
}) {
  return (
    <>
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = isActive(currentPath, href)
        return (
          <button
            key={href}
            onClick={() => { onNavigate(href); onNav?.() }}
            className={[
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors',
              active
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {Icon && <Icon size={18} strokeWidth={active ? 2.5 : 2} />}
            {label}
          </button>
        )
      })}
    </>
  )
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  danger:  'bg-[var(--color-danger)]/10  text-[var(--color-danger)]',
  warning: 'bg-amber-500/10              text-amber-600',
}

function LogoBrand({ projectName, projectBadge, projectBadgeVariant = 'primary' }: {
  projectName: string
  projectBadge?: string | undefined
  projectBadgeVariant?: BadgeVariant
}) {
  return (
    <>
      <img src="/logo-small.svg" alt="" className="w-7 h-7 flex-shrink-0" />
      <span className="font-bold text-[var(--color-primary)] tracking-tight">{projectName}</span>
      {projectBadge && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${BADGE_CLASSES[projectBadgeVariant]}`}>
          {projectBadge}
        </span>
      )}
    </>
  )
}

export function Sidebar({
  navItems,
  profileNavItems,
  currentPath,
  onNavigate,
  projectName,
  projectBadge,
  projectBadgeVariant = 'primary',
  user,
  role,
  onLogout,
  onProfileClick,
  creditsDisplay,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const userInitial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 min-h-screen bg-[var(--color-surface)] fixed top-0 left-0 z-30"
        style={{ boxShadow: '1px 0 0 rgba(0,0,0,0.06)' }}
      >
        <div className="h-16 flex items-center gap-2 px-6">
          <LogoBrand projectName={projectName} projectBadge={projectBadge} projectBadgeVariant={projectBadgeVariant} />
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          <NavLinks navItems={navItems} currentPath={currentPath} onNavigate={onNavigate} />
        </nav>
        {creditsDisplay && (
          <div className="px-3 pb-2">{creditsDisplay}</div>
        )}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {profileNavItems && profileNavItems.length > 0 && (
            <div className="px-3 pt-2 pb-1 flex flex-col gap-0.5">
              {profileNavItems.map(({ label, href, icon: Icon }) => {
                const active = isActive(currentPath, href)
                return (
                  <button
                    key={href}
                    onClick={() => { onNavigate(href) }}
                    className={[
                      'w-full flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      active
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
                    ].join(' ')}
                  >
                    {Icon && <Icon size={14} strokeWidth={active ? 2.5 : 2} />}
                    {label}
                  </button>
                )
              })}
            </div>
          )}
          <div className="p-4 pt-2 flex items-center gap-3">
            <button
              onClick={onProfileClick}
              className="flex items-center gap-3 flex-1 min-w-0 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors -mx-1 px-1 py-0.5 text-left"
              aria-label="Profile settings"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
                {role && <p className="text-xs text-[var(--color-text-muted)] capitalize">{role}</p>}
              </div>
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors flex-shrink-0"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[var(--color-surface)] flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <LogoBrand projectName={projectName} projectBadge={projectBadge} projectBadgeVariant={projectBadgeVariant} />
        </div>
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
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setMobileOpen(false) }}
          />
          <aside className="relative w-64 bg-[var(--color-surface)] flex flex-col">
            <div
              className="h-14 flex items-center gap-2 px-6"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
            >
              <LogoBrand projectName={projectName} projectBadge={projectBadge} projectBadgeVariant={projectBadgeVariant} />
            </div>
            <nav className="flex-1 p-3 flex flex-col gap-1">
              <NavLinks
                navItems={navItems}
                currentPath={currentPath}
                onNavigate={onNavigate}
                onNav={() => { setMobileOpen(false) }}
              />
            </nav>
            {creditsDisplay && (
              <div className="px-3 pb-2">{creditsDisplay}</div>
            )}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {profileNavItems && profileNavItems.length > 0 && (
                <div className="px-3 pt-2 pb-1 flex flex-col gap-0.5">
                  {profileNavItems.map(({ label, href, icon: Icon }) => {
                    const active = isActive(currentPath, href)
                    return (
                      <button
                        key={href}
                        onClick={() => { onNavigate(href); setMobileOpen(false) }}
                        className={[
                          'w-full flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                          active
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
                        ].join(' ')}
                      >
                        {Icon && <Icon size={14} strokeWidth={active ? 2.5 : 2} />}
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="p-4 pt-2 flex items-center gap-3">
                <button
                  onClick={() => { onProfileClick?.(); setMobileOpen(false) }}
                  className="flex items-center gap-3 flex-1 min-w-0 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors -mx-1 px-1 py-0.5 text-left"
                  aria-label="Profile settings"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
                    {role && <p className="text-xs text-[var(--color-text-muted)] capitalize">{role}</p>}
                  </div>
                </button>
                <button
                  onClick={() => { onLogout(); setMobileOpen(false) }}
                  className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors flex-shrink-0"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
