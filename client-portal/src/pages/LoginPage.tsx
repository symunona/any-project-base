import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@any-project-base/commons/lib/supabase'
import { Button, DevLogin } from '@any-project-base/commons'
import { t, msg } from '@any-project-base/commons/i18n'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      void navigate('/')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-5">
        <div className="text-center mb-1">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">{t(msg.Auth.signIn)}</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Welcome back</p>
        </div>

        <div className="relative">
          <input
            id="cp-email"
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
            htmlFor="cp-email"
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
            id="cp-password"
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
            htmlFor="cp-password"
            className="absolute left-4 top-3.5 text-sm text-[var(--color-text-muted)]
                       transition-all duration-150 pointer-events-none
                       peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
                       peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs"
          >
            {t(msg.Auth.password)}
          </label>
        </div>

        <div className="flex justify-end -mt-2">
          <a href="/forgot-password" className="text-xs text-[var(--color-primary)] hover:underline">
            {t(msg.Auth.forgotPassword)}
          </a>
        </div>

        {error && (
          <p className="px-3 py-2 rounded-xl bg-[var(--color-danger)]/8 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full">
          {t(msg.Auth.signIn)}
        </Button>
      </form>

      <DevLogin />
    </div>
  )
}
