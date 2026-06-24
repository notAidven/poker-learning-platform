import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  /**
   * When this value changes, a caught error is cleared and the children are
   * re-rendered. Pass the route path here so navigating away from a crashed
   * page automatically recovers without a full reload.
   */
  resetKey?: unknown
  /** Optional custom fallback renderer; falls back to the default card UI. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

type ErrorBoundaryState = { error: Error | null }

/**
 * Catches render/lifecycle exceptions in the subtree so a single component
 * throwing can never blank the entire app (React unmounts the whole tree on an
 * uncaught error). The error is logged and a recoverable fallback is shown.
 *
 * Intentionally dependency-free in the fallback (no router/context) so it still
 * renders even if a provider higher up is the thing that threw.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Never let a crash be silent — surface it for diagnosis.
    console.error('ErrorBoundary caught an unhandled UI error:', error, info.componentStack)
  }

  private reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.reset)

    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            This screen hit an unexpected error. Your progress is saved, and reloading usually fixes it.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Reload the page
            </button>
            <a
              href="/"
              className="min-h-11 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
