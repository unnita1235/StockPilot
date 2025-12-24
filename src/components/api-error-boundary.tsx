'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for catching and displaying API errors
 * Provides a user-friendly error UI with retry functionality
 */
export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ApiErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you could send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} onRetry={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI component
 */
function DefaultErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const isNetworkError = error.message.includes('connect to server') || error.message.includes('network');
  const isApiError = error.name === 'ApiError';

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          {isNetworkError ? (
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          ) : (
            <AlertCircle className="h-16 w-16 text-destructive" />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {isNetworkError ? 'Connection Error' : 'Something went wrong'}
          </h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>

        <div className="space-y-2">
          <Button onClick={onRetry} className="w-full" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          {isNetworkError && (
            <p className="text-xs text-muted-foreground">
              Please check your internet connection and try again.
            </p>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to throw errors that will be caught by ApiErrorBoundary
 * Useful for async operations where you want to trigger the error boundary
 */
export function useErrorHandler() {
  const [, setError] = React.useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
