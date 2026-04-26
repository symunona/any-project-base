import { useState } from 'react'
import { useNavigate } from 'react-router'
import { DataTable } from '@any-project-base/commons'
import { usePaged } from '@any-project-base/commons'
import type { PageParams } from '@any-project-base/commons'
import type { User } from '@any-project-base/commons'
import { Badge } from '@any-project-base/commons'

export function UsersPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState<PageParams>({ limit: 20, offset: 0, order: 'created_at', dir: 'desc' })
  const { data, isLoading } = usePaged<User>('/users', params)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Users</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage registered users</p>
      </div>
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <DataTable<User & Record<string, unknown>>
          data={data}
          loading={isLoading}
          params={params}
          onParamsChange={setParams}
          searchable
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
            { key: 'actions', label: '',
              render: (u) => (
                <button onClick={() => { void navigate(`/users/${u.id as string}`) }}
                  className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-colors">
                  View →
                </button>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
