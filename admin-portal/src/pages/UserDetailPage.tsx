import { useState } from 'react'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchApi, Badge, Button, Modal, useNotification, NotificationContainer, Card, CardHeader, CardBody, PageHeader, Input } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { User, CreditAdjustment } from '@any-project-base/commons'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { notifications, notify, dismiss } = useNotification()

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => fetchApi<User>(`${config.apiUrl}/users/${id}`),
    enabled: Boolean(id),
  })

  if (isLoading) return <div>Loading…</div>
  if (!user) return <div>User not found.</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title={user.name ?? user.email} subtitle="User detail" />

      <Card>
        <CardHeader>Profile</CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <dt className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Email</dt>
              <dd className="text-sm font-medium text-[var(--color-text)]">{user.email}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Role</dt>
              <dd className="text-sm font-medium text-[var(--color-text)]">
                <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'support' ? 'warning' : 'neutral'}>{user.role}</Badge>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Joined</dt>
              <dd className="text-sm font-medium text-[var(--color-text)]">{new Date(user.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Credits</CardHeader>
        <CardBody>
          <CreditsPanel userId={user.id} onNotify={notify} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Login Links</CardHeader>
        <CardBody>
          <MagicLinkPanel userId={user.id} onNotify={notify} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Devices</CardHeader>
        <CardBody>
          <DeviceList userId={user.id} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Usage</CardHeader>
        <CardBody>
          <p className="text-sm text-[var(--color-text-muted)]">Usage stats load here. See /usage?user_id={user.id}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Danger Zone</CardHeader>
        <CardBody>
          <DeleteUser user={user} onNotify={notify} />
        </CardBody>
      </Card>

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

function CreditsPanel({ userId, onNotify }: { userId: string; onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const [delta, setDelta] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const { data, refetch } = useQuery<{ balance: number }>({
    queryKey: ['credits', userId],
    queryFn: () => fetchApi<{ balance: number }>(`${config.apiUrl}/users/${userId}/credits`),
  })

  const adjustHistoryQuery = useQuery<{ data: CreditAdjustment[] }>({
    queryKey: ['credit-adjustments', userId],
    queryFn: () => fetchApi<{ data: CreditAdjustment[] }>(`${config.apiUrl}/users/${userId}/credits/adjustments`),
  })

  const adjust = async (amount: number) => {
    setLoading(true)
    try {
      await fetchApi(`${config.apiUrl}/users/${userId}/credits`, {
        method: 'POST',
        body: JSON.stringify({ delta: amount, note: note.trim() || undefined }),
      })
      await refetch()
      await adjustHistoryQuery.refetch()
      setDelta('')
      setNote('')
      onNotify({ type: 'success', message: `${amount > 0 ? '+' : ''}${amount} credits applied.` })
    } catch {
      onNotify({ type: 'error', message: 'Failed to adjust credits.' })
    } finally {
      setLoading(false)
    }
  }

  const parsed = parseInt(delta, 10)
  const validDelta = !isNaN(parsed) && parsed !== 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Balance</p>
          <p className="text-3xl font-semibold text-[var(--color-text)]">{data?.balance ?? '—'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[100, 500, 1000].map(n => (
            <Button key={n} variant="secondary" size="sm" loading={loading} onClick={() => { void adjust(n) }}>
              +{n}
            </Button>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <Input
              type="number"
              value={delta}
              onChange={e => { setDelta(e.target.value) }}
              placeholder="Custom…"
              className="w-28"
            />
            <Button size="sm" disabled={!validDelta} loading={loading} onClick={() => { void adjust(parsed) }}>
              Apply
            </Button>
          </div>
        </div>
      </div>
      <Input
        type="text"
        value={note}
        onChange={e => { setNote(e.target.value) }}
        placeholder="Note (optional, saved with adjustment)"
        className="max-w-sm"
      />
      <CreditAdjustmentHistory adjustments={adjustHistoryQuery.data?.data} />
    </div>
  )
}

function CreditAdjustmentHistory({ adjustments }: { adjustments: CreditAdjustment[] | undefined }) {
  if (!adjustments?.length) return (
    <p className="text-sm text-[var(--color-text-muted)] mt-2">No adjustment history yet.</p>
  )
  return (
    <table className="w-full text-sm mt-2">
      <thead>
        <tr className="text-left border-b border-[var(--color-border)]">
          <th className="pb-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Date</th>
          <th className="pb-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Delta</th>
          <th className="pb-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Source</th>
          <th className="pb-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Note</th>
        </tr>
      </thead>
      <tbody>
        {adjustments.map(a => (
          <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0">
            <td className="py-2 text-[var(--color-text-muted)]">{new Date(a.created_at).toLocaleString()}</td>
            <td className={`py-2 font-mono font-semibold ${a.delta > 0 ? 'text-green-600' : 'text-[var(--color-danger)]'}`}>
              {a.delta > 0 ? '+' : ''}{a.delta}
            </td>
            <td className="py-2 text-[var(--color-text-muted)] capitalize">{a.source}</td>
            <td className="py-2 text-[var(--color-text-muted)]">{a.note ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function MagicLinkPanel({ userId, onNotify }: { userId: string; onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const [generating, setGenerating] = useState(false)
  const [resetting, setResetting] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const { url } = await fetchApi<{ url: string }>(`${config.apiUrl}/magic-links`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      })
      await navigator.clipboard.writeText(url)
      onNotify({ type: 'success', message: 'Link copied to clipboard.' })
    } catch {
      onNotify({ type: 'error', message: 'Failed to generate link.' })
    } finally {
      setGenerating(false)
    }
  }

  const sendReset = async () => {
    setResetting(true)
    try {
      await fetchApi(`${config.apiUrl}/users/${userId}/reset-password`, { method: 'POST' })
      onNotify({ type: 'success', message: 'Password reset email sent.' })
    } catch {
      onNotify({ type: 'error', message: 'Failed to send reset email.' })
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button size="sm" onClick={() => { void generate() }} loading={generating}>
        Generate login link
      </Button>
      <Button size="sm" variant="secondary" onClick={() => { void sendReset() }} loading={resetting}>
        Send reset password link
      </Button>
    </div>
  )
}

function DeviceList({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['devices', userId],
    queryFn: () => fetchApi<{ data: Array<{ id: string; platform: string; last_seen: string; created_at: string }> }>(
      `${config.apiUrl}/users/${userId}/devices`,
    ),
  })
  if (!data?.data?.length) return <p className="text-sm text-[var(--color-text-muted)]">No devices registered.</p>
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left">
          <th className="pb-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Platform</th>
          <th className="pb-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Last seen</th>
          <th className="pb-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">First seen</th>
        </tr>
      </thead>
      <tbody>
        {data.data.map(d => (
          <tr key={d.id} className="hover:bg-[var(--color-surface-2)] transition-colors border-b border-transparent last:border-0">
            <td className="px-6 py-3 text-sm text-[var(--color-text)] capitalize">{d.platform}</td>
            <td className="px-6 py-3 text-sm text-[var(--color-text)]">{new Date(d.last_seen).toLocaleString()}</td>
            <td className="px-6 py-3 text-sm text-[var(--color-text)]">{new Date(d.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DeleteUser({ user, onNotify }: { user: User; onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const doDelete = async () => {
    setLoading(true)
    try {
      await fetchApi(`${config.apiUrl}/users/${user.id}`, { method: 'DELETE' })
      onNotify({ type: 'success', message: 'User deleted.' })
      setOpen(false)
    } catch {
      onNotify({ type: 'error', message: 'Delete failed.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => { setOpen(true) }}>Delete user</Button>
      <Modal open={open} onClose={() => { setOpen(false); setConfirm('') }} title="Delete user"
        footer={
          <Button variant="danger" disabled={confirm !== (user.name ?? user.email)} loading={loading}
            onClick={() => { void doDelete() }}>
            Permanently delete
          </Button>
        }>
        <p className="text-sm mb-4">
          Type <strong>{user.name ?? user.email}</strong> to confirm deletion. This cannot be undone.
        </p>
        <Input value={confirm} onChange={e => { setConfirm(e.target.value) }} error />
      </Modal>
    </>
  )
}
