import React from 'react';
import { QuoteResult } from '@/types';
import { formatKRW, formatUSDInt } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  result: QuoteResult;
  isKorean: boolean;
  onViewDetails: () => void;
}

export const MobileStickyBottomBar: React.FC<Props> = ({ result, isKorean, onViewDetails }) => {
  const { t } = useLanguage();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 safe-area-bottom">
      <div className="max-w-lg mx-auto flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('calc.totalEstimate')}</p>
          <div className="flex items-baseline space-x-1">
            {isKorean ? (
              <>
                <p className="text-xl font-bold text-jways-700 dark:text-jways-400">
                  {formatKRW(result.totalQuoteAmount)}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-400">
                  ({formatUSDInt(result.totalQuoteAmountUSD)})
                </span>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-jways-700 dark:text-jways-400">
                  {formatUSDInt(result.totalQuoteAmountUSD)}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-400">
                  (≈ {formatKRW(result.totalQuoteAmount)})
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={onViewDetails}
          className="flex items-center bg-jways-600 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-jways-600/25 hover:bg-jways-500 active:scale-95 transition-all"
        >
          {t('calc.viewDetails')}
        </button>
      </div>
    </div>
  );
};
