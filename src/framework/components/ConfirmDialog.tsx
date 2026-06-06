import { useRef, useEffect, useCallback } from 'react'
import { GfButton } from './Button'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export function GfConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleConfirm = useCallback(() => {
    onConfirm()
    onClose()
  }, [onConfirm, onClose])

  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      const btn = modalRef.current?.querySelector<HTMLButtonElement>('[data-confirm]')
      btn?.focus()
    }, 50)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="gf-confirm-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="gf-confirm-modal" ref={modalRef}>
        <h3 className="gf-confirm-modal__title">{title}</h3>
        <p className="gf-confirm-modal__message">{message}</p>
        <div className="gf-confirm-modal__actions">
          <GfButton variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </GfButton>
          <GfButton
            variant="primary"
            size="sm"
            data-confirm
            onClick={handleConfirm}
            style={variant === 'danger' ? { background: 'var(--gf-error)', borderColor: 'var(--gf-error)' } as React.CSSProperties : undefined}
          >
            {confirmLabel}
          </GfButton>
        </div>
      </div>
    </div>
  )
}
