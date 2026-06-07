import { useState, useCallback } from 'react'
import { GfIcon } from '../iconSystem'
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
          <GfIcon name="close" size={12} />
        </button>
      </div>
    </div>
  )
}
