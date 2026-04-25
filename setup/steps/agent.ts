import { select, isCancel, log } from '@clack/prompts'
import { readYaml, writeYaml } from '../lib/yaml'
import { writeState, type StepResult } from '../lib/state'
import { spawnSync } from 'child_process'

const AGENTS = [
  { value: 'claude',  label: 'Claude Code CLI',    hint: 'Anthropic — recommended' },
  { value: 'codex',   label: 'OpenAI Codex CLI',   hint: '' },
  { value: 'gemini',  label: 'Google Gemini CLI',  hint: '' },
  { value: 'aider',   label: 'Aider',              hint: 'open source, multi-model' },
  { value: 'copilot', label: 'GitHub Copilot CLI', hint: '' },
  { value: 'echo',    label: 'Dry run',            hint: 'prints prompts only, no agent call' },
]

export async function run(): Promise<StepResult> {
  const current = readYaml('agent')
  const choice = await select({
    message: 'AI coding agent for this project',
    options: AGENTS,
    initialValue: current || 'claude',
  })
  if (isCancel(choice)) {
    writeState('agent', 'skipped')
    return { status: 'skipped' }
  }

  writeYaml('agent', String(choice))

  const flags: Record<string, string> = {
    claude:  '--model claude-sonnet-4-6',
    codex:   '',
    gemini:  '',
    aider:   '',
    copilot: '',
    echo:    '',
  }
  const flag = flags[String(choice)] ?? ''
  if (flag) writeYaml('agent_flags', `"${flag}"`)

  log.success(`Agent set to: ${choice}`)
  writeState('agent', 'ok', String(choice))
  return { status: 'ok', note: String(choice) }
}
