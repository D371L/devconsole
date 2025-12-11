import React, { Component, ErrorInfo, ReactNode } from 'react';
import { TerminalCard } from './TerminalUI';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-black">
          <TerminalCard title="SYSTEM_ERROR" neonColor="red" className="max-w-2xl w-full">
            <div className="space-y-4">
              <div className="text-red-600 dark:text-red-400 font-mono text-sm">
                <p className="font-bold mb-2">An unexpected error occurred:</p>
                <p className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded dark:rounded-none border border-red-200 dark:border-red-800">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded dark:rounded-none max-h-64 overflow-auto">
                  <summary className="cursor-pointer text-gray-600 dark:text-gray-400 mb-2">
                    Stack Trace
                  </summary>
                  <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded dark:rounded-none"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-4 py-2 bg-gray-600 text-white font-bold hover:bg-gray-700 rounded dark:rounded-none"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </TerminalCard>
        </div>
      );
    }

    return this.props.children;
  }
}

