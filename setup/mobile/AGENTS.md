# setup/mobile/ — AGENTS.md

Read first:
1. `/AGENTS.md` (root)
2. `setup/AGENTS.md`
3. `architecture/mobile.md`
4. `architecture/setup-ux.md`

---

## Purpose

Mobile development environment setup. Android-first, local builds.
Optional step in install — skippable, but painless when chosen.
EAS Build optional — configure later when ready for app store.

## Directory Structure

```
setup/mobile/
  setup.sh       ← mobile setup step: checks + guided Android SDK install
  check.sh       ← verify mobile env is ready
```

## setup.sh flow

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MOBILE SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Expo (React Native) app — Android-first, local builds.
  • Develop via Expo Go (QR code) or build + install via ADB.
  ⚠  Requires Android SDK. iOS: optional (needs macOS + Xcode).

  (s=skip, q=quit)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Checks (in order)

**1. Expo CLI**
```bash
npx expo --version
```
If missing: `npm install -g expo-cli` — script runs this automatically.

**2. Android SDK**
```bash
$ANDROID_HOME/platform-tools/adb --version
```
If `ANDROID_HOME` not set or `adb` missing:
```
  ⚠  Android SDK not found.

  → Download Android Studio: https://developer.android.com/studio
  → Install, open, go to SDK Manager
  → Install: Android SDK Platform 34, Android SDK Build-Tools
  → Copy SDK path (shown in SDK Manager top bar)

  Paste Android SDK path (s=skip): _

  [script writes to .env.local: ANDROID_HOME=/path/to/sdk]
  [script adds $ANDROID_HOME/platform-tools to PATH in .env.local]
```

**3. ADB device check**
```bash
adb devices
```
```
  •  Connect your Android device via USB
  •  Enable Developer Options → USB Debugging
  •  Run: adb devices — your device should appear

  Press enter when device connected (s=skip): _

  ✓ Device found: Pixel 7 (emulator-5554)
```

If no device: warn, continue. User can connect later.

**4. Expo Go (optional guidance)**
```
  •  Install Expo Go on your phone:
     Android: https://play.google.com/store/apps/details?id=host.exp.exponent
     iOS:     https://apps.apple.com/app/expo-go/id982107779

  •  For fastest iteration: just mobile dev → scan QR → live reload
```
No check needed — informational only.

**5. Xcode (macOS only, optional)**
```bash
xcode-select -p 2>/dev/null
```
If macOS + Xcode not found: gentle warning, not blocking.
```
  ↷  Xcode not found — iOS builds unavailable. Android unaffected.
```

**6. Write project.yaml**
```yaml
mobile: true
mobile_platform: android   # android | ios | both
```

## check.sh

Outputs for `just setup health` table:

```bash
# checks:
# - ANDROID_HOME set + valid
# - adb available in PATH
# - expo CLI available
# - expo export --platform web succeeds (catches native leaks)

# outputs: OK | SKIP [reason] | FAIL [reason]
```

## Justfile targets

```makefile
# Quick iteration — scan QR with Expo Go
mobile-dev:
    cd mobile-app && npx expo start

# Build + install on connected Android device via ADB
mobile-install:
    cd mobile-app && npx expo run:android
    # expo run:android builds debug APK + installs via adb automatically

# Build release APK locally
mobile-build:
    cd mobile-app && npx expo run:android --variant release

# Web target — for Playwright testing
mobile-web:
    cd mobile-app && npx expo start --web

# Verify no native leaks (CI)
mobile-check:
    cd mobile-app && npx expo export --platform web

# Optional: EAS cloud build (configure later)
mobile-eas-build:
    cd mobile-app && eas build --platform android --profile preview
```

## ADB install flow (`just mobile install`)

`expo run:android` handles full flow:
1. Runs Gradle build (`android/gradlew assembleDebug`)
2. Finds connected device via `adb devices`
3. Installs APK via `adb install -r`
4. Launches app on device

Device must be connected + USB debugging enabled.
If no device found: build succeeds, install skipped, APK path printed.

## EAS Build (optional, configure later)

Not set up during init. When ready:
```bash
eas login
eas build:configure    # generates eas.json
just mobile-eas-build  # cloud build → download APK link
```

App store submission: manual review is fine. EAS Submit automates the upload
when ready (`eas submit --platform android`).

## CI

```bash
# in CI: only web target (no Android SDK on CI runners)
just mobile-check   # expo export --platform web must succeed
```

Native builds = local only until EAS configured.
