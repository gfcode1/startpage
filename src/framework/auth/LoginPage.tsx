import { useState, FormEvent, useRef } from 'react'
import { useAuth } from './AuthContext'
import './LoginPage.css'

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 30_000

export function LoginPage() {
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const attemptRef = useRef(0)
  const blockedUntilRef = useRef(0)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const now = Date.now()
    if (now < blockedUntilRef.current) {
      const remaining = Math.ceil((blockedUntilRef.current - now) / 1000)
      setError(`Too many attempts. Try again in ${remaining}s`)
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setBusy(true)
    const errMsg = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password)
    setBusy(false)

    if (errMsg) {
      attemptRef.current += 1
      if (attemptRef.current >= MAX_ATTEMPTS) {
        blockedUntilRef.current = Date.now() + BLOCK_DURATION_MS
        attemptRef.current = 0
        setError(`Too many attempts. Try again in ${BLOCK_DURATION_MS / 1000}s`)
        return
      }
      setError(errMsg)
    } else {
      attemptRef.current = 0
    }
  }

  return (
    <div className="gf-login">
      <div className="gf-login__card">
        <h1 className="gf-login__title">GFcode</h1>
        <p className="gf-login__subtitle">
          {mode === 'login' ? 'Sign in to sync your data' : 'Create an account'}
        </p>

        {error && <div className="gf-login__error">{error}</div>}

        <form className="gf-login__form" onSubmit={handleSubmit}>
          <div className="gf-login__field">
            <label className="gf-login__label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="gf-login__input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="gf-login__field">
            <label className="gf-login__label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="gf-login__input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button className="gf-login__submit" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="gf-login__footer">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button className="gf-login__link" onClick={() => { setMode('register'); setError(null) }}>
                Create one
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button className="gf-login__link" onClick={() => { setMode('login'); setError(null) }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
