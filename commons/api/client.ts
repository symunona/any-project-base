import { hc } from 'hono/client'
import type { AppType } from '../../supabase/functions/api/index'
import { config } from '../config'
import { fetchApi } from './fetchApi'

// Typed Hono client — all API calls go through here.
// AppType is exported from the edge function and imported here for full type safety.
export const client = hc<AppType>(config.apiUrl, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetch: fetchApi as any,
})
