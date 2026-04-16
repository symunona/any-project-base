export const config = {
  appEnv:           import.meta.env['VITE_APP_ENV'] as 'local' | 'test' | 'prod',
  apiUrl:           import.meta.env['VITE_API_URL'] as string,
  supabaseUrl:      import.meta.env['VITE_SUPABASE_URL'] as string,
  supabaseAnonKey:  import.meta.env['VITE_SUPABASE_ANON_KEY'] as string,
  projectName:      import.meta.env['VITE_PROJECT_NAME'] as string,
  domain:           import.meta.env['VITE_DOMAIN'] as string,
  pricingModel:     (import.meta.env['VITE_PRICING_MODEL'] ?? 'none') as
                      'none' | 'credits' | 'subscription_credits' | 'tiers',
  analytics:        (import.meta.env['VITE_ANALYTICS'] ?? 'none') as 'none' | 'posthog',
  authProviders:    (import.meta.env['VITE_AUTH_PROVIDERS'] as string | undefined)
                      ?.split(',') ?? ['email'],
  defaultLocale:    (import.meta.env['VITE_DEFAULT_LOCALE'] as string | undefined) ?? 'en',
  supportedLocales: (import.meta.env['VITE_SUPPORTED_LOCALES'] as string | undefined)
                      ?.split(',') ?? ['en'],
  commitSha:        import.meta.env['VITE_COMMIT_SHA'] as string | undefined,
  commitDate:       import.meta.env['VITE_COMMIT_DATE'] as string | undefined,
} as const
