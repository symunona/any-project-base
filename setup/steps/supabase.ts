import { text, password, isCancel, log, note } from '@clack/prompts'
import { setEnv } from '../lib/env'
import { writeState, type StepResult } from '../lib/state'

export async function run(): Promise<StepResult> {
  note('supabase.com → New Project → copy Project URL + keys', 'Supabase Cloud setup')
  log.info('Local dev (Docker) keys are auto-filled by just env-generate. This step is for the cloud project.')

  const url = await text({
    message: 'Supabase Project URL (https://xxx.supabase.co) — Enter to skip',
    placeholder: 'skip for local-only dev',
  })
  if (isCancel(url) || !String(url).startsWith('http')) {
    writeState('supabase', 'skipped', 'local dev only')
    return { status: 'skipped', note: 'local dev only' }
  }

  const anon = await text({ message: 'Supabase anon key (eyJ…)' })
  if (isCancel(anon)) { writeState('supabase', 'skipped'); return { status: 'skipped' } }

  const service = await password({ message: 'Supabase service_role key (keep secret)' })
  if (isCancel(service)) { writeState('supabase', 'skipped'); return { status: 'skipped' } }

  log.step('Validating connection...')
  const res = await fetch(`${String(url)}/rest/v1/`, {
    headers: { apikey: String(anon) },
  })
  if (!res.ok) {
    log.error('Cannot reach Supabase project — check URL and keys')
    writeState('supabase', 'fail', 'connection failed')
    return { status: 'fail', note: 'connection failed' }
  }

  setEnv('SUPABASE_URL', String(url))
  setEnv('VITE_SUPABASE_URL', String(url))
  setEnv('VITE_SUPABASE_ANON_KEY', String(anon))
  setEnv('SUPABASE_SERVICE_ROLE_KEY', String(service))

  writeState('supabase', 'ok', String(url))
  return { status: 'ok', note: String(url) }
}
