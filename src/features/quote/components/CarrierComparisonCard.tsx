import React, { useMemo, useState } from 'react';
import { QuoteInput, QuoteResult } from '@/types';
import { calculateQuote } from '@/features/quote/services/calculationService';
import { formatKRW, formatUSDInt } from '@/lib/format';
import { ArrowRightLeft, Check, ArrowUpDown } from 'lucide-react';
import {
  DEFAULT_FSC_PERCENT,
  DEFAULT_FSC_PERCENT_DHL,
  DEFAULT_FSC_PERCENT_FEDEX,
} from '@/config/rates';
import { MAX_DISCOUNT_PERCENT } from '@/config/business-rules';
import { useLanguage } from '@/contexts/LanguageContext';

export type ComparableCarrier = 'UPS' | 'DHL' | 'FEDEX';

const COMPARABLE_CARRIERS: ComparableCarrier[] = ['UPS', 'DHL', 'FEDEX'];

type CarrierDiscountOverrides = Partial<Record<ComparableCarrier, number>>;

function defaultFsc(carrier: ComparableCarrier): number {
  if (carrier === 'DHL') return DEFAULT_FSC_PERCENT_DHL;
  if (carrier === 'FEDEX') return DEFAULT_FSC_PERCENT_FEDEX;
  return DEFAULT_FSC_PERCENT;
}

function clampDiscount(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), MAX_DISCOUNT_PERCENT);
}

function isComparable(carrier: string): carrier is ComparableCarrier {
  return carrier === 'UPS' || carrier === 'DHL' || carrier === 'FEDEX';
}

interface Props {
  input: QuoteInput;
  currentResult: QuoteResult;
  isKorean?: boolean;
  onSwitchCarrier: (carrier: ComparableCarrier, discountPercent: number) => void;
  /** Syncs the main quote discount when the selected carrier’s discount is edited here. */
  onDiscountChange?: (discountPercent: number) => void;
  showUSD?: boolean;
  hideMargin?: boolean;
}

type CarrierQuote = {
  carrier: ComparableCarrier;
  result: QuoteResult;
  discountPercent: number;
};

/**
 * Among UPS / DHL / FedEx, show the two cheapest quotes.
 * Each carrier has its own Discount % — changing any one re-ranks the top 2.
 */
