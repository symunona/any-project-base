import { useState } from 'react'
import { useAuth, Button, useNotification, NotificationContainer, Input, Textarea, Card, PageHeader } from '@any-project-base/commons'
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
      <PageHeader title={t(msg.Support.title)} />

      {sent ? (
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold mb-2">Message sent!</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            We'll reply to {user.email} as soon as possible.
          </p>
          <Button variant="ghost" onClick={() => { setSent(false); setSubject(''); setBody('') }}>
            Send another
          </Button>
        </Card>
      ) : (
        <form onSubmit={(e) => { void submit(e) }}>
          <Card className="p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">Subject</label>
              <Input
                type="text"
                value={subject}
                onChange={e => { setSubject(e.target.value) }}
                placeholder="What's this about?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">Message</label>
              <Textarea
                value={body}
                onChange={e => { setBody(e.target.value) }}
                required
                rows={5}
                placeholder="Describe your issue…"
              />
            </div>
            <Button type="submit" loading={loading}>{t(msg.Support.send)}</Button>
          </Card>
        </form>
      )}

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}
