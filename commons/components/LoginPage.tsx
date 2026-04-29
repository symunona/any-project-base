import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { Button } from './Button'
import { DevLogin } from './DevLogin'
import { t, msg } from '../i18n'
import type { DevUser } from './DevLogin'

type RegistrationStatus = 'open' | 'invite_only' | 'closed'

type LoginPageProps = {
  title?: string
  redirectTo?: string
  requiredRoles?: string[]
  showForgotPassword?: boolean
  devUsers?: DevUser[]
  registrationStatus?: RegistrationStatus
  registerHref?: string
}

export function LoginPage({
  title,
  redirectTo = '/',
  requiredRoles,
  showForgotPassword = false,
  devUsers,
  registrationStatus,
  registerHref = '/register',
}: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    if (requiredRoles?.length) {
      const { data: userData } = await supabase
        .from('users').select('role').eq('id', data.user.id).single()
      if (!userData || !requiredRoles.includes(userData.role)) {
        await supabase.auth.signOut()
        setError(`Access denied. Required: ${requiredRoles.join(' or ')}.`)
        setLoading(false)
        return
      }
    }

    void navigate(redirectTo)
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-5">
      {title && (
        <div className="text-center mb-1">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">{title}</h2>
        </div>
      )}

      <div className="relative">
        <input
          id="login-email"
          type="email"
          placeholder=" "
          value={email}
          onChange={e => { setEmail(e.target.value) }}
          required
          className="peer block w-full px-4 pt-5 pb-2 text-sm text-[var(--color-text)] rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
          style={{ background: 'rgba(0,0,0,0.05)' }}
        />
        <label
          htmlFor="login-email"
          className="absolute left-4 top-3.5 text-sm text-[var(--color-text-muted)]
                     transition-all duration-150 pointer-events-none
                     peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
                     peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs"
        >
          {t(msg.Auth.email)}
        </label>
      </div>

      <div className="relative">
        <input
          id="login-password"
          type="password"
          placeholder=" "
          value={password}
          onChange={e => { setPassword(e.target.value) }}
          required
          className="peer block w-full px-4 pt-5 pb-2 text-sm text-[var(--color-text)] rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
          style={{ background: 'rgba(0,0,0,0.05)' }}
        />
        <label
          htmlFor="login-password"
          className="absolute left-4 top-3.5 text-sm text-[var(--color-text-muted)]
                     transition-all duration-150 pointer-events-none
                     peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
                     peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs"
        >
          {t(msg.Auth.password)}
        </label>
      </div>

      {error && (
        <p className="px-3 py-2 rounded-xl bg-[var(--color-danger)]/8 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        {t(msg.Auth.signIn)}
      </Button>

      {showForgotPassword && (
        <a href="/forgot-password" className="text-sm text-center text-[var(--color-primary)] hover:underline">
          {t(msg.Auth.forgotPassword)}
        </a>
      )}

      <DevLogin users={devUsers} />

      {registrationStatus === 'open' && (
        <p className="text-sm text-center text-[var(--color-text-muted)]">
          No account?{' '}
          <a href={registerHref} className="text-[var(--color-primary)] hover:underline font-medium">
            Create one
          </a>
        </p>
      )}

      {registrationStatus === 'invite_only' && (
        <p className="text-sm text-center text-[var(--color-text-muted)]">
          Registration is invite-only.
        </p>
      )}
    </form>
  )
}
