import { Component, type ReactNode } from 'react'
import { analytics } from '@/lib/posthog'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    analytics.track('error_react_crash', {
      message: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: info.componentStack?.slice(0, 300),
      url: window.location.href,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: 24,
          fontFamily: 'system-ui', color: '#1a1a2e',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
            Try refreshing the page
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: '#6C47FF', color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
            aria-label="Refresh page"
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
