import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import { GfIcon } from './iconSystem'
import './Toast.css'

const MAX_TOASTS = 5
const TOAST_DURATION = 4000

interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastsRef = useRef<Toast[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const pausedRef = useRef(false)

  useEffect(() => {
    toastsRef.current = toasts
  }, [toasts])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const scheduleDismiss = useCallback((id: number) => {
    if (pausedRef.current) return
    const timer = setTimeout(() => removeToast(id), TOAST_DURATION)
    timersRef.current.set(id, timer)
  }, [removeToast])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = nextId++
    setToasts(prev => {
      const next = [...prev, { id, message, type }]
      if (next.length > MAX_TOASTS) {
        const removed = next.splice(0, next.length - MAX_TOASTS)
        removed.forEach(r => timersRef.current.delete(r.id))
      }
      return next
    })
    scheduleDismiss(id)
  }, [scheduleDismiss])

  const handleMouseEnter = useCallback(() => {
    pausedRef.current = true
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  const handleMouseLeave = useCallback(() => {
    pausedRef.current = false
    const currentToasts = toastsRef.current
    for (const t of currentToasts) {
      if (!timersRef.current.has(t.id)) {
        const timer = setTimeout(() => removeToast(t.id), TOAST_DURATION)
        timersRef.current.set(t.id, timer)
      }
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="gf-toast-container" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {toasts.map(toast => (
          <div key={toast.id} className={`gf-toast gf-toast--${toast.type}`} role="alert">
            <span className="gf-toast__msg">{toast.message}</span>
            <button className="gf-toast__close" onClick={() => removeToast(toast.id)} aria-label="Dismiss">
              <GfIcon name="close" size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
