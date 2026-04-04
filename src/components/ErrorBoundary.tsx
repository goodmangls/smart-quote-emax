import React, { Component, type ReactNode } from 'react';
import { translations, type Language } from '@/i18n/translations';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Resolve the user's language from localStorage (safe for class components). */
const getErrorBoundaryTranslation = (key: string): string => {
  const lang = (typeof localStorage !== 'undefined'
    ? (localStorage.getItem('smartQuoteLanguage') as Language)
    : null) ?? 'ko';
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    import('@sentry/browser').then(Sentry => {
      Sentry.captureException(error, {
        extra: { componentStack: info.componentStack },
      });
    }).catch(() => { /* Sentry not available */ });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {getErrorBoundaryTranslation('error.somethingWrong')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                {getErrorBoundaryTranslation('error.tryAgain')}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-jways-500 text-white rounded-lg hover:bg-jways-600 transition-colors font-medium"
              >
                {getErrorBoundaryTranslation('error.reloadPage')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
