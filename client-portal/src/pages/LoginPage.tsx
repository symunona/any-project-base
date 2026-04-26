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
    <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-center text-[var(--color-text)]">{t(msg.Auth.signIn)}</h2>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">{t(msg.Auth.email)}</label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value) }}
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
          style={{ background: 'rgba(0,0,0,0.05)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">{t(msg.Auth.password)}</label>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value) }}
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
          style={{ background: 'rgba(0,0,0,0.05)' }}
        />
      </div>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <Button type="submit" loading={loading} className="w-full">
        {t(msg.Auth.signIn)}
      </Button>

      <a href="/forgot-password" className="text-sm text-center text-[var(--color-primary)] hover:underline">
        {t(msg.Auth.forgotPassword)}
      </a>

      <DevLogin />
    </form>
  )
}
