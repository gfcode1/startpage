import { useState, useCallback } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useWidgetOptions } from '../../framework/WidgetOptionsContext'
import { useToast } from '../../framework/ToastContext'
import './PasswordWidget.css'

function generatePassword(len: number, useSymbols: boolean, useNumbers: boolean): string {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  let chars = letters
  if (useNumbers) chars += digits
  if (useSymbols) chars += symbols
  let result = ''
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export default function PasswordWidget() {
  const { options: opts } = useWidgetOptions('password')
  const length = Number(opts?.length) || 16
  const useSymbols = opts?.symbols !== false
  const useNumbers = opts?.numbers !== false
  const { addToast } = useToast()

  const [password, setPassword] = useState(() => generatePassword(length, useSymbols, useNumbers))

  const regenerate = useCallback(() => {
    setPassword(generatePassword(length, useSymbols, useNumbers))
  }, [length, useSymbols, useNumbers])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(password)
      addToast?.('Password copied!', 'success')
    } catch {
      addToast?.('Failed to copy', 'error')
    }
  }, [password, addToast])

  return (
    <div className="gf-widget-password">
      <div className="gf-widget-password__header">
        <GfIcon name="hash" size={14} />
        <span className="gf-widget-password__label">Password</span>
      </div>
      <div className="gf-widget-password__field">
        <span className="gf-widget-password__text">{password}</span>
      </div>
      <div className="gf-widget-password__actions">
        <button className="gf-widget-password__btn" onClick={regenerate}>
          <GfIcon name="refresh" size={14} />
          Generate
        </button>
        <button className="gf-widget-password__btn gf-widget-password__btn--primary" onClick={copy}>
          <GfIcon name="copy" size={14} />
          Copy
        </button>
      </div>
    </div>
  )
}
