'use client';

import React, { Component, ErrorInfo, ReactNode, createContext, useContext, useState, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// ============================================
// Types
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI */
  fallback?: ReactNode;
  /** Fallback render function with error and reset */
  fallbackRender?: (props: { error: Error; reset: () => void }) => ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Keys that trigger automatic reset when changed */
  resetKeys?: unknown[];
  /** Show home button in default fallback */
  showHomeButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================
// Error Boundary Context (for useErrorBoundary hook)
// ============================================

interface ErrorBoundaryContextValue {
  showBoundary: (error: Error) => void;
  resetBoundary: () => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

// ============================================
// Error Boundary Component
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || [];
      const currentKeys = this.props.resetKeys;

      const hasChanged = currentKeys.some((key, index) => key !== prevKeys[index]);
      if (hasChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  showBoundary = (error: Error): void => {
    this.setState({ hasError: true, error });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, fallbackRender, showHomeButton = true } = this.props;

    const contextValue: ErrorBoundaryContextValue = {
      showBoundary: this.showBoundary,
      resetBoundary: this.reset,
    };

    if (hasError && error) {
      // Custom fallback render
      if (fallbackRender) {
        return (
          <ErrorBoundaryContext.Provider value={contextValue}>
            {fallbackRender({ error, reset: this.reset })}
          </ErrorBoundaryContext.Provider>
        );
      }

      // Custom fallback element
      if (fallback) {
        return (
          <ErrorBoundaryContext.Provider value={contextValue}>
            {fallback}
          </ErrorBoundaryContext.Provider>
        );
      }

      // Default fallback UI
      return (
        <ErrorBoundaryContext.Provider value={contextValue}>
          <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md">
              <Alert variant="destructive" className="border-2">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="text-lg font-semibold">
                  Something went wrong
                </AlertTitle>
                <AlertDescription className="mt-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    {error.message || 'An unexpected error occurred'}
                  </p>

                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="text-xs mb-4">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Error Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={this.reset}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try again
                    </Button>

                    {showHomeButton && (
                      <Button
                        onClick={() => window.location.href = '/'}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Go Home
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </ErrorBoundaryContext.Provider>
      );
    }

    return (
      <ErrorBoundaryContext.Provider value={contextValue}>
        {children}
      </ErrorBoundaryContext.Provider>
    );
  }
}

// ============================================
// useErrorBoundary Hook
// ============================================

/**
 * Hook to programmatically trigger the error boundary
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showBoundary } = useErrorBoundary();
 *   
 *   const handleError = () => {
 *     showBoundary(new Error('Something went wrong'));
 *   };
 * }
 * ```
 */
export function useErrorBoundary(): ErrorBoundaryContextValue {
  const context = useContext(ErrorBoundaryContext);

  // Fallback if used outside ErrorBoundary
  const [, setError] = useState<Error | null>(null);

  const showBoundary = useCallback((error: Error) => {
    if (context) {
      context.showBoundary(error);
    } else {
      // Re-throw to let React's error boundary catch it
      setError(() => {
        throw error;
      });
    }
  }, [context]);

  const resetBoundary = useCallback(() => {
    context?.resetBoundary();
  }, [context]);

  return { showBoundary, resetBoundary };
}

// ============================================
// withErrorBoundary HOC
// ============================================

/**
 * Higher-order component to wrap a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

// ============================================
// AsyncErrorBoundary - For async errors
// ============================================

interface AsyncErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'fallbackRender'> {
  /** Loading indicator while async operations are pending */
  loadingFallback?: ReactNode;
}

/**
 * Error boundary that also handles async errors from child components
 * 
 * Wrap this around components that perform async operations and want
 * centralized error handling.
 */
export function AsyncErrorBoundary({
  children,
  loadingFallback,
  ...props
}: AsyncErrorBoundaryProps): JSX.Element {
  return (
    <ErrorBoundary {...props}>
      {children}
    </ErrorBoundary>
  );
}
