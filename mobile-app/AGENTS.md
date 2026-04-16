# mobile-app/ — AGENTS.md

Read first:
1. `/AGENTS.md` (root)
2. `architecture/mobile.md` ← full mobile strategy
3. `architecture/frontend.md` ← partial: styling + i18n + data fetching rules apply

---

## Purpose

Expo (React Native) app. Android + iOS native. Web target for agent testing only.
Accessible as native app. Deep-linked from `[domain]` via app intent.

## Development modes

| Command | What | When |
|---------|------|------|
| `just mobile-dev` | `expo start` → QR code → Expo Go on phone | fastest iteration |
| `just mobile-install` | `expo run:android` → builds + installs via ADB | test real APK on device |
| `just mobile-web` | `expo start --web` | agent Playwright testing |
| `just mobile-build` | release APK locally | pre-distribution testing |
| `just mobile-eas-build` | EAS cloud build (optional) | app store prep |

**Agent tests via web target only:**
```bash
expo start --web   # agent uses Playwright against this
expo export --platform web  # must succeed in CI — catches native leaks
```

Human smoke-tests on device via `just mobile-install` before release.
Connect Android device + enable USB debugging — `just mobile-install` handles the rest.

## Directory Structure

```
mobile-app/
  app.json               ← GENERATED (partial) by apply-branding — branding fields only
  package.json           ← Expo + mobile-specific deps
  tsconfig.json          ← strict: true
  app/                      ← Expo Router file-based routing
    _layout.tsx             ← root layout, auth check, providers
    index.tsx               ← redirects: onboarding → auth → dashboard
    (auth)/
      login.tsx             ← login screen + DevLogin if non-prod
    (onboarding)/
      _layout.tsx
      step1.tsx             ← "What brings you here?" (sample)
      step2.tsx             ← "How did you hear about us?" (sample)
    (app)/
      _layout.tsx           ← authenticated layout, tab bar
      dashboard.tsx         ← LLM chat demo, credit-gated
      settings.tsx          ← profile, notifications, dark mode
      billing.tsx           ← hidden if pricing_model: none
      support.tsx           ← message thread
    notifications/
      incoming.tsx          ← opened when user taps push notification
  src/
    components/          ← mobile-specific components
      DevLogin.tsx       ← mirrors commons DevLogin, React Native version
      onboarding/
        Step1.tsx        ← same questions as web, React Native UI
        Step2.tsx
        useOnboarding.ts ← shared logic, reads user.settings.onboarding_step
    platform/            ← ALL native-only code lives here only
      notifications.ts   ← expo-notifications + web stub
      foreground.ts      ← expo-task-manager + web stub
      biometrics.ts      ← expo-local-authentication + web stub
      deeplinks.ts       ← expo-linking + web stub
      camera.ts          ← expo-camera + browser getUserMedia
    hooks/               ← mobile-specific hooks
    lib/
      pushNotifications.ts  ← register device, save token to DB
```

## Platform abstraction — strict rule

**No native API calls outside `src/platform/`.** Every native feature has a web stub.

```typescript
// src/platform/notifications.ts
import { Platform } from 'react-native'

export const notifications = Platform.OS === 'web'
  ? {
      register: async () => 'web-stub-token',
      requestPermission: async () => true,
      scheduleLocal: async () => {},
    }
  : require('./notifications.native').default
```

Checker: grep for native module imports outside `src/platform/` — CI fail.

## Shared with commons

- `@any-project-base/commons/api/client` — typed API client
- `@any-project-base/commons/api/fetchApi` — all HTTP through here
- `@any-project-base/commons/types` — all types
- `@any-project-base/commons/i18n` — t(), useT()
- `@any-project-base/commons/hooks` — useAuth, usePaged, useInfinite, useDebounce

## NOT shared with portals

- Navigation (React Navigation / Expo Router vs React Router)
- UI primitives (View/Text/TouchableOpacity vs div/span/button)
- Styling (StyleSheet vs Tailwind)
- Platform hooks (useBackHandler, useAppState, useAppStateActive)

## Push notifications

After auth → register device → save to `devices` table:

```typescript
// src/lib/pushNotifications.ts
import { notifications } from '../platform/notifications'

export async function registerDevice(userId: string) {
  const token = await notifications.register()
  const platform = Platform.OS  // 'android' | 'ios' | 'web'
  await client.devices.$post({ json: { token, platform } })
}
```

Incoming notification tap → navigate to `/notifications/incoming`.
Never sign out by default — token persists across app restarts.

## DevLogin (mobile version)

Same seed users as commons DevLogin. React Native implementation:
- Renders if `APP_ENV !== 'prod'` (from `app.json` extra or env)
- Calls `dev-login` edge function → opens magic link URL via `Linking.openURL()`

## app.json — partial GENERATED

Branding fields written by `apply-branding`. Do not edit these manually:
```json
{
  "expo": {
    "name": "GENERATED",
    "primaryColor": "GENERATED",
    "splash": { "backgroundColor": "GENERATED" },
    "android": { "navigationBarColor": "GENERATED" }
  }
}
```

Other fields (plugins, permissions, etc.) — edit freely.

## Justfile

```makefile
mobile-web:    cd mobile-app && expo start --web
mobile-dev:    cd mobile-app && expo start
mobile-build:  cd mobile-app && eas build --platform android
mobile-export: cd mobile-app && expo export --platform web
```

## Checkers

`setup/checks/mobile_check.sh`:
- `expo export --platform web` succeeds (no native leaks)
- No native module imports outside `src/platform/` (grep)
- Every file in `src/platform/` has both native impl + web stub
- `devices` table migration exists if `push_notifications != none` in project.yaml
- `app.json` has GENERATED comment on branding fields
