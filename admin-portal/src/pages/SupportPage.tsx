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
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left: conversation list */}
      <div className="w-80 shrink-0 flex flex-col bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="p-3 border-b border-[var(--color-border)]">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value) }}
            className="w-full text-sm px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
            <option value="">All open</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="waiting_on_customer">Waiting</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(c => (
            <button key={c.id} onClick={() => { setSelectedId(c.id) }}
              className={[
                'w-full text-left px-4 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors',
                selectedId === c.id ? 'bg-[var(--color-surface-2)]' : '',
              ].join(' ')}>
              <p className="text-sm font-medium truncate">{c.subject ?? 'No subject'}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={c.status} />
                <span className="text-xs text-[var(--color-text-muted)]">
                  {new Date(c.updated_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="p-4 text-sm text-[var(--color-text-muted)]">No conversations.</p>
          )}
        </div>
      </div>

      {/* Right: thread */}
      <div className="flex-1 flex flex-col bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        {selected ? (
          <>
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <p className="font-semibold">{selected.subject ?? 'No subject'}</p>
                <StatusBadge status={selected.status} />
              </div>
              <CloseButton convId={selected.id} onDone={() => {
                void qc.invalidateQueries({ queryKey: ['support'] })
                setSelectedId(null)
              }} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {(msgs ?? []).map(m => (
                <div key={m.id} className="text-sm">
                  <span className="text-[var(--color-text-muted)] text-xs">{new Date(m.created_at).toLocaleString()}</span>
                  <p className="mt-1 bg-[var(--color-surface-2)] rounded-lg px-4 py-2 inline-block max-w-[85%]">{m.body}</p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-[var(--color-border)] flex gap-2">
              <textarea value={reply} onChange={e => { setReply(e.target.value) }} rows={2}
                placeholder="Write a reply…"
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              <Button size="sm" onClick={() => { void sendReply() }} loading={sending}>Send</Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
            Select a conversation
          </div>
        )}
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
