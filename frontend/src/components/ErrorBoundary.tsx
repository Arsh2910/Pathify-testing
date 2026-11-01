import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GoalWeave ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="page-bg min-h-screen flex items-center justify-center p-4">
          <div
            className="w-full max-w-md p-8 rounded-2xl shadow-2xl text-center animate-fade-in border"
            style={{
              background: 'var(--th-surface-container)',
              borderColor: 'color-mix(in srgb, var(--th-error) 30%, transparent)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'color-mix(in srgb, var(--th-error) 15%, transparent)',
                border: '1px solid color-mix(in srgb, var(--th-error) 35%, transparent)',
              }}
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--th-error)' }}>
                healing
              </span>
            </div>

            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--th-on-surface)' }}
            >
              Something took an unexpected turn
            </h2>

            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ fontFamily: 'Hanken Grotesk', color: 'var(--th-on-surface-variant)' }}
            >
              An interface error occurred while rendering this view. Don&apos;t worry, your progress and data are safe.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary py-2 px-5 text-sm cursor-pointer"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn-ghost py-2 px-5 text-sm cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
