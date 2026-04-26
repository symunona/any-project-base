import { useState } from 'react'
import { useAuth, Button, useNotification, NotificationContainer } from '@any-project-base/commons'
import { fetchApi } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import { t, msg } from '@any-project-base/commons/i18n'

export function SupportPage() {
  const { user } = useAuth()
  const { notifications, notify, dismiss } = useNotification()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  if (!user) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetchApi(`${config.apiUrl}/support`, {
        method: 'POST',
        body: JSON.stringify({ subject, body }),
      })
      setSent(true)
      notify({ type: 'success', message: 'Message sent. We\'ll reply by email.' })
    } catch {
      notify({ type: 'error', message: t(msg.Common.error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t(msg.Support.title)}</h1>

      {sent ? (
        <div className="bg-[var(--color-surface)] rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)' }}>
          <p className="text-lg font-semibold mb-2">Message sent!</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            We'll reply to {user.email} as soon as possible.
          </p>
          <Button variant="ghost" onClick={() => { setSent(false); setSubject(''); setBody('') }}>
            Send another
          </Button>
        </div>
      ) : (
        <form onSubmit={(e) => { void submit(e) }}
          className="bg-[var(--color-surface)] rounded-2xl p-6 flex flex-col gap-4"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)' }}>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => { setSubject(e.target.value) }}
              placeholder="What's this about?"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
              style={{ background: 'rgba(0,0,0,0.05)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">Message</label>
            <textarea
              value={body}
              onChange={e => { setBody(e.target.value) }}
              required
              rows={5}
              placeholder="Describe your issue…"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none transition-shadow"
              style={{ background: 'rgba(0,0,0,0.05)' }}
            />
          </div>
          <Button type="submit" loading={loading}>{t(msg.Support.send)}</Button>
        </form>
      )}

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}
