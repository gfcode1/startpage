import { Component, ReactNode, ErrorInfo } from 'react'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  appName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorKey = 0

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.appName ? ` ${this.props.appName}` : ''}]`, error, info)
    this.setState({ errorInfo: info })
  }

  handleRetry = () => {
    this.errorKey++
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const appMsg = this.props.appName ? `"${this.props.appName}"` : 'this page'
      return (
        <div className="gf-error-boundary">
          <div className="gf-error-boundary__inner">
            <h2 className="gf-error-boundary__title">Something went wrong</h2>
            <p className="gf-error-boundary__desc">
              {this.state.error?.message
                ? `${appMsg} encountered an error: ${this.state.error.message}`
                : `An unexpected error occurred in ${appMsg}.`}
            </p>
            {this.state.errorInfo?.componentStack && (
              <details className="gf-error-boundary__details">
                <summary>Technical details</summary>
                <pre className="gf-error-boundary__stack">{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
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
