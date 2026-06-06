import { useState, useCallback } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import './InstallPrompt.css'

export function InstallPrompt() {
  const { canInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = useCallback(() => setDismissed(true), [])

  if (!canInstall || dismissed) return null

  return (
    <div className="gf-install-prompt" role="alert" aria-live="polite">
      <div className="gf-install-prompt__info">
        <span className="gf-install-prompt__title">Install App</span>
        <span className="gf-install-prompt__desc">Add to home screen for quick access</span>
      </div>
      <div className="gf-install-prompt__actions">
        <button className="gf-install-prompt__btn" onClick={install}>
          Install
        </button>
        <button className="gf-install-prompt__dismiss" onClick={handleDismiss} aria-label="Dismiss">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
