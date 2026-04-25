import { confirm, text, isCancel, log } from '@clack/prompts'
import { writeYaml } from '../lib/yaml'
import { setEnv } from '../lib/env'
import { which, runScript } from '../lib/run'
import { writeState, type StepResult } from '../lib/state'
import { spawnSync } from 'child_process'

export async function run(): Promise<StepResult> {
  const go = await confirm({ message: 'Set up mobile dev environment (Expo / React Native)?' })
  if (isCancel(go) || !go) {
    writeState('mobile', 'skipped', 'user skipped')
    return { status: 'skipped' }
  }

  // Expo CLI
  const expoOk = spawnSync('npx', ['expo', '--version'], { encoding: 'utf-8' }).status === 0
  if (expoOk) {
    log.success('Expo CLI available')
  } else {
    log.step('Installing expo-cli...')
    runScript('setup/mobile/install-expo.sh')
  }

  // Android SDK
  const androidHome = process.env['ANDROID_HOME']
  if (androidHome) {
    log.success(`Android SDK: ${androidHome}`)
  } else {
    log.warn('ANDROID_HOME not set')
    log.info('Download Android Studio: https://developer.android.com/studio')
    log.info('Install → SDK Manager → Android SDK Platform 34 + Build-Tools')
    const sdkPath = await text({ message: 'Paste Android SDK path (Enter to skip)' })
    if (!isCancel(sdkPath) && String(sdkPath)) {
      setEnv('ANDROID_HOME', String(sdkPath))
    }
  }

  // ADB device check
  if (which('adb')) {
    const devs = spawnSync('adb', ['devices'], { encoding: 'utf-8' })
    const lines = (devs.stdout ?? '').split('\n').filter(l => l && !l.startsWith('List') && l.trim())
    if (lines.length > 0) {
      log.success(`ADB device(s): ${lines.length}`)
    } else {
      log.warn('No ADB device connected — connect via USB + enable USB Debugging')
    }
  }

  log.info('Expo Go: scan QR from `just mobile-dev`')
  log.info('Android: https://play.google.com/store/apps/details?id=host.exp.exponent')

  writeYaml('mobile', 'true')
  writeYaml('mobile_platform', 'android')
  writeState('mobile', 'ok')
  return { status: 'ok' }
}
