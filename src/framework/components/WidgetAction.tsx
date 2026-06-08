import { GfIcon } from '../iconSystem'
import './WidgetAction.css'

interface WidgetActionProps {
  label: string
  onClick: () => void
}

export function GfWidgetAction({ label, onClick }: WidgetActionProps) {
  return (
    <button className="gf-widget-action" onClick={onClick}>
      {label}
      <GfIcon name="chevron-right" size={12} />
    </button>
  )
}
