import React from 'react'

type CardProps = {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={`bg-[var(--color-surface)] rounded-2xl overflow-hidden ${className ?? ''}`}>
      {children}
    </div>
  )
}
