import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi, Badge, Button, useNotification, NotificationContainer } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { SupportConversation, SupportMessage } from '@any-project-base/commons'

export function SupportPage() {
  const { notifications, notify, dismiss } = useNotification()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const qc = useQueryClient()

  const { data: convs } = useQuery({
    queryKey: ['support', statusFilter],
    queryFn: () => fetchApi<{ data: SupportConversation[] }>(
      `${config.apiUrl}/support?limit=50&offset=0${statusFilter ? `&status=${statusFilter}` : ''}`,
    ),
  })

  const { data: msgs } = useQuery({
    queryKey: ['support-msgs', selectedId],
    queryFn: () => fetchApi<SupportMessage[]>(`${config.apiUrl}/support/${selectedId}/messages`),
    enabled: Boolean(selectedId),
  })

  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const sendReply = async () => {
    if (!selectedId || !reply.trim()) return
    setSending(true)
    try {
      await fetchApi(`${config.apiUrl}/support/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: reply }),
      })
      setReply('')
      void qc.invalidateQueries({ queryKey: ['support-msgs', selectedId] })
    } catch {
      notify({ type: 'error', message: 'Failed to send.' })
    } finally {
      setSending(false)
    }
  }

  const conversations = convs?.data ?? []
  const selected = conversations.find(c => c.id === selectedId)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Support</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage customer conversations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6 h-[calc(100vh-12rem)]">
        <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value) }}
              className="w-full text-sm rounded-xl px-3 py-2 bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="">All open</option>
              <option value="new">New</option>
              <option value="open">Open</option>
              <option value="waiting_on_customer">Waiting</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id) }}
                className={[
                  'w-full text-left px-5 py-4 transition-colors',
                  selectedId === c.id
                    ? 'bg-[var(--color-primary)]/8'
                    : 'hover:bg-[var(--color-surface-2)]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--color-text)] truncate">{c.subject ?? 'No subject'}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
                  {new Date(c.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="px-5 py-4 text-sm text-[var(--color-text-muted)]">No conversations.</p>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-[var(--color-text)]">{selected.subject ?? 'No subject'}</h2>
                  <div className="mt-1">
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <CloseButton convId={selected.id} onDone={() => {
                  void qc.invalidateQueries({ queryKey: ['support'] })
                  setSelectedId(null)
                }} />
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {(msgs ?? []).map(m => (
                  <div
                    key={m.id}
                    className={[
                      'flex flex-col',
                      m.sender_role === 'admin' ? 'items-end' : 'items-start',
                    ].join(' ')}
                  >
                    <span className="text-xs text-[var(--color-text-muted)] mb-1">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                    <p
                      className={[
                        'text-sm max-w-[85%] px-4 py-2.5',
                        m.sender_role === 'admin'
                          ? 'bg-[var(--color-primary)] text-white rounded-2xl rounded-tr-sm'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-2xl rounded-tl-sm',
                      ].join(' ')}
                    >
                      {m.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-[var(--color-border)] flex gap-3 items-end">
                <textarea
                  value={reply}
                  onChange={e => { setReply(e.target.value) }}
                  rows={3}
                  placeholder="Write a reply…"
                  className="w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                />
                <Button size="sm" onClick={() => { void sendReply() }} loading={sending}>Send</Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              Select a conversation
            </div>
          )}
        </div>
      </div>

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'warning' | 'neutral' | 'accent'> = {
    new: 'accent', open: 'warning', waiting_on_customer: 'neutral', closed: 'success',
  }
  return <Badge variant={map[status] ?? 'neutral'}>{status.replace(/_/g, ' ')}</Badge>
}

function CloseButton({ convId, onDone }: { convId: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const close = async () => {
    setLoading(true)
    await fetchApi(`${config.apiUrl}/support/${convId}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: 'closed' }),
    })
    setLoading(false)
    onDone()
  }
  return <Button variant="ghost" size="sm" loading={loading} onClick={() => { void close() }}>Close</Button>
}
