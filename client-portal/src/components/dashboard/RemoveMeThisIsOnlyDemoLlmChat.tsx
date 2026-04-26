// Demo LLM chat — no backend persistence. Remove before shipping real features.
// Calls POST /api/llm/chat. Catches 402 → credits error + billing link.

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { fetchApi, ApiError, Button } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'

type Message = { role: 'user' | 'assistant'; content: string }

export function RemoveMeThisIsOnlyDemoLlmChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const { reply } = await fetchApi<{ reply: string }>(
        `${config.apiUrl}/llm/chat`,
        { method: 'POST', body: JSON.stringify({ message: userMsg }) },
      )
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setError('Out of credits.')
      } else {
        setError('Network error. Retry.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[500px] rounded-2xl overflow-hidden bg-[var(--color-surface)]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)' }}>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text-muted)] mt-8">Ask anything…</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={['flex', m.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}>
            <div className={[
              'max-w-[80%] px-4 py-2 rounded-2xl text-sm',
              m.role === 'user'
                ? 'bg-[var(--color-primary)] text-white rounded-br-sm'
                : 'bg-[var(--color-surface-2)] rounded-bl-sm',
            ].join(' ')}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-surface-2)] px-4 py-2 rounded-2xl rounded-bl-sm text-sm animate-pulse">…</div>
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-[var(--color-danger)]/8 text-sm text-[var(--color-danger)] flex items-center gap-3">
          {error}
          {error.includes('credits') && (
            <button onClick={() => { void navigate('/settings/billing') }} className="underline text-[var(--color-primary)]">
              Upgrade
            </button>
          )}
          <button onClick={() => { setError(null) }} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="p-3 flex gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value) }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
          placeholder="Type a message…"
          disabled={loading}
          className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none disabled:opacity-50"
          style={{ background: 'rgba(0,0,0,0.04)', boxShadow: 'none' }}
        />
        <Button onClick={() => { void send() }} loading={loading} size="sm">Send</Button>
      </div>
    </div>
  )
}
