# Mobile Architecture

## Stack

**Expo (React Native)** — managed workflow by default, bare workflow only if true foreground service needed.

- Web target via `expo start --web` — used for agent testing via Playwright
- EAS Build for cloud APK/IPA builds — local Android SDK optional
- Shared TS types + API client via `commons/`
- Shared React components where UI is identical to portals

## Testing Strategy

Agent tests via web target only:
```bash
expo start --web  # agent uses Playwright against this
```

Native behavior = human-verified on device/emulator before release. Document in `mobile-app/AGENTS.md`:
> Always compile to verify. Test UI via `expo start --web`. Native-only features have web stubs — test stub behavior only. Human smoke-tests on Android before release.

CI: `expo export --platform web` must succeed on every PR. Catches native-only code leaking outside Platform guards.

## Platform Abstraction

All native-only features wrapped. No naked native API calls outside platform files.

```typescript
// mobile-app/src/platform/notifications.ts
import { Platform } from 'react-native'

export const notifications = Platform.OS === 'web'
  ? {
      register: async () => 'web-stub-token',
      requestPermission: async () => true,
    }
  : require('./notifications.native').default
```

### Native-only features + their stubs

| Feature | Native impl | Web stub |
|---------|-------------|----------|
| Push notifications | `expo-notifications` + FCM | returns mock token |
| Foreground service | `expo-task-manager` (bare) | no-op |
| Biometrics | `expo-local-authentication` | always returns true |
| Background fetch | `expo-background-fetch` | no-op |
| Deep links | Expo linking + app intents | browser URL |
| Camera | `expo-camera` | browser `getUserMedia` |

## Push Notifications

`expo-notifications` unified API — FCM for Android, APNs for iOS, Web Push for PWA.

Flow:
1. After auth: `notifications.register()` → get device token
2. Save to `devices` table: `user_id, token, platform, created_at`
3. Never sign out by default — token persists

```sql
devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  token text NOT NULL,
  platform text NOT NULL,  -- 'android' | 'ios' | 'web'
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
)
```

Admin "test push" button → edge function → sends test notification to all user's devices.

Incoming notification screen: app opens to `/notifications/incoming` route on tap.

## Shared with Portals

Via `commons/` package:

- API client (Hono typed client)
- Supabase client + generated types
- i18n `t()` + message descriptors
- Auth session logic
- All Zod schemas
- `fetchApi` wrapper

## NOT shared with portals

- Navigation (React Navigation vs React Router)
- UI components (React Native primitives vs HTML)
- Styling (StyleSheet vs Tailwind)
- Platform-specific hooks (useBackHandler, useAppState)

## app.json config

Key fields managed by `just setup apply-branding`:
```json
{
  "expo": {
    "name": "{{project.name}}",
    "slug": "{{project.name}}",
    "primaryColor": "{{theme_colors.primary}}",
    "splash": { "backgroundColor": "{{theme_colors.primary}}" },
    "android": {
      "package": "com.{{project.name}}.app",
      "navigationBarColor": "{{theme_colors.primary}}"
    },
    "ios": {
      "bundleIdentifier": "com.{{project.name}}.app"
    }
  }
}
```

## Checker

`setup/checks/mobile_check.sh`:
- `expo export --platform web` succeeds (no native leaks)
- No `Platform.OS` checks outside `src/platform/` directory
- All entries in platform abstraction table have both native + web impl
- `devices` table migration exists if `push_notifications != none`
