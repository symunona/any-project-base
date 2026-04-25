import { hc } from 'hono/client'
import { config } from '../config'
import { fetchApi } from './fetchApi'

// AppType lives in supabase/functions/api/index.ts (Deno runtime).
// To restore full Hono RPC type safety, extract AppType to a shared
// types file that uses npm hono (not Deno URL imports) and import it here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const client = hc<any>(config.apiUrl, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetch: fetchApi as any,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any
