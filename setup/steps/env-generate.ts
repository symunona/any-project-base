import { runScript } from '../lib/run'
import { writeState, type StepResult } from '../lib/state'

export async function run(): Promise<StepResult> {
  const ok = runScript('setup/env/env_generate.sh')
  writeState('env_generate', ok ? 'ok' : 'fail')
  return { status: ok ? 'ok' : 'fail' }
}
