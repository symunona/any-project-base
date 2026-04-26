import { createClient } from 'npm:@supabase/supabase-js@2'

let _adminClient: ReturnType<typeof createClient> | null = null

// Admin client (service role key — bypasses RLS).
// Only for use in edge functions. Never expose service role key to frontend.
export function getAdminClient() {
  if (!_adminClient) {
    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
    _adminClient = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return _adminClient
}
