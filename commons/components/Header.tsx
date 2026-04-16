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
    <header className="sticky top-0 z-40 bg-[var(--color-primary)] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <span className="font-bold text-lg tracking-tight">{config.projectName}</span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 flex-1 ml-8">
          {visibleItems.map(item => (
            <button
              key={item.href}
              onClick={() => { onNavigate?.(item.href) }}
              className={[
                'text-sm font-medium opacity-80 hover:opacity-100 transition-opacity',
                currentPath === item.href ? 'opacity-100 underline underline-offset-4' : '',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* User dropdown */}
        {user && (
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm opacity-80">{user.name ?? user.email}</span>
            <button
              onClick={() => { onNavigate?.('/settings/profile') }}
              className="p-1 opacity-70 hover:opacity-100"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-1 opacity-70 hover:opacity-100"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1"
          onClick={() => { setMenuOpen(v => !v) }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[var(--color-primary)] border-t border-white/20 px-4 py-3 flex flex-col gap-3">
          {visibleItems.map(item => (
            <button
              key={item.href}
              onClick={() => { onNavigate?.(item.href); setMenuOpen(false) }}
              className="text-left text-sm font-medium opacity-80 hover:opacity-100"
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              className="text-left text-sm font-medium opacity-80 hover:opacity-100 flex items-center gap-2 mt-2"
            >
              <LogOut size={16} /> Sign out
            </button>
          )}
        </div>
      )}
    </header>
  )
}
