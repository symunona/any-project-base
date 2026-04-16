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
    <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-center">Admin Login</h2>

      <div>
        <label className="block text-sm font-medium mb-1">{t(msg.Auth.email)}</label>
        <input type="email" value={email} onChange={e => { setEmail(e.target.value) }} required
          className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t(msg.Auth.password)}</label>
        <input type="password" value={password} onChange={e => { setPassword(e.target.value) }} required
          className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
      </div>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">{t(msg.Auth.signIn)}</Button>
      <DevLogin />
    </form>
  )
}
