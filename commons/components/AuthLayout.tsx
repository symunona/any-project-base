import { config } from '../config'

type AuthLayoutProps = {
  children: React.ReactNode
}

// Layout for login / register pages
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center
                    bg-[var(--color-bg,#f8f9fa)] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">
            {config.projectName}
          </h1>
        </div>
        <div className="bg-[var(--color-surface,white)] rounded-xl shadow-md p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
