import { confirm, isCancel, log, note } from '@clack/prompts'
import { readYaml } from '../lib/yaml'
import { writeState, type StepResult } from '../lib/state'

export async function run(): Promise<StepResult> {
  const domain = readYaml('domain')
  if (!domain) {
    log.warn('No domain set in project.yaml — run project step first')
    writeState('dns', 'skipped', 'no domain')
    return { status: 'skipped', note: 'no domain' }
  }

  note(
    `Add these records at your registrar:\n\n` +
    `  ${domain}         A/CNAME  → your hosting IP or CNAME\n` +
    `  app.${domain}    CNAME    → client-portal URL\n` +
    `  admin.${domain}  CNAME    → admin-portal URL\n` +
    `  api.${domain}    CNAME    → Supabase project URL\n\n` +
    `DNS propagation can take up to 48h.\n` +
    `Check: dig +short ${domain}`,
    'DNS records to add'
  )

  const done = await confirm({ message: 'Mark DNS as configured?' })
  if (isCancel(done) || !done) {
    writeState('dns', 'skipped', 'deferred')
    return { status: 'skipped', note: 'deferred' }
  }

  writeState('dns', 'ok', domain)
  return { status: 'ok', note: domain }
}
