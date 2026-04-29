import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../api/fetchApi'
import { config } from '../config'
import type { SystemSettings } from '../types/project.types'

export function useSystemSettings() {
  return useQuery<SystemSettings>({
    queryKey: ['system-settings'],
    queryFn: () => fetchApi<SystemSettings>(`${config.apiUrl}/settings`),
    staleTime: 60_000,
  })
}
