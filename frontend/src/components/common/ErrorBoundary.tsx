import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message?: string;
}

/** Catches render errors and shows a safe fallback instead of a white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('RescueAI ErrorBoundary:', error, info);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="glass max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-accent" />
          <h1 className="mb-2 text-xl font-bold text-primary">Something went wrong</h1>
          <p className="mb-2 text-sm text-muted">
            An unexpected error occurred. In a real emergency, call{' '}
            <a href="tel:108" className="font-bold text-danger">
              108
            </a>{' '}
            immediately.
          </p>
          {this.state.message && (
            <p className="mb-4 break-words text-xs text-muted/70">{this.state.message}</p>
          )}
          <button
            onClick={() => window.location.assign('/')}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 font-semibold text-white transition hover:bg-primary"
          >
            <RefreshCw className="h-4 w-4" /> Return home
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
