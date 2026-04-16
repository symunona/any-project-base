type PageLayoutProps = {
  children: React.ReactNode
  header?: React.ReactNode
}

export function PageLayout({ children, header }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg,#f8f9fa)]">
      {header}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
