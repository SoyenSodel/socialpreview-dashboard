import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// eslint-disable-next-line react-refresh/only-export-components
const ErrorFallback = ({ error, onReload }: { error: Error | null; onReload: () => void }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('error.somethingWentWrong')}</h1>
          <p className="text-gray-400 mb-6">
            {t('error.unexpectedErrorMessage')}
          </p>
          {import.meta.env.DEV && error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
              <p className="text-xs text-red-400 font-mono break-all">
                {error.toString()}
              </p>
            </div>
          )}
          <button
            onClick={onReload}
            className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            {t('error.reloadPage')}
          </button>
        </div>
      </div>
    </div>
  );
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error Info:', errorInfo);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReload={this.handleReload} />;
    }

    return this.props.children;
  }
}
