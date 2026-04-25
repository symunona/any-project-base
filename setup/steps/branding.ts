import { runScript } from '../lib/run'
import { writeState, type StepResult } from '../lib/state'

export async function run(): Promise<StepResult> {
  const ok = runScript('setup/branding/branding.sh')
  writeState('branding', ok ? 'ok' : 'skipped')
  return { status: ok ? 'ok' : 'skipped' }
}
