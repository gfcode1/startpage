import { Component, ReactNode, ErrorInfo } from 'react'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorKey = 0

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleRetry = () => {
    this.errorKey++
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="gf-error-boundary">
          <div className="gf-error-boundary__inner">
            <h2 className="gf-error-boundary__title">Something went wrong</h2>
            <p className="gf-error-boundary__desc">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button
              className="gf-error-boundary__retry"
              onClick={this.handleRetry}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return <div key={this.errorKey}>{this.props.children}</div>
  }
}
