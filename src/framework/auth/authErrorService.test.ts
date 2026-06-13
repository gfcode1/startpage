import { describe, it, expect } from 'vitest'
import { mapAuthError } from './authErrorService'

describe('mapAuthError', () => {
  it('returns null for null input', () => {
    expect(mapAuthError(null)).toBeNull()
  })

  it('maps known error code', () => {
    expect(mapAuthError({ message: '', code: 'InvalidLoginCredentials' }))
      .toBe('Invalid email or password')
  })

  it('maps known error message substring', () => {
    expect(mapAuthError({ message: 'PasswordTooWeak: choose a stronger one', code: undefined }))
      .toBe('Password must be at least 8 characters')
  })

  it('falls back to default for unknown errors', () => {
    expect(mapAuthError({ message: 'Something went terribly wrong', code: 'UNKNOWN' }))
      .toBe('Authentication failed. Please try again.')
  })
})