export const CarrierComparisonCard: React.FC<Props> = ({
  input,
  isKorean = false,
  onSwitchCarrier,
  onDiscountChange,
  showUSD = false,
}) => {
  const [showKRW, setShowKRW] = useState(!showUSD ? true : isKorean);
  const { t } = useLanguage();
  const selectedCarrier = input.overseasCarrier || 'UPS';
  const baseDiscount = clampDiscount(input.discountPercent ?? 0);

  // Per-carrier overrides for non-selected carriers. Selected always follows input.discountPercent.
  const [overrides, setOverrides] = useState<CarrierDiscountOverrides>({});

  const ranked = useMemo<CarrierQuote[]>(() => {
    const quotes: CarrierQuote[] = [];
    const discountOf = (carrier: ComparableCarrier): number => {
      if (isComparable(selectedCarrier) && carrier === selectedCarrier) {
        return baseDiscount;
      }
      return overrides[carrier] ?? baseDiscount;
    };

    for (const carrier of COMPARABLE_CARRIERS) {
      try {
        const discountPercent = discountOf(carrier);
        const result = calculateQuote({
          ...input,
          overseasCarrier: carrier,
          fscPercent: defaultFsc(carrier),
          discountPercent,
        });
        quotes.push({ carrier, result, discountPercent });
      } catch {
        /* skip carrier that fails for this route */
      }
    }

    return quotes.sort((a, b) => a.result.totalQuoteAmount - b.result.totalQuoteAmount);
  }, [input, selectedCarrier, baseDiscount, overrides]);

  const topTwo = ranked.slice(0, 2);
  const third = ranked[2];

  if (topTwo.length < 2) return null;

  const [left, right] = topTwo;
  const leftAmount = left.result.totalQuoteAmount;
  const rightAmount = right.result.totalQuoteAmount;
  const diff = rightAmount - leftAmount;
  const diffPercent = leftAmount > 0 ? (diff / leftAmount) * 100 : 0;

  const setCarrierDiscount = (carrier: ComparableCarrier, value: number) => {
    const next = clampDiscount(value);
    if (isComparable(selectedCarrier) && carrier === selectedCarrier) {
      onDiscountChange?.(next);
      return;
    }
    setOverrides((prev) => ({ ...prev, [carrier]: next }));
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm'>
      <div className='px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <ArrowRightLeft className='w-4 h-4 text-emax-500' />
          <h4 className='text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider'>
            {t('quote.carrierComparison')}
          </h4>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-[10px] text-gray-400 dark:text-gray-500'>
            {t('quote.topTwoOfThree')}
          </span>
          {showUSD && (
            <button
              onClick={() => setShowKRW((prev) => !prev)}
              className='flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-emax-600 dark:text-gray-400 dark:hover:text-emax-300 transition-colors'
              title={t('quote.toggleCurrency')}
            >
              <ArrowUpDown className='w-3 h-3' />
              {showKRW ? 'KRW' : 'USD'}
            </button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700'>
        <CarrierColumn
          carrier={left.carrier}
          result={left.result}
          discountPercent={left.discountPercent}
          onDiscountChange={(v) => setCarrierDiscount(left.carrier, v)}
          showKRW={showKRW}
          isCurrent={selectedCarrier === left.carrier}
          isLowest
          onSelect={() => onSwitchCarrier(left.carrier, left.discountPercent)}
          t={t}
        />
        <CarrierColumn
          carrier={right.carrier}
          result={right.result}
          discountPercent={right.discountPercent}
          onDiscountChange={(v) => setCarrierDiscount(right.carrier, v)}
          showKRW={showKRW}
          isCurrent={selectedCarrier === right.carrier}
          isLowest={false}
          diff={diff}
          diffPercent={diffPercent}
          exchangeRate={input.exchangeRate}
          onSelect={() => onSwitchCarrier(right.carrier, right.discountPercent)}
          t={t}
        />
      </div>

      {third && (
        <div className='px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/20'>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2 text-xs'>
            <span className='text-gray-500 dark:text-gray-400'>{t('quote.alsoCompared')}</span>
            <span className='font-bold text-gray-800 dark:text-gray-200'>{third.carrier}</span>
            <label className='inline-flex items-center gap-1 text-gray-500 dark:text-gray-400'>
              <span>{t('quote.discount')}</span>
              <input
                type='number'
                min={0}
                max={MAX_DISCOUNT_PERCENT}
                step={0.1}
                value={third.discountPercent}
                onChange={(e) => setCarrierDiscount(third.carrier, Number(e.target.value))}
                className='w-16 px-1.5 py-0.5 text-right text-xs font-semibold rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                inputMode='decimal'
                aria-label={`${third.carrier} ${t('quote.discount')}`}
              />
              <span>%</span>
            </label>
            <span className='font-semibold text-gray-700 dark:text-gray-300'>
              {showKRW
                ? formatKRW(third.result.totalQuoteAmount)
                : formatUSDInt(third.result.totalQuoteAmountUSD)}
            </span>
            {selectedCarrier === third.carrier ? (
              <span className='text-[10px] font-semibold text-emax-600 dark:text-emax-400'>
                {t('quote.selected')}
              </span>
            ) : (
              <button
                type='button'
                onClick={() => onSwitchCarrier(third.carrier, third.discountPercent)}
                className='text-[10px] font-semibold text-gray-500 hover:text-emax-600 dark:text-gray-400 dark:hover:text-emax-400 bg-gray-100 hover:bg-emax-50 dark:bg-gray-700 dark:hover:bg-emax-900/30 px-2 py-0.5 rounded-full transition-colors'
              >
                {t('quote.switch')}
              </button>
            )}
          </div>
          <p className='mt-1.5 text-[10px] text-gray-400 dark:text-gray-500'>
            {t('quote.discountRerankHint')}
          </p>
        </div>
      )}
    </div>
  );
};

interface CarrierColumnProps {
  carrier: ComparableCarrier;
  result: QuoteResult;
  discountPercent: number;
  onDiscountChange: (value: number) => void;
  showKRW: boolean;
  isCurrent: boolean;
  isLowest: boolean;
  diff?: number;
  diffPercent?: number;
  exchangeRate?: number;
  onSelect: () => void;
  t: ReturnType<typeof useLanguage>['t'];
}

const CarrierColumn: React.FC<CarrierColumnProps> = ({
  carrier,
  result,
  discountPercent,
  onDiscountChange,
  showKRW,
  isCurrent,
  isLowest,
  diff,
  diffPercent,
  exchangeRate = 1400,
  onSelect,
  t,
}) => {
  return (
    <div className={`p-4 ${isCurrent ? 'bg-emax-50/50 dark:bg-emax-900/10' : ''}`}>
      <div className='flex items-center justify-between mb-3'>
        <span className='text-sm font-bold text-gray-900 dark:text-white'>{carrier}</span>
        <div className='flex items-center gap-1'>
          {isLowest && (
            <span className='text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full'>
              {t('quote.lowest')}
            </span>
          )}
          {isCurrent ? (
            <span className='flex items-center gap-1 text-[10px] font-semibold text-emax-600 dark:text-emax-400 bg-emax-100 dark:bg-emax-900/30 px-2 py-0.5 rounded-full'>
              <Check className='w-3 h-3' /> {t('quote.selected')}
            </span>
          ) : (
            <button
              type='button'
              onClick={onSelect}
              className='text-[10px] font-semibold text-gray-500 hover:text-emax-600 dark:text-gray-400 dark:hover:text-emax-400 bg-gray-100 hover:bg-emax-50 dark:bg-gray-700 dark:hover:bg-emax-900/30 px-2 py-0.5 rounded-full transition-colors'
            >
              {t('quote.switch')}
            </button>
          )}
        </div>
      </div>
      <div className='space-y-2'>
        <div>
          <p className='text-xs text-gray-500 dark:text-gray-400'>{t('quote.totalQuote')}</p>
          <p className='text-lg font-bold text-gray-900 dark:text-white'>
            {showKRW
              ? formatKRW(result.totalQuoteAmount)
              : formatUSDInt(result.totalQuoteAmountUSD)}
          </p>
        </div>

        <label className='flex items-center justify-between gap-2 text-xs'>
          <span className='text-gray-500 dark:text-gray-400'>{t('quote.discount')}</span>
          <span className='inline-flex items-center gap-1'>
            <input
              type='number'
              min={0}
              max={MAX_DISCOUNT_PERCENT}
              step={0.1}
              value={discountPercent}
              onChange={(e) => onDiscountChange(Number(e.target.value))}
              className='w-16 px-1.5 py-0.5 text-right text-xs font-bold rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              inputMode='decimal'
              aria-label={`${carrier} ${t('quote.discount')}`}
            />
            <span className='text-gray-500 dark:text-gray-400'>%</span>
          </span>
        </label>

        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div>
            <span className='text-gray-500 dark:text-gray-400'>{t('quote.zone')}</span>
            <p className='font-semibold text-gray-800 dark:text-gray-200'>{result.appliedZone}</p>
          </div>
          <div>
            <span className='text-gray-500 dark:text-gray-400'>{t('quote.transit')}</span>
            <p className='font-semibold text-gray-800 dark:text-gray-200'>{result.transitTime}</p>
          </div>
        </div>
        {!isCurrent && diff !== undefined && diffPercent !== undefined && (
          <div
            className={`text-xs font-semibold px-2 py-1 rounded-md text-center ${
              diff < 0
                ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                : diff > 0
                  ? 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                  : 'text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800'
            }`}
          >
            {diff < 0 ? '' : diff > 0 ? '+' : ''}
            {showKRW ? formatKRW(diff) : formatUSDInt(diff / exchangeRate)} (
            {diffPercent > 0 ? '+' : ''}
            {diffPercent.toFixed(1)}%)
          </div>
        )}
      </div>
    </div>
  );
};
