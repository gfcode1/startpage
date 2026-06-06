import { useState, useEffect, useCallback } from 'react'

interface InstallPromptState {
  canInstall: boolean
  install: () => Promise<void>
  dismissed: boolean
}

export function useInstallPrompt(): InstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches
    if (alreadyInstalled) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return

    const promptEvent = deferredPrompt as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    setDeferredPrompt(null)
    if (outcome !== 'accepted') {
      setDismissed(true)
    }
  }, [deferredPrompt])

  return {
    canInstall: deferredPrompt !== null && !dismissed && !installed,
    install,
    dismissed,
  }
}
