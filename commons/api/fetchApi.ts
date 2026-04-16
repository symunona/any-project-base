// NEVER use fetch() directly anywhere in the codebase — use this.
// ESLint rule `no-restricted-globals: fetch` enforces this.

import { ApiError } from '../types/api.types'

export async function fetchApi<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json() as { error?: string; message?: string }
      message = body.error ?? body.message ?? message
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export { ApiError }
