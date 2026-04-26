import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '../api/fetchApi'
import { config } from '../config'

export function useCredits() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ balance: number }>({
    queryKey: ['credits'],
    queryFn: () => fetchApi<{ balance: number }>(`${config.apiUrl}/users/me/credits`),
  })

  const purchase = async (credits: number) => {
    const result = await fetchApi<{ ok: boolean; balance: number; added: number }>(
      `${config.apiUrl}/users/me/credits/purchase`,
      { method: 'POST', body: JSON.stringify({ credits }) },
    )
    await qc.invalidateQueries({ queryKey: ['credits'] })
    return result
  }

  return { balance: data?.balance ?? 0, loading: isLoading, purchase }
}
