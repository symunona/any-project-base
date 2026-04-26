import React from 'react'

type CardHeaderProps = {
  children: React.ReactNode
  actions?: React.ReactNode
}

export function CardHeader({ children, actions }: CardHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
      <div className="font-semibold text-[var(--color-text)]">{children}</div>
      {actions && <div>{actions}</div>}
    </div>
  )
}
