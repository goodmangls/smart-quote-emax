import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WidgetErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const WidgetError: React.FC<WidgetErrorProps> = ({ message, onRetry }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-8 h-8 text-amber-400 mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {message || t('widget.common.error')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-jways-600 dark:text-jways-400 hover:text-jways-700 dark:hover:text-jways-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('widget.common.retry')}
        </button>
      )}
    </div>
  );
};
