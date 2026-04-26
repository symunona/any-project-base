import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { PagedResponse, PageParams } from '../types/api.types'
import { useDebounce } from '../hooks/useDebounce'
import { PAGE_SIZE, MAX_PAGE_SIZE } from '../constants'

type Column<T> = {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

type DataTableProps<T> = {
  data: PagedResponse<T> | undefined
  columns: Column<T>[]
  params: PageParams
  onParamsChange: (p: PageParams) => void
  loading?: boolean
  searchable?: boolean
}

const PAGE_SIZES = [10, 20, 50, 100] as const

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  params,
  onParamsChange,
  loading = false,
  searchable = false,
}: DataTableProps<T>) {
  const [searchInput, setSearchInput] = useState(params.search ?? '')
  const debouncedSearch = useDebounce(searchInput)

  const limit = params.limit ?? PAGE_SIZE
  const offset = params.offset ?? 0
  const total = data?.total ?? 0
  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  const setSort = (key: string) => {
    if (params.order === key) {
      onParamsChange({ ...params, dir: params.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      onParamsChange({ ...params, order: key, dir: 'desc', offset: 0 })
    }
  }

  const setPage = (p: number) => {
    onParamsChange({ ...params, offset: (p - 1) * limit })
  }

  const rows = data?.data ?? []

  return (
    <div className="w-full">
      {searchable && (
        <div className="mb-4 flex gap-3 items-center">
          <input
            type="search"
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value)
              onParamsChange({ ...params, search: debouncedSearch, offset: 0 })
            }}
            placeholder="Search..."
            className="flex-1 px-3 py-2 rounded-md border border-[var(--color-border)]
                       bg-[var(--color-surface)] text-sm focus:outline-none
                       focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <select
            value={limit}
            onChange={e => { onParamsChange({ ...params, limit: Number(e.target.value), offset: 0 }) }}
            className="px-3 py-2 rounded-md border border-[var(--color-border)] text-sm
                       bg-[var(--color-surface)] focus:outline-none"
          >
            {PAGE_SIZES.map(s => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-2)]">
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  onClick={() => { if (col.sortable) setSort(String(col.key)) }}
                  className={[
                    'px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]',
                    col.sortable ? 'cursor-pointer select-none hover:text-[var(--color-text)]' : '',
                  ].join(' ')}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && params.order === String(col.key) && (
                      params.dir === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-[var(--color-border)]">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-[var(--color-border)] animate-pulse"/>
                    </td>
                  ))}
                </tr>
              ))
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No results
                </td>
              </tr>
            )}
            {!loading && rows.map((row, i) => (
              <tr key={i} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
                {columns.map(col => (
                  <td key={String(col.key)} className="px-4 py-3">
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <span>Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => { setPage(page - 1) }}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded border border-[var(--color-border)]
                         disabled:opacity-40 hover:bg-[var(--color-surface-2)]"
            >
              Prev
            </button>
            <button
              onClick={() => { setPage(page + 1) }}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded border border-[var(--color-border)]
                         disabled:opacity-40 hover:bg-[var(--color-surface-2)]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
