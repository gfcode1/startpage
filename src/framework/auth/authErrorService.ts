export const AUTH_ERROR_MAP: Record<string, string> = {
  InvalidLoginCredentials: 'Invalid email or password',
  EmailNotConfirmed: 'Please confirm your email before signing in',
  UserAlreadyRegistered: 'An account with this email already exists',
  PasswordTooWeak: 'Password must be at least 8 characters',
  default: 'Authentication failed. Please try again.',
}

export function mapAuthError(error: { message: string; code?: string } | null): string | null {
  if (!error) return null

  if (error.code && AUTH_ERROR_MAP[error.code]) {
    return AUTH_ERROR_MAP[error.code]
  }

  for (const [key, msg] of Object.entries(AUTH_ERROR_MAP)) {
    if (error.message.includes(key)) return msg
  }

  return AUTH_ERROR_MAP.default
}
