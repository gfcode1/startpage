import { useRef, useEffect, useCallback, useState } from 'react'
import { useGfTheme } from '../ThemeProvider'
import { GfIcon } from '../iconSystem'
import { persistenceService } from '../persistence/PersistenceService'
import { useToast } from '../ToastContext'
import { useAuth } from '../auth/AuthContext'
import { useSync } from '../sync/SyncContext'
import './SettingsModal.css'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { themeKey, setTheme } = useGfTheme()
  const { addToast } = useToast()
  const { user, profile, signOut, updateProfile } = useAuth()
  const { status, lastSynced, syncNow } = useSync()
  const [displayName, setDisplayName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)

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

  const syncLabel = status === 'idle' ? 'Waiting...'
    : status === 'syncing' ? 'Syncing...'
    : status === 'synced' ? 'Synced'
    : 'Sync error'

  const syncIcon = status === 'syncing' ? 'refresh' : status === 'synced' ? 'check' : status === 'error' ? 'exclamation' : 'refresh'

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

  const handleSaveDisplayName = async () => {
    const trimmed = displayName.trim()
    if (!trimmed) return
    await updateProfile({ display_name: trimmed })
    addToast('Display name updated', 'success')
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
              <GfIcon name="close" size={18} />
            </button>
          </div>

        <div className="gf-settings-modal__body">
          <section className="gf-settings-section">
            <h3 className="gf-settings-section__title">Profile</h3>
            <div className="gf-settings-field-row">
              <label className="gf-settings-label">Email</label>
              <span className="gf-settings-value">{user?.email ?? '-'}</span>
            </div>
            <div className="gf-settings-field-row">
              <label className="gf-settings-label" htmlFor="settings-display-name">Display name</label>
              <div className="gf-settings-inline">
                <input
                  id="settings-display-name"
                  className="gf-settings-input"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={profile?.display_name || 'Enter name'}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveDisplayName() }}
                />
                <button className="gf-settings-btn gf-settings-btn--sm" onClick={handleSaveDisplayName}>
                  Save
                </button>
              </div>
            </div>
            <div className="gf-settings-field-row">
              <label className="gf-settings-label">Sync</label>
              <div className="gf-settings-inline">
                <span className={`gf-settings-sync ${status === 'error' ? 'gf-settings-sync--error' : status === 'synced' ? 'gf-settings-sync--ok' : ''}`}>
                  <GfIcon name={syncIcon} size={14} />
                  {syncLabel}
                </span>
                <button className="gf-settings-btn gf-settings-btn--sm" onClick={syncNow}>
                  Sync now
                </button>
              </div>
            </div>
            {lastSynced && (
              <div className="gf-settings-field-row">
                <label className="gf-settings-label">Last synced</label>
                <span className="gf-settings-value">{new Date(lastSynced).toLocaleString()}</span>
              </div>
            )}
            <div className="gf-settings-actions" style={{ marginTop: '0.5rem' }}>
              <button className="gf-settings-btn gf-settings-btn--danger" onClick={signOut}>
                Sign out
              </button>
            </div>
          </section>

          <section className="gf-settings-section">
            <h3 className="gf-settings-section__title">Theme</h3>
            <div className="gf-settings-toggle">
              <button
                className={`gf-settings-toggle__btn${themeKey === 'light' ? ' gf-settings-toggle__btn--active' : ''}`}
                onClick={() => setTheme('light')}
                aria-pressed={themeKey === 'light'}
              >
                <GfIcon name="sun" size={16} />
                Light
              </button>
              <button
                className={`gf-settings-toggle__btn${themeKey === 'dark' ? ' gf-settings-toggle__btn--active' : ''}`}
                onClick={() => setTheme('dark')}
                aria-pressed={themeKey === 'dark'}
              >
                <GfIcon name="moon" size={16} />
                Dark
              </button>
            </div>
          </section>

          <section className="gf-settings-section">
            <h3 className="gf-settings-section__title">Data Backup</h3>
            <p className="gf-settings-section__desc">
              Download all app data or restore from a previous backup.
            </p>
            <div className="gf-settings-actions">
              <button className="gf-settings-btn" onClick={handleExport}>
                <GfIcon name="download" size={16} />
                Download backup
              </button>
              <button className="gf-settings-btn" onClick={() => fileRef.current?.click()}>
                <GfIcon name="upload" size={16} />
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
