import { useInfiniteQuery } from '@tanstack/react-query'
import type { PagedResponse } from '../types/api.types'
import { fetchApi } from '../api/fetchApi'
import { config, PAGE_SIZE } from '../config'
import { PAGE_SIZE as PAGE_SIZE_CONST } from '../constants'

export function useInfinite<T>(
  endpoint: string,
  pageSize: number = PAGE_SIZE_CONST,
) {
  return useInfiniteQuery<PagedResponse<T>>({
    queryKey: [endpoint, { infinite: true, pageSize }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const url = new URL(`${config.apiUrl}${endpoint}`)
      url.searchParams.set('limit', String(pageSize))
      url.searchParams.set('offset', String(pageParam as number))
      return fetchApi<PagedResponse<T>>(url.toString())
    },
    getNextPageParam: (last) =>
      last.hasMore ? last.offset + last.limit : undefined,
  })
}
