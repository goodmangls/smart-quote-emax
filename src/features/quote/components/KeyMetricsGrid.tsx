import React from 'react';
import { QuoteResult } from '@/types';
import { formatNumDec } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';
import { resultStyles } from './result-styles';

interface Props {
  result: QuoteResult;
  hideMargin?: boolean;
}

export const KeyMetricsGrid: React.FC<Props> = ({ result, hideMargin }) => {
  const formatNum = formatNumDec;
  const { metricCardClass } = resultStyles;
  const { t } = useLanguage();

  return (
      <div className={`grid ${hideMargin ? 'grid-cols-2' : 'grid-cols-3'} gap-3 sm:gap-4`}>
        <div className={metricCardClass}>
            <span className="block text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{t('quote.actualWeight')}</span>
            <span className="block text-sm sm:text-base font-bold text-gray-800 dark:text-white">{formatNum(result.totalActualWeight)} <span className="text-xs font-normal text-gray-400">kg</span></span>
        </div>
        <div className={metricCardClass}>
            <span className="block text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{t('quote.billableWeight')}</span>
            <span className="block text-sm sm:text-base font-bold text-emax-600 dark:text-emax-400">{formatNum(result.billableWeight)} <span className="text-xs font-normal text-gray-400">kg</span></span>
        </div>
        {!hideMargin && (
          <div className={metricCardClass}>
              <span className="block text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{t('quote.discount')}</span>
              <span className={`block text-sm sm:text-base font-bold ${result.discountPercent < 10 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{result.discountPercent}%</span>
          </div>
        )}
      </div>
  );
};
