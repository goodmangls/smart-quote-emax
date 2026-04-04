import React, { useState } from 'react';
import { QuoteResult } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Anchor, FileDown, ArrowUpDown } from 'lucide-react';
import { formatKRW, formatUSD } from '@/lib/format';
import { resultStyles } from './result-styles';

interface Props {
  result: QuoteResult;
  onDownloadPdf: () => void;
  isKorean?: boolean;
  hideMargin?: boolean;
}

export const QuoteSummaryCard: React.FC<Props> = ({ result, onDownloadPdf, isKorean = false, hideMargin }) => {
  // Admin (!hideMargin): always start with KRW + toggle available
  // Member (hideMargin): fixed based on nationality (KR→KRW, else→USD)
  const [showKRW, setShowKRW] = useState(!hideMargin ? true : isKorean);
  const { t } = useLanguage();

  const primaryAmount = showKRW
    ? formatKRW(result.totalQuoteAmount)
    : formatUSD(result.totalQuoteAmountUSD);
  const secondaryAmount = showKRW
    ? formatUSD(result.totalQuoteAmountUSD)
    : formatKRW(result.totalQuoteAmount);
  const secondaryLabel = showKRW ? 'USD' : 'KRW';

  return (
      <div className={resultStyles.mainQuoteCardClass}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Anchor className="w-32 h-32 transform rotate-12" />
        </div>

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-jways-200 text-xs font-bold tracking-widest uppercase mt-1">{t('calc.totalEstimate')}</h2>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={onDownloadPdf}
                        className="flex items-center space-x-1 bg-white/90 hover:bg-white text-jways-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        title={t('quote.downloadPdf')}
                    >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>PDF</span>
                    </button>
                </div>
            </div>

            {hideMargin ? (
              <div className="flex flex-col mb-5 w-full">
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  <span>{isKorean ? formatKRW(result.totalQuoteAmount) : formatUSD(result.totalQuoteAmountUSD)}</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowKRW(prev => !prev)}
                className="flex flex-col mb-5 text-left group cursor-pointer w-full"
                aria-label="Toggle currency display"
              >
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight flex items-center gap-2">
                      <span>{primaryAmount}</span>
                      <ArrowUpDown className="w-5 h-5 text-jways-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-lg text-jways-300 font-light mt-1 flex items-center">
                      <span className="opacity-70 mr-2">&asymp;</span> {secondaryAmount} <span className="text-xs ml-1 opacity-50">{secondaryLabel}</span>
                  </div>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10">
                <div>
                    <span className="block text-jways-200 text-xs mb-0.5">Transit Time</span>
                    <span className="font-semibold text-white">{result.transitTime}</span>
                </div>
                <div>
                    <span className="block text-jways-200 text-xs mb-0.5">Zone</span>
                    <span className="font-semibold text-white">{result.appliedZone}</span>
                </div>
            </div>
        </div>
      </div>
  );
};
