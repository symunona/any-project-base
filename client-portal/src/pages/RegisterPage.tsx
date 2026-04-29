import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@any-project-base/commons'
import { supabase } from '@any-project-base/commons/lib/supabase'

export function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.session) {
      // Confirmations disabled (local dev) — session returned immediately
      void navigate('/')
    } else {
      // Confirmations enabled (prod) — user must verify email first
      setCheckEmail(true)
    }
    setLoading(false)
  }

  if (checkEmail) {
    return (
      <div className="text-center flex flex-col gap-4">
        <p className="text-lg font-semibold">Check your email</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <a href="/login" className="text-sm text-[var(--color-primary)] hover:underline">
          Back to sign in
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-5">
      <div className="text-center mb-1">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Create account</h2>
      </div>

      <div className="relative">
        <input
          id="reg-email"
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
          htmlFor="reg-email"
          className="absolute left-4 top-3.5 text-sm text-[var(--color-text-muted)]
                     transition-all duration-150 pointer-events-none
                     peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
                     peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs"
        >
          Email
        </label>
      </div>

      <div className="relative">
        <input
          id="reg-password"
          type="password"
          placeholder=" "
          value={password}
          onChange={e => { setPassword(e.target.value) }}
          required
          minLength={8}
          className="peer block w-full px-4 pt-5 pb-2 text-sm text-[var(--color-text)] rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
          style={{ background: 'rgba(0,0,0,0.05)' }}
        />
        <label
          htmlFor="reg-password"
          className="absolute left-4 top-3.5 text-sm text-[var(--color-text-muted)]
                     transition-all duration-150 pointer-events-none
                     peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
                     peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs"
        >
          Password (min. 8 characters)
        </label>
      </div>

      {error && (
        <p className="px-3 py-2 rounded-xl bg-[var(--color-danger)]/8 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Create account
      </Button>

      <p className="text-sm text-center text-[var(--color-text-muted)]">
        Already have an account?{' '}
        <a href="/login" className="text-[var(--color-primary)] hover:underline font-medium">
          Sign in
        </a>
      </p>
    </form>
  )
}
