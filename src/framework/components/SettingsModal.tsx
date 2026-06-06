import { useRef, useEffect, useCallback, useState } from 'react'
import { useGfTheme } from '../ThemeProvider'
import { themeKeys, themes, type Theme } from '../themes'
import { persistenceService } from '../persistence/PersistenceService'
import { useToast } from '../ToastContext'
import './SettingsModal.css'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { themeKey, setTheme } = useGfTheme()
  const { addToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null)

  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return []
    const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    return Array.from(modalRef.current.querySelectorAll<HTMLElement>(selectors))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
  }, [])

  useEffect(() => {
    if (!open) return

    prevFocusRef.current = document.activeElement as HTMLElement

    const timer = setTimeout(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      }
    }, 50)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = getFocusableElements()
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      prevFocusRef.current?.focus()
    }
  }, [open, onClose, getFocusableElements])

  if (!open) return null

  const handleExport = () => {
    try {
      persistenceService.downloadBackup()
      addToast('Backup downloaded successfully', 'success')
    } catch (e) {
      console.warn('SettingsModal: export backup failed', e)
      addToast('Backup error', 'error')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await persistenceService.uploadBackup(file)
    if (result.success) {
      addToast('Backup imported! Reloading page...', 'success')
      setTimeout(() => location.reload(), 1500)
    } else {
      addToast(result.error, 'error')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div
      className="gf-settings-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
        <div className="gf-settings-modal" ref={modalRef}>
          <div className="gf-settings-modal__header">
            <h2 className="gf-settings-modal__title">Settings</h2>
            <button className="gf-settings-modal__close" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

        <div className="gf-settings-modal__body">
          <section className="gf-settings-section">
            <h3 className="gf-settings-section__title">Theme</h3>
            <div className="gf-settings-themes">
              {themeKeys.map(key => {
                const t = themes[key]
                const active = key === themeKey
                const isPreviewed = previewTheme === t
                return (
                  <button
                    key={key}
                    className={`gf-settings-theme-item${active ? ' gf-settings-theme-item--active' : ''}${isPreviewed ? ' gf-settings-theme-item--preview' : ''}`}
                    onClick={() => setTheme(key)}
                    onMouseEnter={() => setPreviewTheme(t)}
                    onMouseLeave={() => setPreviewTheme(null)}
                    onFocus={() => setPreviewTheme(t)}
                    onBlur={() => setPreviewTheme(null)}
                  >
                    <span className="gf-settings-theme-item__dot" style={{ background: t.colors.accent }} />
                    <span className="gf-settings-theme-item__name">{t.name}</span>
                    {active && (
                      <svg className="gf-settings-theme-item__check" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M2 7l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            {previewTheme && (
              <div className="gf-theme-preview" style={{ '--preview-accent': previewTheme.colors.accent, '--preview-bg': previewTheme.colors.bgApp, '--preview-text': previewTheme.colors.text, '--preview-text-muted': previewTheme.colors.textMuted, '--preview-border': previewTheme.colors.border, '--preview-font': previewTheme.meta.fontUi } as React.CSSProperties}>
                <div className="gf-theme-preview__bar">
                  <span className="gf-theme-preview__bar-text">{previewTheme.name}</span>
                  <span className="gf-theme-preview__bar-dot" />
                </div>
                <div className="gf-theme-preview__body">
                  <div className="gf-theme-preview__line gf-theme-preview__line--wide" />
                  <div className="gf-theme-preview__line" />
                  <div className="gf-theme-preview__line gf-theme-preview__line--short" />
                  <div className="gf-theme-preview__btn">{previewTheme.meta.fontDisplay}</div>
                </div>
              </div>
            )}
          </section>

          <section className="gf-settings-section">
            <h3 className="gf-settings-section__title">Profile Backup</h3>
            <p className="gf-settings-section__desc">
              Download all app data or restore from a previous backup.
            </p>
            <div className="gf-settings-actions">
              <button className="gf-settings-btn" onClick={handleExport}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 11V3M8 3l4 4M8 3L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Download backup
              </button>
              <button className="gf-settings-btn" onClick={() => fileRef.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 5v8M8 13l-4-4M8 13l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Upload backup
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
