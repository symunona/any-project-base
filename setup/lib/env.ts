import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs'
import { join } from 'path'

const ENV_PATH = join(process.cwd(), '.env.local')

export function getEnv(key: string): string {
  if (!existsSync(ENV_PATH)) return ''
  const m = readFileSync(ENV_PATH, 'utf-8').match(new RegExp(`^${key}=(.+)$`, 'm'))
  return m?.[1] ?? ''
}

export function setEnv(key: string, value: string): void {
  if (!value) return
  if (!existsSync(ENV_PATH)) writeFileSync(ENV_PATH, '')
  const content = readFileSync(ENV_PATH, 'utf-8')
  if (new RegExp(`^${key}=.+`, 'm').test(content)) return
  const cleaned = content.replace(new RegExp(`^${key}=\\s*$`, 'm'), '').replace(/\n{3,}/g, '\n\n')
  writeFileSync(ENV_PATH, cleaned)
  appendFileSync(ENV_PATH, `${key}=${value}\n`)
}

export function ensureEnvFile(): void {
  if (!existsSync(ENV_PATH)) writeFileSync(ENV_PATH, '')
}
