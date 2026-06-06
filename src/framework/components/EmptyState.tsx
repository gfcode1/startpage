import { ReactNode } from 'react'
import { GfButton } from './Button'
import './EmptyState.css'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function GfEmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="gf-empty-state">
      {icon && <div className="gf-empty-state__icon">{icon}</div>}
      <h3 className="gf-empty-state__title">{title}</h3>
      <p className="gf-empty-state__desc">{description}</p>
      {action && (
        <GfButton variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </GfButton>
      )}
    </div>
  )
}
