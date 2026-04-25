import { select, confirm, isCancel, log } from '@clack/prompts'
import { readYaml, writeYaml } from '../lib/yaml'
import { getEnv } from '../lib/env'
import { runScript } from '../lib/run'
import { writeState, type StepResult } from '../lib/state'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

export async function run(): Promise<StepResult> {
  const choice = await select({
    message: 'Pricing model',
    options: [
      { value: 'none',                  label: 'None',                 hint: 'free app, no billing' },
      { value: 'credits',               label: 'Credits',              hint: 'users buy token bundles, atomic deduction per LLM call' },
      { value: 'subscription',          label: 'Subscription',         hint: 'monthly/annual plans via Stripe' },
      { value: 'credits+subscription',  label: 'Credits + Subscription', hint: 'subscription with credit top-ups' },
    ],
  })
  if (isCancel(choice)) {
    writeState('pricing', 'skipped')
    return { status: 'skipped' }
  }

  writeYaml('pricing_model', String(choice))

  if (choice !== 'none') {
    if (!getEnv('STRIPE_SECRET_KEY')) {
      log.error('STRIPE_SECRET_KEY not set — run Stripe step first')
      writeState('pricing', 'fail', 'Stripe not configured')
      return { status: 'fail', note: 'Stripe not configured' }
    }

    const promptsDir = join(process.cwd(), 'setup/pricing/prompts')
    if (existsSync(promptsDir)) {
      const prompts = readdirSync(promptsDir).filter(f => f.endsWith('.md'))
      for (const prompt of prompts) {
        log.step(`Running agent prompt: ${prompt}`)
        runScript('setup/pricing/prompts/' + prompt)
        const ok = await confirm({ message: 'Agent output looks correct — continue?' })
        if (isCancel(ok) || !ok) {
          writeState('pricing', 'fail', 'aborted after agent prompt')
          return { status: 'fail', note: 'aborted' }
        }
      }
    }
  }

  writeState('pricing', 'ok', String(choice))
  return { status: 'ok', note: String(choice) }
}
