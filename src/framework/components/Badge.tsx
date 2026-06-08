import { ReactNode } from 'react'
import './Badge.css'

interface BadgeProps {
  variant?: 'default' | 'accent' | 'success' | 'listeners' | 'warning'
  children?: ReactNode
  className?: string
  [key: string]: unknown
}

export function GfBadge({ variant = 'default', children, className = '', ...props }: BadgeProps) {
  return (
    <span className={`gf-badge gf-badge--${variant} ${className}`} {...props}>
      {children}
    </span>
  )
}
