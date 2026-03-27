import { Component, type ReactNode } from 'react'
import { analytics } from '@/lib/posthog'

interface Props { children: ReactNode }
interface State { hasError: boolean }

const GRAYS = ['#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#1F2937']

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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
          {/* Grayscale palette illustration — matches 404 */}
          <div className="flex gap-1.5 mb-8">
            {GRAYS.map((c, i) => (
              <div
                key={i}
                className="w-14 h-16 rounded-card"
                style={{ backgroundColor: c }}
                aria-hidden="true"
              />
            ))}
          </div>

          <h1 className="text-[48px] font-extrabold text-foreground tracking-tight mb-2">Oops</h1>
          <p className="text-[17px] font-semibold text-foreground mb-1">Something went wrong</p>
          <p className="text-[15px] text-muted-foreground mb-8">
            An unexpected error occurred. Let's get you back on track.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center h-11 px-8 rounded-button bg-primary text-primary-foreground font-medium text-[15px] transition-all active:scale-[0.98] hover:opacity-90 w-full max-w-[280px]"
            aria-label="Refresh page"
          >
            Refresh page →
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
