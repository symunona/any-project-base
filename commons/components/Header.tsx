import { useState } from 'react'
import { Menu, X, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { config } from '../config'

type NavItem = {
  label: string
  href: string
  roles?: string[]
}

type HeaderProps = {
  navItems?: NavItem[]
  onNavigate?: (href: string) => void
  currentPath?: string
}

export function Header({ navItems = [], onNavigate, currentPath }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, role } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const visibleItems = navItems.filter(
    item => !item.roles || (role && item.roles.includes(role)),
  )

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface)]" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <span className="font-bold text-[var(--color-primary)] tracking-tight">{config.projectName}</span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 ml-6">
          {visibleItems.map(item => (
            <button
              key={item.href}
              onClick={() => { onNavigate?.(item.href) }}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                currentPath === item.href
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* User actions */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            <span className="text-sm text-[var(--color-text-muted)] mr-2">{user.name ?? user.email}</span>
            <button
              onClick={() => { onNavigate?.('/settings/profile') }}
              className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
          onClick={() => { setMenuOpen(v => !v) }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[var(--color-surface)] px-4 py-3 flex flex-col gap-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {visibleItems.map(item => (
            <button
              key={item.href}
              onClick={() => { onNavigate?.(item.href); setMenuOpen(false) }}
              className={[
                'text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                currentPath === item.href
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] flex items-center gap-2 mt-2"
            >
              <LogOut size={16} /> Sign out
            </button>
          )}
        </div>
      )}
    </header>
  )
}
