import { Component, type ReactNode } from 'react';
import { withTranslation } from 'react-i18next';
import type { WithTranslation } from 'react-i18next';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

type Props = WithTranslation<'translation'> & { children: ReactNode };

class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: (error as Error)?.message || 'Something went wrong' };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    console.error('EstateHub error boundary caught:', error, info);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, message: '' });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center dark:bg-gray-950">
          <div className="text-6xl">😵</div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('common.errorTitle')}</h1>
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {t('common.errorDesc', { message: this.state.message })}
          </p>
          <div className="mt-6 flex gap-3">
            <button onClick={this.handleReset} className="btn-primary">{t('notfound.backHome')}</button>
            <button onClick={() => window.location.reload()} className="btn-outline">{t('common.reload')}</button>
          </div>
          <p className="mt-8 text-xs text-gray-400">
            {t('common.errorDebug')}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default withTranslation('translation')(ErrorBoundary);
