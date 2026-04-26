type Variant = 'client' | 'admin'

type PageLayoutProps = {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  variant?: Variant
}

const PAGE_BG: Record<Variant, string> = {
  client: 'linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 60%, #E0F2FE 100%)',
  admin:  'linear-gradient(160deg, #F1F5F9 0%, #F8FAFC 60%, #EEF2FF 100%)',
}

export function PageLayout({ children, sidebar, header, variant = 'client' }: PageLayoutProps) {
  if (sidebar) {
    return (
      <div className="min-h-screen flex" style={{ background: PAGE_BG[variant] }}>
        {sidebar}
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pt-20 md:pt-6">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG[variant] }}>
      {header}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
