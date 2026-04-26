import React from 'react'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const base =
  'w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--color-surface)] ' +
  'border border-[var(--color-border)] text-[var(--color-text)] ' +
  'focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export function Select({ className, ...props }: SelectProps) {
  return <select className={`${base} ${className ?? ''}`} {...props} />
}
