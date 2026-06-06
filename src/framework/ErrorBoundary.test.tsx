import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function MaybeThrow({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error!')
  return <p>All good</p>
}

function ThrowWithNoMessage() {
  throw new Error()
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <p>Hello</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('catches error and shows fallback UI', () => {
    render(
      <ErrorBoundary>
        <MaybeThrow shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error!')).toBeInTheDocument()
  })

  it('shows generic message when error has no message', () => {
    render(
      <ErrorBoundary>
        <ThrowWithNoMessage />
      </ErrorBoundary>,
    )
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
  })

  it('renders retry button', () => {
    render(
      <ErrorBoundary>
        <MaybeThrow shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })
})
