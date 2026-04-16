import { useState } from 'react'
import { fetchApi } from '../api/fetchApi'
import { config } from '../config'

// GUARD — must be first check. Never renders in prod.
// Dev login: shows seed users, calls dev-login edge function.

const DEV_USERS = [
  { label: 'Admin',                email: 'admin@dev.local' },
  { label: 'Support',              email: 'support@dev.local' },
  { label: 'User',                 email: 'user@dev.local' },
  { label: 'User (no credits)',    email: 'user-nocredits@dev.local' },
  { label: 'User (subscription)',  email: 'user-sub@dev.local' },
] as const

export function DevLogin() {
  if (config.appEnv === 'prod') return null

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string) => {
    setLoading(email)
    setError(null)
    try {
      const { url } = await fetchApi<{ url: string }>(
        `${config.apiUrl}/dev-login`,
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        },
      )
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
      setLoading(null)
    }
  }

  return (
    <div className="mt-6 border border-[var(--color-border,#e5e7eb)] rounded-lg p-4 bg-[var(--color-surface-2,#f9fafb)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted,#6b7280)] mb-3">
        Dev Login — {config.appEnv} only
      </p>
      <div className="flex flex-col gap-2">
        {DEV_USERS.map(u => (
          <button
            key={u.email}
            onClick={() => { void login(u.email) }}
            disabled={loading !== null}
            className="text-left px-3 py-2 rounded-md text-sm font-medium
                       bg-[var(--color-surface,white)] border border-[var(--color-border,#e5e7eb)]
                       hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]
                       disabled:opacity-50 transition-colors"
          >
            {loading === u.email ? '…' : `▶ Login as ${u.label}`}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  )
}
