import { useState } from 'react'
import { useNavigate } from 'react-router'
import { DataTable, usePaged, Badge, Card, PageHeader, Button, Modal, Input, fetchApi, useNotification, NotificationContainer } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { PageParams, User } from '@any-project-base/commons'

export function UsersPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState<PageParams>({ limit: 20, offset: 0, order: 'created_at', dir: 'desc' })
  const { data, isLoading } = usePaged<User>('/users', params)
  const [inviteOpen, setInviteOpen] = useState(false)
  const { notifications, notify, dismiss } = useNotification()

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage registered users"
        actions={
          <Button size="sm" onClick={() => { setInviteOpen(true) }}>Invite user</Button>
        }
      />
      <Card>
        <DataTable<User & Record<string, unknown>>
          data={data}
          loading={isLoading}
          params={params}
          onParamsChange={setParams}
          searchable
          onRowClick={(u) => { void navigate(`/users/${u.id as string}`) }}
          columns={[
            { key: 'name',       label: 'Name',     sortable: true },
            { key: 'email',      label: 'Email',    sortable: true },
            { key: 'role',       label: 'Role',     sortable: true,
              render: (u) => (
                <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'support' ? 'warning' : 'neutral'}>
                  {u.role as string}
                </Badge>
              ),
            },
            { key: 'created_at', label: 'Joined',   sortable: true,
              render: (u) => new Date(u.created_at as string).toLocaleDateString(),
            },
          ]}
        />
      </Card>

      <InviteModal
        open={inviteOpen}
        onClose={() => { setInviteOpen(false) }}
        onNotify={notify}
      />
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

function InviteModal({
  open,
  onClose,
  onNotify,
}: {
  open: boolean
  onClose: () => void
  onNotify: (n: { type: 'success' | 'error'; message: string }) => void
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    setLoading(true)
    try {
      await fetchApi(`${config.apiUrl}/users/invite`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      onNotify({ type: 'success', message: `Invite sent to ${email}.` })
      setEmail('')
      onClose()
    } catch {
      onNotify({ type: 'error', message: 'Failed to send invite.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { setEmail(''); onClose() }}
      title="Invite user"
      footer={
        <Button
          disabled={!email.includes('@')}
          loading={loading}
          onClick={() => { void send() }}
        >
          Send invite
        </Button>
      }
    >
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        An invitation email will be sent to the address below. The user can set their password via the link.
      </p>
      <Input
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value) }}
        placeholder="user@example.com"
        onKeyDown={e => { if (e.key === 'Enter' && email.includes('@')) void send() }}
        autoFocus
      />
    </Modal>
  )
}
