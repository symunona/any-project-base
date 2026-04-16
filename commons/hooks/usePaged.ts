import { useQuery } from '@tanstack/react-query'
import type { PagedResponse, PageParams } from '../types/api.types'
import { fetchApi } from '../api/fetchApi'
import { config } from '../config'

export function usePaged<T>(
  endpoint: string,
  params?: PageParams,
) {
  return useQuery<PagedResponse<T>>({
    queryKey: [endpoint, params],
    queryFn: () => {
      const url = new URL(`${config.apiUrl}${endpoint}`)
      if (params?.limit !== undefined) url.searchParams.set('limit', String(params.limit))
      if (params?.offset !== undefined) url.searchParams.set('offset', String(params.offset))
      if (params?.order) url.searchParams.set('order', params.order)
      if (params?.dir) url.searchParams.set('dir', params.dir)
      if (params?.search) url.searchParams.set('search', params.search)
      return fetchApi<PagedResponse<T>>(url.toString())
    },
  })
}
