import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
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

const REGISTER_LOADING = '__register__'

export function DevLogin() {
  if (config.appEnv === 'prod') return null

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState<string | null>(null)
  const navigate = useNavigate()

  const login = async (email: string) => {
    setLoading(email)
    setError(null)
    setNewEmail(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: 'devpassword' })
    if (error) {
      setError(error.message)
      setLoading(null)
    } else {
      void navigate('/')
    }
  }

  const registerNew = async () => {
    setLoading(REGISTER_LOADING)
    setError(null)
    setNewEmail(null)
    const email = `test-${Date.now()}@dev.local`
    const { error } = await supabase.auth.signUp({ email, password: 'devpassword' })
    if (error) {
      setError(error.message)
      setLoading(null)
    } else {
      setNewEmail(email)
      void navigate('/')
    }
  }

  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)' }}
         className="px-8 py-5 -mx-8 -mb-8 rounded-b-3xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-3">
        Dev Login — {config.appEnv} only
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {DEV_USERS.map(u => (
          <button
            key={u.email}
            onClick={() => { void login(u.email) }}
            disabled={loading !== null}
            className="text-left px-3 py-2 rounded-lg text-xs font-medium
                       text-[var(--color-text)] bg-white
                       hover:bg-[var(--color-primary)] hover:text-white
                       disabled:opacity-50 transition-colors"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.07)' }}
          >
            {loading === u.email ? '…' : `▶ ${u.label}`}
          </button>
        ))}
        <button
          onClick={() => { void registerNew() }}
          disabled={loading !== null}
          className="col-span-2 text-left px-3 py-2 rounded-lg text-xs font-medium
                     text-[var(--color-text-muted)] bg-white
                     hover:bg-[var(--color-primary)] hover:text-white
                     disabled:opacity-50 transition-colors"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.07)' }}
        >
          {loading === REGISTER_LOADING ? '…' : '✦ Register new test user'}
        </button>
      </div>

      {newEmail && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Registered as <span className="font-mono">{newEmail}</span>
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  )
}
