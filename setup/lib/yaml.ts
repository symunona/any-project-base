import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const YAML_PATH = join(process.cwd(), 'project.yaml')

export function readYaml(key: string): string {
  if (!existsSync(YAML_PATH)) return ''
  const content = readFileSync(YAML_PATH, 'utf-8')
  const m = content.match(new RegExp(`^${key}:[\\s]*([^#\\n]*)`, 'm'))
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : ''
}

export function writeYaml(key: string, value: string): void {
  let content = existsSync(YAML_PATH) ? readFileSync(YAML_PATH, 'utf-8') : ''
  const line = `${key}: ${value}`
  if (new RegExp(`^${key}:`, 'm').test(content)) {
    content = content.replace(new RegExp(`^${key}:.*`, 'm'), line)
  } else {
    content += `\n${line}`
  }
  writeFileSync(YAML_PATH, content)
}

export function readYamlList(key: string): string[] {
  if (!existsSync(YAML_PATH)) return []
  const content = readFileSync(YAML_PATH, 'utf-8')
  const inline = content.match(new RegExp(`^${key}:\\s*\\[([^\\]]+)\\]`, 'm'))
  if (inline?.[1]) return inline[1].split(',').map(s => s.trim().replace(/['"]/g, ''))
  const items = [...content.matchAll(/^\s+-\s+(.+)$/gm)]
  return items.map(m => m[1]?.trim() ?? '')
}
