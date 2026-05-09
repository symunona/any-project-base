import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth, Button, useNotification, NotificationContainer, Input, Textarea, Card, Badge, PageHeader, fetchApi, config } from '@any-project-base/commons'
import type { SupportConversation, SupportMessage } from '@any-project-base/commons'
import { t, msg } from '@any-project-base/commons/i18n'

type View = 'list' | 'thread' | 'new'

export function SupportPage() {
  const { user } = useAuth()
  const { notifications, notify, dismiss } = useNotification()
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const qc = useQueryClient()

  const { data: convData } = useQuery({
    queryKey: ['support'],
    queryFn: () => fetchApi<{ data: SupportConversation[] }>(`${config.apiUrl}/support?limit=50`),
  })

  const { data: msgs } = useQuery({
    queryKey: ['support-msgs', selectedId],
    queryFn: () => fetchApi<SupportMessage[]>(`${config.apiUrl}/support/${selectedId}/messages`),
    enabled: Boolean(selectedId),
  })

  if (!user) return null

  const conversations = convData?.data ?? []
  const selected = conversations.find(c => c.id === selectedId)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetchApi(`${config.apiUrl}/support`, {
        method: 'POST',
        body: JSON.stringify({ subject, body }),
      })
      void qc.invalidateQueries({ queryKey: ['support'] })
      setSubject('')
      setBody('')
      setView('list')
      notify({ type: 'success', message: 'Ticket submitted.' })
    } catch {
      notify({ type: 'error', message: t(msg.Common.error) })
    } finally {
      setSubmitting(false)
    }
  }

  const sendReply = async () => {
    if (!selectedId || !replyText.trim()) return
    setReplying(true)
    try {
      await fetchApi(`${config.apiUrl}/support/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: replyText }),
      })
      setReplyText('')
      void qc.invalidateQueries({ queryKey: ['support-msgs', selectedId] })
      void qc.invalidateQueries({ queryKey: ['support'] })
    } catch {
      notify({ type: 'error', message: t(msg.Common.error) })
    } finally {
      setReplying(false)
    }
  }

  if (view === 'new') {
    return (
      <div className="max-w-lg mx-auto">
        <PageHeader title="New Support Ticket" />
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
            <div className="flex gap-2">
              <Button type="submit" loading={submitting}>{t(msg.Support.send)}</Button>
              <Button type="button" variant="ghost" onClick={() => { setView('list') }}>Cancel</Button>
            </div>
          </Card>
        </form>
        <NotificationContainer notifications={notifications} onDismiss={dismiss} />
      </div>
    )
  }

  if (view === 'thread' && selected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { setView('list') }}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            ← Back
          </button>
          <span className="text-base font-semibold text-[var(--color-text)] truncate flex-1">
            {selected.subject ?? 'Support Thread'}
          </span>
          <StatusBadge status={selected.status} />
        </div>

        <Card className="flex flex-col h-[calc(100vh-16rem)]">
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {(msgs ?? []).map(m => {
              const isOwn = m.sender_id === user.id
              return (
                <div key={m.id} className={['flex flex-col', isOwn ? 'items-end' : 'items-start'].join(' ')}>
                  <span className="text-xs text-[var(--color-text-muted)] mb-1">
                    {isOwn ? 'You' : 'Support'} · {new Date(m.created_at).toLocaleString()}
                  </span>
                  <p className={[
                    'text-sm max-w-[85%] px-4 py-2.5',
                    isOwn
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-2xl rounded-tr-sm'
                      : 'bg-[var(--color-primary)] text-white rounded-2xl rounded-tl-sm',
                  ].join(' ')}>
                    {m.body}
                  </p>
                </div>
              )
            })}
            {(msgs ?? []).length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] text-center mt-8">No messages yet.</p>
            )}
          </div>

          {selected.status !== 'closed' && (
            <div className="px-5 py-4 border-t border-[var(--color-border)] flex gap-3 items-end">
              <Textarea
                value={replyText}
                onChange={e => { setReplyText(e.target.value) }}
                rows={3}
                placeholder="Write a reply…"
              />
              <Button size="sm" onClick={() => { void sendReply() }} loading={replying}>Send</Button>
            </div>
          )}
        </Card>
        <NotificationContainer notifications={notifications} onDismiss={dismiss} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <PageHeader title={t(msg.Support.title)} />
        <Button size="sm" onClick={() => { setView('new') }}>New ticket</Button>
      </div>

      {conversations.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">No support tickets yet.</p>
          <Button onClick={() => { setView('new') }}>Open a ticket</Button>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-border)]">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setView('thread') }}
                className="w-full text-left px-5 py-4 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--color-text)] truncate">
                    {c.subject ?? 'No subject'}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {new Date(c.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    new: 'Submitted',
    open: 'In progress',
    waiting_on_customer: 'Answered',
    closed: 'Closed',
  }
  const variants: Record<string, 'success' | 'warning' | 'neutral' | 'accent'> = {
    new: 'neutral', open: 'warning', waiting_on_customer: 'accent', closed: 'success',
  }
  return <Badge variant={variants[status] ?? 'neutral'}>{labels[status] ?? status}</Badge>
}
