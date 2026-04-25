import { text, confirm, isCancel } from '@clack/prompts'
import { readYaml, writeYaml } from '../lib/yaml'
import { writeState, type StepResult } from '../lib/state'

export async function run(): Promise<StepResult> {
  const name = await text({
    message: 'Project slug (e.g. my-saas)',
    initialValue: readYaml('name') || '',
    validate: v => v.length < 2 ? 'Required' : undefined,
  })
  if (isCancel(name)) { writeState('project', 'skipped'); return { status: 'skipped' } }

  const domain = await text({
    message: 'Domain (e.g. my-saas.com)',
    initialValue: readYaml('domain') || '',
  })
  if (isCancel(domain)) { writeState('project', 'skipped'); return { status: 'skipped' } }

  const tagline = await text({
    message: 'Tagline (one sentence)',
    initialValue: readYaml('tagline') || '',
  })
  if (isCancel(tagline)) { writeState('project', 'skipped'); return { status: 'skipped' } }

  const locale = await text({
    message: 'Default locale',
    initialValue: readYaml('default_locale') || 'en',
  })
  if (isCancel(locale)) { writeState('project', 'skipped'); return { status: 'skipped' } }

  const locales = await text({
    message: 'Supported locales (comma-separated)',
    initialValue: readYaml('supported_locales') || String(locale),
  })
  if (isCancel(locales)) { writeState('project', 'skipped'); return { status: 'skipped' } }

  const gitUrl = await text({
    message: 'Git URL (optional)',
    initialValue: readYaml('git_url') || '',
  })
  if (isCancel(gitUrl)) { writeState('project', 'skipped'); return { status: 'skipped' } }

  writeYaml('name', String(name))
  writeYaml('domain', String(domain))
  writeYaml('tagline', `"${String(tagline)}"`)
  writeYaml('default_locale', String(locale))
  writeYaml('supported_locales', `[${String(locales)}]`)
  if (gitUrl) writeYaml('git_url', String(gitUrl))

  writeState('project', 'ok', String(name))
  return { status: 'ok', note: String(name) }
}
