import React, { useMemo, useState } from 'react';
import { QuoteInput, QuoteResult } from '@/types';
import { calculateQuote } from '@/features/quote/services/calculationService';
import { formatKRW, formatUSDInt } from '@/lib/format';
import { ArrowRightLeft, Check, ArrowUpDown } from 'lucide-react';
import { DEFAULT_FSC_PERCENT, DEFAULT_FSC_PERCENT_DHL } from '@/config/rates';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  input: QuoteInput;
  currentResult: QuoteResult;
  isKorean?: boolean;
  onSwitchCarrier: (carrier: 'UPS' | 'DHL') => void;
  showUSD?: boolean;
  hideMargin?: boolean;
}

export const CarrierComparisonCard: React.FC<Props> = ({ input, currentResult, isKorean = false, onSwitchCarrier, showUSD = false }) => {
  const [showKRW, setShowKRW] = useState(!showUSD ? true : isKorean);
  const { t } = useLanguage();
  const altCarrier = input.overseasCarrier === 'DHL' ? 'UPS' : 'DHL';
  const currentCarrier = input.overseasCarrier || 'UPS';

  const altResult = useMemo<QuoteResult | null>(() => {
    try {
      const altFsc = altCarrier === 'DHL' ? DEFAULT_FSC_PERCENT_DHL : DEFAULT_FSC_PERCENT;
      return calculateQuote({ 
        ...input, 
        overseasCarrier: altCarrier,
        fscPercent: altFsc
      });
    } catch {
      return null;
    }
  }, [input, altCarrier]);

  if (!altResult) return null;

  const currentAmount = currentResult.totalQuoteAmount;
  const altAmount = altResult.totalQuoteAmount;
  const diff = altAmount - currentAmount;
  const diffPercent = currentAmount > 0 ? (diff / currentAmount) * 100 : 0;
  const currentIsLowest = currentAmount <= altAmount;
  const altIsLowest = altAmount < currentAmount;

  const carrierColors: Record<string, string> = {
    UPS: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    DHL: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-emax-500" />
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
            {t('quote.carrierComparison')}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {showUSD && (
            <button
              onClick={() => setShowKRW(prev => !prev)}
              className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-emax-600 dark:text-gray-400 dark:hover:text-emax-300 transition-colors"
              title="Toggle currency"
            >
              <ArrowUpDown className="w-3 h-3" />
              {showKRW ? 'KRW' : 'USD'}
            </button>
          )}
          {/* Comparison PDF hidden — use main PDF button instead */}
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
        <CarrierColumn
          carrier={currentCarrier}
          result={currentResult}
          showKRW={showKRW}
          isCurrent={true}
          isLowest={currentIsLowest}
          colorClass={carrierColors[currentCarrier] || ''}
          onSelect={() => {}}
        />
        <CarrierColumn
          carrier={altCarrier}
          result={altResult}
          showKRW={showKRW}
          isCurrent={false}
          isLowest={altIsLowest}
          colorClass={carrierColors[altCarrier] || ''}
          diff={diff}
          diffPercent={diffPercent}
          exchangeRate={input.exchangeRate}
          onSelect={() => onSwitchCarrier(altCarrier as 'UPS' | 'DHL')}
        />
      </div>
    </div>
  );
};

interface CarrierColumnProps {
  carrier: string;
  result: QuoteResult;
  showKRW: boolean;
  isCurrent: boolean;
  isLowest: boolean;
  colorClass: string;
  diff?: number;
  diffPercent?: number;
  exchangeRate?: number;
  onSelect: () => void;
}

const CarrierColumn: React.FC<CarrierColumnProps> = ({ carrier, result, showKRW, isCurrent, isLowest, diff, diffPercent, exchangeRate = 1400, onSelect }) => {
  return (
    <div className={`p-4 ${isCurrent ? 'bg-emax-50/50 dark:bg-emax-900/10' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-900 dark:text-white">{carrier}</span>
        <div className="flex items-center gap-1">
          {isLowest && (
            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
              Lowest
            </span>
          )}
          {isCurrent ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emax-600 dark:text-emax-400 bg-emax-100 dark:bg-emax-900/30 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Selected
            </span>
          ) : (
            <button
              onClick={onSelect}
              className="text-[10px] font-semibold text-gray-500 hover:text-emax-600 dark:text-gray-400 dark:hover:text-emax-400 bg-gray-100 hover:bg-emax-50 dark:bg-gray-700 dark:hover:bg-emax-900/30 px-2 py-0.5 rounded-full transition-colors"
            >
              Switch
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Quote</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {showKRW ? formatKRW(result.totalQuoteAmount) : formatUSDInt(result.totalQuoteAmountUSD)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Zone</span>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{result.appliedZone}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Transit</span>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{result.transitTime}</p>
          </div>
        </div>
        {!isCurrent && diff !== undefined && diffPercent !== undefined && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-md text-center ${
            diff < 0
              ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
              : diff > 0
                ? 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                : 'text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800'
          }`}>
            {diff < 0 ? '' : diff > 0 ? '+' : ''}{showKRW ? formatKRW(diff) : formatUSDInt(diff / exchangeRate)} ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
          </div>
        )}
      </div>
    </div>
  );
};
