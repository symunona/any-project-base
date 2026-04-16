import { useEffect, useRef } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import type { PagedResponse } from '../types/api.types'

type InfiniteListProps<T> = {
  data: InfiniteData<PagedResponse<T>> | undefined
  renderItem: (item: T, index: number) => React.ReactNode
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  loading?: boolean
  emptyMessage?: string
}

export function InfiniteList<T>({
  data,
  renderItem,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  loading = false,
  emptyMessage = 'No items',
}: InfiniteListProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const items = data?.pages.flatMap(p => p.data) ?? []

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-[var(--color-border,#e5e7eb)] animate-pulse"/>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="text-center py-8 text-[var(--color-text-muted,#6b7280)]">{emptyMessage}</p>
    )
  }

  return (
    <div>
      {items.map((item, i) => renderItem(item, i))}
      <div ref={sentinelRef} className="py-4 flex justify-center">
        {isFetchingNextPage && (
          <svg className="animate-spin h-5 w-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        {!hasNextPage && items.length > 0 && (
          <span className="text-xs text-[var(--color-text-muted,#6b7280)]">End of list</span>
        )}
      </div>
    </div>
  )
}
