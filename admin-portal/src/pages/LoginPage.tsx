import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@any-project-base/commons/lib/supabase'
import { Button, DevLogin } from '@any-project-base/commons'
import { t, msg } from '@any-project-base/commons/i18n'
import { ShieldCheck } from 'lucide-react'

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
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    // Verify admin/support role before allowing in
    const { data: userData } = await supabase.from('users').select('role').eq('id', data.user.id).single()
    if (!userData || !['admin', 'support'].includes(userData.role)) {
      await supabase.auth.signOut()
      setError('Access denied. Admin or support role required.')
      setLoading(false)
      return
    }
    void navigate('/users')
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-1">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
          <ShieldCheck size={24} className="text-[var(--color-primary)]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Admin Portal</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Sign in to manage your workspace</p>
        </div>
      </div>

      {/* Email — MD3 outlined text field with floating label */}
      <div className="relative">
        <input
          id="adm-email"
          type="email"
          placeholder=" "
          value={email}
          onChange={e => { setEmail(e.target.value) }}
          required
          className="peer block w-full px-4 pt-5 pb-2 text-sm text-[var(--color-text)]
                     border border-[var(--color-border)] rounded-xl bg-transparent
                     focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]
                     transition-colors"
        />
        <label
          htmlFor="adm-email"
          className="absolute left-4 top-3.5 text-sm text-[var(--color-text-muted)]
                     transition-all duration-150 pointer-events-none
                     peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
                     peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs"
        >
          {t(msg.Auth.email)}
        </label>
      </div>

      {/* Password — MD3 outlined text field with floating label */}
      <div className="relative">
        <input
          id="adm-password"
          type="password"
          placeholder=" "
          value={password}
          onChange={e => { setPassword(e.target.value) }}
          required
          className="peer block w-full px-4 pt-5 pb-2 text-sm text-[var(--color-text)]
                     border border-[var(--color-border)] rounded-xl bg-transparent
                     focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]
                     transition-colors"
        />
        <label
          htmlFor="adm-password"
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

      <DevLogin />
    </form>
  )
}
