import { spawnSync } from 'child_process'
import { join } from 'path'

const ROOT = process.cwd()

export function runScript(relPath: string, args: string[] = []): boolean {
  const result = spawnSync('bash', [join(ROOT, relPath), ...args], {
    stdio: 'inherit',
    cwd: ROOT,
  })
  return result.status === 0
}

export function captureScript(relPath: string, args: string[] = []): string {
  const result = spawnSync('bash', [join(ROOT, relPath), ...args], {
    encoding: 'utf-8',
    cwd: ROOT,
  })
  return result.stdout ?? ''
}

export function which(cmd: string): boolean {
  return spawnSync('which', [cmd], { encoding: 'utf-8' }).status === 0
}
