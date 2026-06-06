import { ReactNode, CSSProperties } from 'react'
import './Card.css'

interface CardProps {
  accent?: string
  children?: ReactNode
  className?: string
  onClick?: () => void
  [key: string]: unknown
}

export function GfCard({ accent, children, className = '', onClick, ...props }: CardProps) {
  return (
    <div
      className={`gf-card ${onClick ? 'gf-card--clickable' : ''} ${className}`}
      style={accent ? { '--gf-card-accent': accent } as CSSProperties : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardSubProps {
  className?: string
  [key: string]: unknown
}

export function GfCardAccent({ className = '', ...props }: CardSubProps) {
  return <div className={`gf-card__accent ${className}`} {...props} />
}

export function GfCardBody({ className = '', ...props }: CardSubProps) {
  return <div className={`gf-card__body ${className}`} {...props} />
}

export function GfCardTitle({ as: Tag = 'h3', className = '', ...props }: CardSubProps & { as?: React.ElementType }) {
  return <Tag className={`gf-card__title ${className}`} {...props} />
}

export function GfCardDescription({ className = '', ...props }: CardSubProps) {
  return <p className={`gf-card__desc ${className}`} {...props} />
}

export function GfCardImage({ className = '', ...props }: CardSubProps) {
  return <img className={`gf-card__image ${className}`} {...props} />
}
