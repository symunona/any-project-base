import { text, isCancel, log, note } from '@clack/prompts'
import { readYaml, writeYaml } from '../lib/yaml'
import { setEnv } from '../lib/env'
import { writeState, type StepResult } from '../lib/state'

export async function run(): Promise<StepResult> {
  const analytics = readYaml('analytics')
  if (analytics !== 'posthog') {
    log.info("analytics is not 'posthog' in project.yaml — skipping. Set 'analytics: posthog' to enable.")
    writeState('posthog', 'skipped', 'analytics!=posthog')
    return { status: 'skipped', note: 'analytics!=posthog' }
  }

  note('app.posthog.com → Settings → Project API Key', 'PostHog setup')

  const key = await text({ message: 'PostHog API key (phc_…)' })
  if (isCancel(key)) { writeState('posthog', 'skipped'); return { status: 'skipped' } }

  log.step('Validating PostHog key...')
  const res = await fetch('https://app.posthog.com/api/projects/', {
    headers: { Authorization: `Bearer ${String(key)}` },
  })
  if (!res.ok) {
    log.error('PostHog rejected the key')
    writeState('posthog', 'fail', 'invalid key')
    return { status: 'fail', note: 'invalid key' }
  }

  const host = await text({
    message: 'PostHog host',
    initialValue: 'https://app.posthog.com',
  })
  if (isCancel(host)) { writeState('posthog', 'skipped'); return { status: 'skipped' } }

  setEnv('VITE_POSTHOG_KEY', String(key))
  setEnv('VITE_POSTHOG_HOST', String(host))
  writeYaml('analytics', 'posthog')

  writeState('posthog', 'ok')
  return { status: 'ok' }
}
