import React from 'react'

type CardBodyProps = {
  children: React.ReactNode
  className?: string
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={`p-6 ${className ?? ''}`}>{children}</div>
}
