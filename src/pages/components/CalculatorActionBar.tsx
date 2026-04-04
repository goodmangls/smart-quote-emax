import React from 'react';
import { QuoteInput, QuoteResult } from '@/types';
import { NavigationTabs, AppView } from '@/components/layout/NavigationTabs';
import { SaveQuoteButton } from '@/features/quote/components/SaveQuoteButton';
import { Smartphone, RotateCcw, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  canSaveAndViewHistory: boolean;
  input: QuoteInput;
  result: QuoteResult | null;
  onQuoteSaved: () => void;
  onReset: () => void;
  isMobileView: boolean;
  onToggleMobileView: () => void;
}

export const CalculatorActionBar: React.FC<Props> = ({
  currentView,
  onViewChange,
  canSaveAndViewHistory,
  input,
  result,
  onQuoteSaved,
  onReset,
  isMobileView,
  onToggleMobileView,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-30 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {canSaveAndViewHistory && <NavigationTabs currentView={currentView} onViewChange={onViewChange} />}

            {currentView === 'calculator' && result && canSaveAndViewHistory && (
              <div className="hidden sm:block">
                <SaveQuoteButton input={input} result={result} onSaved={onQuoteSaved} />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Lightning Quote System</span>
            </div>

            {currentView === 'calculator' && (
              <button
                onClick={onReset}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400 transition-colors"
                aria-label={t('calc.resetQuote')}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            {currentView === 'calculator' && (
              <button
                onClick={onToggleMobileView}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                aria-label="Switch to Mobile View"
              >
                {isMobileView ? (
                  <div className="relative">
                    <Smartphone className="w-5 h-5 text-accent-600" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500"></span>
                    </span>
                  </div>
                ) : (
                  <Smartphone className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {currentView === 'calculator' && result && canSaveAndViewHistory && (
          <div className="sm:hidden pb-3">
            <SaveQuoteButton input={input} result={result} onSaved={onQuoteSaved} />
          </div>
        )}
      </div>
    </div>
  );
};
