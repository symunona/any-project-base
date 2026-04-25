import { text, password, confirm, isCancel, log, note, spinner } from '@clack/prompts'
import { readYaml, writeYaml } from '../lib/yaml'
import { setEnv } from '../lib/env'
import { runScript, which } from '../lib/run'
import { writeState, type StepResult } from '../lib/state'
import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'

function firebaseCmd(args: string[]): { ok: boolean; out: string } {
  const r = spawnSync('firebase', args, { encoding: 'utf-8' })
  return { ok: r.status === 0, out: r.stdout ?? '' }
}

function parseSdkVal(raw: string, key: string): string {
  const m = raw.match(new RegExp(`${key}['":\\s]+['"]([^'"]+)['"]`))
  return m?.[1] ?? ''
}

export async function run(): Promise<StepResult> {
  const push = readYaml('push_notifications')
  if (push !== 'firebase') {
    log.info("push_notifications is not 'firebase' in project.yaml — skipping.")
    writeState('firebase', 'skipped', 'push_notifications!=firebase')
    return { status: 'skipped', note: 'push_notifications!=firebase' }
  }

  let projectId = ''
  let usedCli = false

  if (which('firebase')) {
    const authed = firebaseCmd(['projects:list']).ok
    if (!authed) {
      note('Run: firebase login\nThen press Enter to continue, or Ctrl+C to skip.', 'Firebase CLI')
      const cont = await confirm({ message: 'Ready after firebase login?' })
      if (isCancel(cont) || !cont) {
        writeState('firebase', 'skipped', 'not logged in')
        return { status: 'skipped' }
      }
    }

    if (firebaseCmd(['projects:list']).ok) {
      const list = firebaseCmd(['projects:list']).out
      log.info('Your Firebase projects:\n' + list.split('\n').slice(0, 15).join('\n'))

      const pid = await text({ message: 'Firebase Project ID' })
      if (isCancel(pid)) { writeState('firebase', 'skipped'); return { status: 'skipped' } }
      projectId = String(pid)

      const s = spinner()
      s.start('Fetching SDK config...')
      const sdkRaw = firebaseCmd(['apps:sdkconfig', 'WEB', '--project', projectId]).out
      s.stop('Done')

      if (sdkRaw) {
        setEnv('VITE_FIREBASE_PROJECT_ID', projectId)
        setEnv('VITE_FIREBASE_AUTH_DOMAIN', `${projectId}.firebaseapp.com`)
        setEnv('VITE_FIREBASE_API_KEY', parseSdkVal(sdkRaw, 'apiKey'))
        setEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', parseSdkVal(sdkRaw, 'messagingSenderId'))
        setEnv('VITE_FIREBASE_APP_ID', parseSdkVal(sdkRaw, 'appId'))
        usedCli = true
        log.success('SDK config auto-filled from Firebase CLI')
      } else {
        log.warn('No web app found — create one in Firebase Console first, then re-run this step')
      }
    }
  }

  // Service account — always manual (CLI can't generate it without gcloud)
  note(
    'Firebase Console → Project Settings → Service accounts\n→ Generate new private key → download JSON',
    'Service account'
  )
  const saPath = await text({ message: 'Path to service account JSON (Enter to skip)' })
  if (!isCancel(saPath) && String(saPath)) {
    const p = String(saPath)
    if (existsSync(p)) {
      setEnv('FIREBASE_SERVICE_ACCOUNT_JSON', p)
      if (!projectId) {
        try {
          const json = JSON.parse(readFileSync(p, 'utf-8')) as { project_id?: string }
          projectId = json.project_id ?? ''
          setEnv('VITE_FIREBASE_PROJECT_ID', projectId)
          setEnv('VITE_FIREBASE_AUTH_DOMAIN', `${projectId}.firebaseapp.com`)
        } catch { /* ignore */ }
      }
    } else {
      log.warn(`File not found: ${p}`)
    }
  }

  if (!usedCli) {
    const apiKey = await text({ message: 'Firebase Web API Key (Project Settings → General → Your apps)' })
    if (!isCancel(apiKey)) setEnv('VITE_FIREBASE_API_KEY', String(apiKey))
  }

  note('Firebase Console → Project Settings → Cloud Messaging → Web Push certificates\n→ Generate key pair → copy the key', 'VAPID key (web push)')
  const vapid = await text({ message: 'VAPID key (Enter to skip)' })
  if (!isCancel(vapid) && String(vapid)) setEnv('VITE_FIREBASE_VAPID_KEY', String(vapid))

  writeYaml('push_notifications', 'firebase')
  writeState('firebase', 'ok', projectId || 'configured')
  return { status: 'ok', note: projectId || 'configured' }
}
