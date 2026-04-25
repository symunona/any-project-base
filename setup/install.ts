#!/usr/bin/env tsx
import {
  intro, outro, select, confirm, isCancel, cancel,
  log, note, spinner,
} from '@clack/prompts'
import { readState, writeState, hasAnyState, type StepStatus } from './lib/state'
import { readYaml } from './lib/yaml'

import * as agent       from './steps/agent'
import * as project     from './steps/project'
import * as envGenerate from './steps/env-generate'
import * as tooling     from './steps/tooling'
import * as supabase    from './steps/supabase'
import * as stripe      from './steps/stripe'
import * as firebase    from './steps/firebase'
import * as posthog     from './steps/posthog'
import * as dns         from './steps/dns'
import * as staticHost  from './steps/static'
import * as pricing     from './steps/pricing'
import * as mobile      from './steps/mobile'
import * as branding    from './steps/branding'

interface StepDef {
  key: string
  name: string
  run: () => Promise<{ status: StepStatus; note?: string }>
  skippable: boolean
  condition?: () => boolean
}

const STEPS: StepDef[] = [
  { key: 'agent',        name: 'Agent selector',      run: agent.run,       skippable: false },
  { key: 'project',      name: 'Project identity',    run: project.run,     skippable: false },
  { key: 'tooling',      name: 'Dev tooling check',   run: tooling.run,     skippable: false },
  { key: 'env_generate', name: 'Auto-fill env vars',  run: envGenerate.run, skippable: false },
  { key: 'branding',     name: 'Branding',            run: branding.run,    skippable: true },
  { key: 'dns',          name: 'DNS config',           run: dns.run,         skippable: true },
  { key: 'static',       name: 'Static hosting',      run: staticHost.run,  skippable: true },
  { key: 'supabase',     name: 'Supabase cloud',      run: supabase.run,    skippable: true },
  { key: 'stripe',       name: 'Stripe billing',      run: stripe.run,      skippable: true,
    condition: () => readYaml('pricing_model') !== 'none' },
  { key: 'firebase',     name: 'Firebase / FCM',      run: firebase.run,    skippable: true,
    condition: () => readYaml('push_notifications') === 'firebase' },
  { key: 'posthog',      name: 'PostHog analytics',   run: posthog.run,     skippable: true,
    condition: () => readYaml('analytics') === 'posthog' },
  { key: 'mobile',       name: 'Mobile / Expo',       run: mobile.run,      skippable: true },
  { key: 'pricing',      name: 'Pricing model',       run: pricing.run,     skippable: false },
]

function statusIcon(s: StepStatus): string {
  return s === 'ok' ? '✓' : s === 'skipped' ? '↷' : s === 'fail' ? '✗' : ' '
}

async function runStep(step: StepDef): Promise<void> {
  log.step(step.name)
  const result = await step.run()
  if (result.status === 'ok')      log.success(`${step.name} — done`)
  else if (result.status === 'skipped') log.warn(`${step.name} — skipped`)
  else                             log.error(`${step.name} — failed: ${result.note ?? ''}`)
}

// ── First run: sequential ─────────────────────────────────────────────────────
async function firstRun(): Promise<void> {
  intro('ANY PROJECT BASE — SETUP')
  note('First-time setup. Press Ctrl+C at any prompt to skip a step.', 'Info')

  for (const step of STEPS) {
    const { condition, skippable } = step

    if (condition && !condition()) {
      log.info(`Skipping ${step.name} (not enabled in project.yaml)`)
      writeState(step.key, 'skipped', 'not enabled')
      continue
    }

    if (skippable) {
      const go = await confirm({ message: `Run: ${step.name}?` })
      if (isCancel(go) || !go) {
        writeState(step.key, 'skipped', 'user skipped')
        log.warn(`${step.name} — skipped`)
        continue
      }
    }

    await runStep(step)
  }

  outro('Setup complete! Run `just status` to review. Run `just start` to start dev servers.')
}

// ── Re-run: pick-a-step menu ──────────────────────────────────────────────────
async function rerunMenu(): Promise<void> {
  intro('ANY PROJECT BASE — SETUP MENU')

  while (true) {
    const options = [
      ...STEPS.map(step => {
        const { status, note: n } = readState(step.key)
        const icon = statusIcon(status)
        return {
          value: step.key,
          label: `${icon}  ${step.name}`,
          hint: n || undefined,
        }
      }),
      { value: '__exit', label: '   Exit', hint: undefined },
    ]

    const choice = await select({ message: 'Which step to run?', options })
    if (isCancel(choice) || choice === '__exit') break

    const step = STEPS.find(s => s.key === choice)
    if (step) await runStep(step)
  }

  outro('Done.')
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  if (hasAnyState()) {
    await rerunMenu()
  } else {
    await firstRun()
  }
}

main().catch(err => {
  cancel('Setup aborted')
  process.exit(1)
})
