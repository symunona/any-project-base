import { useState } from 'react'
import { DataTable } from '@any-project-base/commons'
import { usePaged } from '@any-project-base/commons'
import type { PageParams, UsageRecord } from '@any-project-base/commons'

export function UsagePage() {
  const [params, setParams] = useState<PageParams>({ limit: 20, offset: 0, order: 'created_at', dir: 'desc' })
  const { data, isLoading } = usePaged<UsageRecord>('/usage', params)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Usage</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Track API usage and credit consumption</p>
      </div>
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <DataTable<UsageRecord & Record<string, unknown>>
          data={data}
          loading={isLoading}
          params={params}
          onParamsChange={setParams}
          columns={[
            { key: 'user_id',      label: 'User',     sortable: false },
            { key: 'model',        label: 'Model',    sortable: true },
            { key: 'endpoint',     label: 'Endpoint', sortable: true },
            { key: 'input_tokens', label: 'In tokens', sortable: true },
            { key: 'output_tokens',label: 'Out tokens', sortable: true },
            { key: 'credits_used', label: 'Credits',  sortable: true },
            { key: 'cost_usd',     label: 'Cost $',   sortable: true,
              render: (r) => r.cost_usd != null ? `$${(r.cost_usd as number).toFixed(4)}` : '—' },
            { key: 'created_at',   label: 'When',     sortable: true,
              render: (r) => new Date(r.created_at as string).toLocaleString() },
          ]}
        />
      </div>
    </div>
  )
}
