# Paging Architecture

All list endpoints — REST and Supabase queries — use identical paging contract. No exceptions. Agent has no freedom to invent custom paging params.

## Query Parameters

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `limit` | integer | 20 | max 100 |
| `offset` | integer | 0 | |
| `order` | string | `created_at` | column name |
| `dir` | `asc` \| `desc` | `desc` | |
| `search` | string | — | optional, full-text where supported |

## Response Envelope

```typescript
type PagedResponse<T> = {
  data: T[]
  total: number      // total matching rows (for pagination UI)
  limit: number      // echoed back
  offset: number     // echoed back
  hasMore: boolean   // offset + limit < total
}
```

## Edge Function Pattern (Hono + Zod)

```typescript
const PageQuerySchema = z.object({
  limit:  z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  order:  z.string().default('created_at'),
  dir:    z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
})

app.get('/users', zValidator('query', PageQuerySchema), async (c) => {
  const { limit, offset, order, dir, search } = c.req.valid('query')

  let query = supabase.from('users').select('*', { count: 'exact' })
  if (search) query = query.ilike('name', `%${search}%`)
  query = query.order(order, { ascending: dir === 'asc' })
               .range(offset, offset + limit - 1)

  const { data, count, error } = await query
  return c.json({ data, total: count, limit, offset, hasMore: offset + limit < count })
})
```

## Frontend: usePaged Hook

```typescript
// commons/hooks/usePaged.ts
function usePaged<T>(endpoint: string, params?: PageParams) {
  return useQuery({
    queryKey: [endpoint, params],
    queryFn: () => client[endpoint].$get({ query: params })
  })
}
```

## Frontend: Infinite Scroll Hook

```typescript
// commons/hooks/useInfinite.ts
function useInfinite<T>(endpoint: string, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: [endpoint],
    queryFn: ({ pageParam = 0 }) =>
      client[endpoint].$get({ query: { limit: pageSize, offset: pageParam } }),
    getNextPageParam: (last) => last.hasMore ? last.offset + last.limit : undefined
  })
}
```

## Frontend: DataTable Component

`commons/components/DataTable.tsx` — generic, accepts columns + paged response. Handles:
- Sort by column header click (toggles `dir`)
- Page size selector (10 / 20 / 50 / 100)
- Prev/Next pagination
- Search input (debounced 300ms)
- Loading skeleton
- Empty state

## Frontend: InfiniteList Component

`commons/components/InfiniteList.tsx` — generic infinite scroll. Handles:
- Intersection Observer for load trigger
- Loading spinner at bottom
- End-of-list message

## Checker

`setup/checks/paging_check.sh`:
- All edge function routes returning arrays must use `PagedResponse<T>` envelope
- No raw `supabase.from(...).select()` without `.range()` in edge functions
- Grep for direct array responses without `total` field → fail
