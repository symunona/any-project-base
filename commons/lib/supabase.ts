import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types/db.types'
import { config } from '../config'

// Browser Supabase client (anon key).
// Supabase handles: cookie storage, refresh, expiry.
export const supabase = createBrowserClient<Database>(
  config.supabaseUrl,
  config.supabaseAnonKey,
  { auth: { flowType: 'implicit' } },
)

/**
 * Fetch a PostgREST row with an explicit access token injected as Bearer.
 *
 * Use this ONLY in contexts where calling supabase.from() would re-enter the
 * GoTrueClient lock and deadlock — specifically inside onAuthStateChange
 * callbacks where the lock is already held by the initialisation task.
 *
 * The fetch_check exempts supabase.ts from the raw-fetch rule.
 */
export async function fetchWithToken<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string>,
): Promise<T | null> {
  const url = new URL(`${config.supabaseUrl}/rest/v1/${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString(), {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return null
  const rows = await res.json() as T[]
  return rows[0] ?? null
}
