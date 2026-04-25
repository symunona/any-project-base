import { select, isCancel, log } from '@clack/prompts'
import { writeYaml } from '../lib/yaml'
import { runScript } from '../lib/run'
import { writeState, type StepResult } from '../lib/state'

export async function run(): Promise<StepResult> {
  const choice = await select({
    message: 'Static hosting provider (landing + portals)',
    options: [
      { value: 'cloudflare', label: 'Cloudflare Pages', hint: 'free unlimited bandwidth, best CDN, own your DNS' },
      { value: 'vercel',     label: 'Vercel',           hint: 'best DX, generous free tier, git push = deploy' },
      { value: 'netlify',    label: 'Netlify',          hint: 'reliable, good free tier' },
    ],
  })
  if (isCancel(choice)) {
    writeState('static', 'skipped', 'user skipped')
    return { status: 'skipped' }
  }

  writeYaml('static_host', String(choice))
  log.step(`Running ${choice} setup...`)

  const script = `setup/static/${choice}/setup.sh`
  const ok = runScript(script)
  if (!ok) {
    writeState('static', 'skipped', 'setup script missing or failed')
    return { status: 'skipped', note: 'setup script missing or failed' }
  }

  writeState('static', 'ok', String(choice))
  return { status: 'ok', note: String(choice) }
}
