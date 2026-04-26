import { useState } from 'react'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchApi, Badge, Button, Modal, useNotification, NotificationContainer } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { User } from '@any-project-base/commons'

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{user.name ?? user.email}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">User detail</p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">Profile</h2>
        </div>
        <div className="p-6">
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
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">Login Links</h2>
        </div>
        <div className="p-6">
          <MagicLinkPanel userId={user.id} onNotify={notify} />
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">Devices</h2>
        </div>
        <div className="p-6">
          <DeviceList userId={user.id} />
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">Usage</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-[var(--color-text-muted)]">Usage stats load here. See /usage?user_id={user.id}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">Danger Zone</h2>
        </div>
        <div className="p-6">
          <DeleteUser user={user} onNotify={notify} />
        </div>
      </div>

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

function MagicLinkPanel({ userId, onNotify }: { userId: string; onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const [generating, setGenerating] = useState(false)

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

  return (
    <Button size="sm" onClick={() => { void generate() }} loading={generating}>
      Generate login link
    </Button>
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
          <tr key={d.id} className="hover:bg-[var(--color-surface-2)] transition-colors border-b border-[var(--color-border)] last:border-0">
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
        <input value={confirm} onChange={e => { setConfirm(e.target.value) }}
          className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)]" />
      </Modal>
    </>
  )
}
