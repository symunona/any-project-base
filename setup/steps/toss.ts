import { password, text, note, isCancel, log } from '@clack/prompts'
import { readYaml } from '../lib/yaml'
import { setEnv } from '../lib/env'
import { writeState, type StepResult } from '../lib/state'
import { getTossWebhookUrl, warnIfNoPublicUrl } from '../lib/project_url'

export async function run(): Promise<StepResult> {
  const pricing = readYaml('pricing_model')
  if (!pricing || pricing === 'none') {
    log.info("pricing_model is 'none' — Toss not needed. Set pricing_model in project.yaml to enable.")
    writeState('toss', 'skipped', 'pricing_model=none')
    return { status: 'skipped', note: 'pricing_model=none' }
  }

  note('Toss Dashboard → 내 개발정보 → API 키\nhttps://developers.tosspayments.com', 'Toss Payments setup')

  const secret = await password({ message: 'Toss Secret key (test_sk_… or live_sk_…)' })
  if (isCancel(secret)) { writeState('toss', 'skipped'); return { status: 'skipped' } }

  if (!/^(test_sk_|live_sk_)/.test(String(secret))) {
    log.error('Key must start with test_sk_ or live_sk_')
    writeState('toss', 'fail', 'invalid key format')
    return { status: 'fail', note: 'invalid key format' }
  }

  log.step('Validating with Toss API...')
  const encoded = Buffer.from(String(secret) + ':').toString('base64')
  const res = await fetch('https://api.tosspayments.com/v1/transactions', {
    headers: { Authorization: `Basic ${encoded}` },
  })
  if (res.status === 401) {
    log.error('Toss rejected the key')
    writeState('toss', 'fail', 'API rejected key')
    return { status: 'fail', note: 'API rejected key' }
  }

  const client = await text({ message: 'Toss Client key (test_ck_… or live_ck_…)' })
  if (isCancel(client)) { writeState('toss', 'skipped'); return { status: 'skipped' } }

  warnIfNoPublicUrl()
  note(
    `Toss Dashboard → 웹훅 → 웹훅 URL 등록\n` +
    `Endpoint: ${getTossWebhookUrl()}\n` +
    `Auth: Basic auth using your secret key (no separate webhook secret)`,
    'Webhook',
  )

  const webhookNote = await text({ message: 'Webhook URL registered? (press Enter to continue)' })
  if (isCancel(webhookNote)) { writeState('toss', 'skipped'); return { status: 'skipped' } }

  setEnv('TOSS_SECRET_KEY', String(secret))
  if (client) {
    setEnv('TOSS_CLIENT_KEY', String(client))
    setEnv('VITE_TOSS_CLIENT_KEY', String(client))
  }

  writeState('toss', 'ok')
  return { status: 'ok' }
}
