import { runScript } from '../lib/run'
import { writeState, type StepResult } from '../lib/state'

export async function run(): Promise<StepResult> {
  const ok = runScript('setup/dev/tooling_setup.sh')
  writeState('tooling', ok ? 'ok' : 'fail')
  return { status: ok ? 'ok' : 'fail' }
}
