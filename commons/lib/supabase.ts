import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types/db.types'
import { config } from '../config'

// Browser Supabase client (anon key).
// Supabase handles: cookie storage, refresh, expiry.
export const supabase = createBrowserClient<Database>(
  config.supabaseUrl,
  config.supabaseAnonKey,
)
