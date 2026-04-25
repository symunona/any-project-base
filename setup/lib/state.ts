import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export type StepStatus = 'ok' | 'skipped' | 'fail' | 'unknown'
export interface StepResult { status: StepStatus; note?: string }
type StateFile = Record<string, { status: StepStatus; note: string }>

const STATE_PATH = join(process.cwd(), 'setup/.install-state.json')

function load(): StateFile {
  if (!existsSync(STATE_PATH)) return {}
  try { return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as StateFile } catch { return {} }
}

export function readState(key: string): { status: StepStatus; note: string } {
  return load()[key] ?? { status: 'unknown', note: '' }
}

export function writeState(key: string, status: StepStatus, note = ''): void {
  const state = load()
  state[key] = { status, note }
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

export function hasAnyState(): boolean {
  return existsSync(STATE_PATH)
}
