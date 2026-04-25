// commons/config.ts uses import.meta.env (Vite) — declare it for Expo/Metro TS checks
interface ImportMeta {
  readonly env: Record<string, string | undefined>
}
