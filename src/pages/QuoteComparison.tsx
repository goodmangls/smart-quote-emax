import React, { useState, useMemo, useEffect } from 'react';
import { QuoteInput, Incoterm, PackingType, CargoItem, CostBreakdown } from '../types';
import { calculateQuote } from '@/features/quote/services/calculationService';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DEFAULT_EXCHANGE_RATE,
  DEFAULT_FSC_PERCENT,
  DEFAULT_FSC_PERCENT_DHL,
  DEFAULT_FSC_PERCENT_FEDEX,
  DEFAULT_FSC_PERCENT_OCS,
} from '@/config/rates';
import { RouteSection } from '@/features/quote/components/RouteSection';
import { CargoSection } from '@/features/quote/components/CargoSection';
import { Scale, TrendingDown, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatNum } from '@/lib/format';

const INITIAL_CARGO: CargoItem[] = [
  { id: '1', width: 10, length: 10, height: 10, weight: 1, quantity: 1 },
];

/** International surcharges excluding base net rate and FSC (war risk, surge, carrier add-ons, system surcharges). */
function overseasSurchargesExBaseFsc(bd: CostBreakdown): number {
  return (
    bd.intlWarRisk + bd.intlSurge + (bd.carrierAddOnTotal ?? 0) + (bd.intlSystemSurcharge ?? 0)
  );
}

interface ComparisonSlot {
  carrier: NonNullable<QuoteInput['overseasCarrier']>;
  discount: number;
}

/** Default FSC% per overseas carrier — mirrors `QuoteCalculator` carrier-switch behavior. */
function defaultFscForCarrier(carrier: NonNullable<QuoteInput['overseasCarrier']>): number {
  switch (carrier) {
    case 'DHL':
      return DEFAULT_FSC_PERCENT_DHL;
    case 'FEDEX':
      return DEFAULT_FSC_PERCENT_FEDEX;
    case 'OCS':
      return DEFAULT_FSC_PERCENT_OCS;
    case 'EMAX':
      return 0;
    default:
      return DEFAULT_FSC_PERCENT;
  }
}

const INITIAL_SLOTS: ComparisonSlot[] = [
  { carrier: 'UPS', discount: 0 },
  { carrier: 'DHL', discount: 0 },
  { carrier: 'FEDEX', discount: 0 },
];

const QuoteComparison: React.FC = () => {
  const { t } = useLanguage();

  const [isNarrowViewport, setIsNarrowViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsNarrowViewport(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Common inputs
  const [routeData, setRouteData] = useState({
    originCountry: 'KR',
    destinationCountry: 'US',
    destinationZip: '',
    shippingMode: 'Door-to-Door' as const,
    incoterm: Incoterm.DAP,
  });

  const [items, setItems] = useState<CargoItem[]>(INITIAL_CARGO);
  const [exchangeRate] = useState(DEFAULT_EXCHANGE_RATE);

  // Slots
  const [slots, setSlots] = useState<ComparisonSlot[]>(INITIAL_SLOTS);

  const results = useMemo(() => {
    return slots.map((slot) => {
      const input: QuoteInput = {
        ...routeData,
        items,
        exchangeRate,
        fscPercent: defaultFscForCarrier(slot.carrier),
        dutyTaxEstimate: 0,
        overseasCarrier: slot.carrier,
        discountPercent: slot.discount,
        packingType: PackingType.NONE,
      };
      try {
        return calculateQuote(input);
      } catch {
        return null;
      }
    });
  }, [routeData, items, exchangeRate, slots]);

  const updateSlot = (index: number, updates: Partial<ComparisonSlot>) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handleUpdateItems = (newItems: CargoItem[]) => {
    setItems(newItems);
  };

  const handleReset = () => {
    setRouteData({
      originCountry: 'KR',
      destinationCountry: 'US',
      destinationZip: '',
      shippingMode: 'Door-to-Door' as const,
      incoterm: Incoterm.DAP,
    });
    setItems(INITIAL_CARGO);
    setSlots(INITIAL_SLOTS);
  };

  const bestPriceIndex = useMemo(() => {
    let min = Infinity;
    let index = -1;
    results.forEach((r, i) => {
      if (r && r.totalQuoteAmount < min) {
        min = r.totalQuoteAmount;
        index = i;
      }
    });
    return index;
  }, [results]);

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200'>
      <Header />

      <main className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 pb-10 sm:pb-8 space-y-6 sm:space-y-8 [padding-bottom:max(2rem,env(safe-area-inset-bottom,0px))]'>
        {/* Page Title & Actions */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0'>
            <h1 className='text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-start sm:items-center gap-2 sm:gap-3 tracking-tight'>
              <div className='shrink-0 p-1.5 sm:p-2 bg-emax-600 rounded-xl shadow-lg shadow-emax-600/20'>
                <Scale className='w-6 h-6 sm:w-8 sm:h-8 text-white' aria-hidden />
              </div>
              <span className='leading-tight pt-0.5'>{t('nav.compare')}</span>
            </h1>
            <p className='mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium leading-relaxed'>
              {t('compare.subtitle')}
            </p>
          </div>
          <button
            type='button'
            onClick={handleReset}
            className='flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-emax-600 dark:hover:text-emax-400 hover:border-emax-600 dark:hover:border-emax-600 active:scale-[0.98] transition-all shadow-sm'
          >
            <RefreshCw className='w-4 h-4' />
            {t('compare.reset')}
          </button>
        </div>

        {/* Inputs Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8'>
          <div className='space-y-6'>
            <RouteSection
              input={{
                ...routeData,
                items,
                exchangeRate,
                fscPercent: DEFAULT_FSC_PERCENT,
                dutyTaxEstimate: 0,
                discountPercent: 0,
                packingType: PackingType.NONE,
                overseasCarrier: 'UPS',
              }}
              onFieldChange={(key, value) => {
                setRouteData((prev) => ({ ...prev, [key]: value }));
              }}
              isMobileView={isNarrowViewport}
            />
          </div>
          <div className='space-y-6'>
            <CargoSection
              items={items}
              onChange={handleUpdateItems}
              isMobileView={isNarrowViewport}
            />
          </div>
        </div>

        <p className='md:hidden text-center text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium -mt-2'>
          {t('compare.mobile.swipeSlots')}
        </p>

        {/* Comparison Slots: horizontal snap on small screens, grid on md+ */}
        <div
          className='flex md:grid md:grid-cols-3 md:gap-6 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-1 -mx-1 px-1 md:mx-0 md:px-0 touch-pan-x scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]'
          role='region'
          aria-label={t('compare.slotsRegionAria')}
        >
          {slots.map((slot, idx) => {
            const result = results[idx];
            const isBest = idx === bestPriceIndex && result;

            return (
              <div
                key={idx}
                className={`flex-none w-[min(20rem,calc(100vw-2.5rem))] max-w-[22rem] snap-center md:snap-none md:w-auto md:max-w-none relative bg-white dark:bg-gray-900 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  isBest
                    ? 'border-emax-500 shadow-2xl ring-1 ring-emax-500 ring-opacity-20 md:-translate-y-1'
                    : 'border-gray-200 dark:border-gray-800 shadow-md'
                }`}
              >
                {isBest && (
                  <div className='absolute top-0 right-0 bg-emax-500 text-white px-3 sm:px-4 py-1.5 rounded-bl-xl text-[10px] sm:text-xs font-black flex items-center gap-1.5 z-10 shadow-lg'>
                    <TrendingDown className='w-3.5 h-3.5' />
                    {t('compare.bestPrice')}
                  </div>
                )}

                <div className='p-4 sm:p-6 space-y-5 sm:space-y-6'>
                  {/* Slot Configuration */}
                  <div className='space-y-5'>
                    <div>
                      <label className='block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mb-2'>
                        {t('compare.carrierLabel')}
                      </label>
                      <select
                        value={slot.carrier}
                        onChange={(e) =>
                          updateSlot(idx, {
                            carrier: e.target.value as ComparisonSlot['carrier'],
                          })
                        }
                        aria-label={t('compare.carrierLabel')}
                        className='w-full min-h-[44px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-base sm:text-sm font-bold focus:ring-2 focus:ring-emax-500 transition-all outline-none'
                      >
                        <option value='UPS'>{t('compare.carrierUps')}</option>
                        <option value='DHL'>{t('compare.carrierDhl')}</option>
                        <option value='FEDEX'>{t('compare.carrierFedex')}</option>
                        <option value='EMAX'>{t('compare.carrierEmax')}</option>
                        <option value='OCS'>{t('compare.carrierOcs')}</option>
                      </select>
                    </div>

                    <div>
                      <div className='flex justify-between items-end mb-2'>
                        <label className='block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em]'>
                          {t('compare.discountLabel')}
                        </label>
                        <span className='text-sm font-black text-emax-600'>{slot.discount}%</span>
                      </div>
                      <input
                        type='range'
                        min='0'
                        max='90'
                        step='1'
                        value={slot.discount}
                        onChange={(e) => updateSlot(idx, { discount: parseInt(e.target.value) })}
                        aria-valuetext={`${slot.discount}%`}
                        className='w-full h-3 sm:h-2 my-2 sm:my-0 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emax-600 touch-none'
                      />
                      <div className='flex justify-between text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-tighter'>
                        <span>{t('compare.discountMin')}</span>
                        <span>{t('compare.discountMax')}</span>
                      </div>
                    </div>
                  </div>

                  <div className='h-px bg-gradient-to-r from-transparent via-gray-100 dark:via-gray-800 to-transparent' />

                  {/* Pricing Result */}
                  {result ? (
                    <div className='space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700'>
                      <div className='text-center py-2'>
                        <p className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1'>
                          {t('compare.finalQuote')}
                        </p>
                        <h2
                          className={`text-2xl sm:text-3xl font-black tabular-nums ${isBest ? 'text-emax-600 dark:text-emax-400' : 'text-gray-900 dark:text-white'} tracking-tight break-all sm:break-normal`}
                        >
                          ₩{formatNum(result.totalQuoteAmount)}
                        </h2>
                      </div>

                      <div className='bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-700/50'>
                        <div className='flex justify-between text-xs'>
                          <span className='text-gray-500 dark:text-gray-400 font-medium'>
                            {t('compare.rowBase')}
                          </span>
                          <span className='font-bold text-gray-700 dark:text-gray-300'>
                            ₩{formatNum(result.breakdown.intlBase)}
                          </span>
                        </div>
                        <div className='flex justify-between text-xs'>
                          <span className='text-gray-500 dark:text-gray-400 font-medium'>
                            {t('compare.rowFsc')}
                          </span>
                          <span className='font-bold text-blue-600 dark:text-blue-400'>
                            ₩{formatNum(result.breakdown.intlFsc)}
                          </span>
                        </div>
                        <div className='flex justify-between text-xs'>
                          <span className='text-gray-500 dark:text-gray-400 font-medium'>
                            {t('compare.rowOther')}
                          </span>
                          <span className='font-bold text-gray-700 dark:text-gray-300'>
                            ₩{formatNum(overseasSurchargesExBaseFsc(result.breakdown))}
                          </span>
                        </div>
                        <div className='pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center'>
                          <span className='text-[10px] font-black text-gray-400 uppercase tracking-tighter'>
                            {t('compare.rowChargeable')}
                          </span>
                          <span className='text-sm font-black text-gray-900 dark:text-white'>
                            {result.billableWeight} kg
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center gap-3 text-[10px] font-medium text-gray-400 bg-gray-50/50 dark:bg-gray-800/20 p-3 rounded-lg border border-gray-100/50 dark:border-gray-700/30'>
                        <Info className='w-4 h-4 text-emax-500 flex-shrink-0' />
                        <span className='leading-relaxed'>
                          {result.transitTime || t('compare.transitUnknown')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className='py-16 flex flex-col items-center justify-center text-center space-y-4'>
                      <div className='p-3 bg-gray-50 dark:bg-gray-800 rounded-full'>
                        <AlertTriangle className='w-8 h-8 text-gray-300 dark:text-gray-600' />
                      </div>
                      <p className='text-sm font-bold text-gray-400 leading-relaxed text-center whitespace-pre-line'>
                        {t('compare.unavailable')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Comparison Table */}
        <div className='bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl'>
          <div className='px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h3 className='font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-tight text-sm sm:text-base'>
              <Scale className='w-4 h-4 sm:w-5 sm:h-5 text-emax-600 shrink-0' />
              {t('compare.table.title')}
            </h3>
            <span className='text-[10px] font-bold text-gray-400 bg-white dark:bg-gray-900 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 uppercase tracking-widest w-fit'>
              {t('compare.table.live')}
            </span>
          </div>
          <div className='overflow-x-auto -mx-px [scrollbar-width:thin]'>
            <table className='w-full min-w-[520px] sm:min-w-0 text-xs sm:text-sm text-left'>
              <thead>
                <tr className='border-b border-gray-100 dark:border-gray-800'>
                  <th className='px-3 sm:px-8 py-3 sm:py-5 font-black text-gray-400 uppercase tracking-widest text-[10px] min-w-[7rem] sm:w-64'>
                    {t('compare.table.metric')}
                  </th>
                  {slots.map((s, i) => (
                    <th
                      key={i}
                      className={`px-3 sm:px-8 py-3 sm:py-5 font-black text-center whitespace-nowrap min-w-[5.75rem] ${i === bestPriceIndex ? 'text-emax-600 bg-emax-50/30 dark:bg-emax-900/10' : 'text-gray-900 dark:text-white'}`}
                    >
                      {s.carrier} ({s.discount}%)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50 dark:divide-gray-800'>
                <tr className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors'>
                  <td className='px-3 sm:px-8 py-3 sm:py-5 text-gray-500 dark:text-gray-400 font-bold'>
                    {t('compare.table.chargeable')}
                  </td>
                  {results.map((r, i) => (
                    <td
                      key={i}
                      className={`px-3 sm:px-8 py-3 sm:py-5 text-center tabular-nums font-black ${i === bestPriceIndex ? 'bg-emax-50/20 dark:bg-emax-900/5 text-gray-900 dark:text-white' : 'text-gray-500'}`}
                    >
                      {r ? `${r.billableWeight} kg` : '-'}
                    </td>
                  ))}
                </tr>
                <tr className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors'>
                  <td className='px-3 sm:px-8 py-3 sm:py-5 text-gray-500 dark:text-gray-400 font-bold'>
                    {t('compare.table.intlBase')}
                  </td>
                  {results.map((r, i) => (
                    <td
                      key={i}
                      className={`px-3 sm:px-8 py-3 sm:py-5 text-center tabular-nums font-bold ${i === bestPriceIndex ? 'bg-emax-50/20 dark:bg-emax-900/5 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      {r ? `₩${formatNum(r.breakdown.intlBase)}` : '-'}
                    </td>
                  ))}
                </tr>
                <tr className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors'>
                  <td className='px-3 sm:px-8 py-3 sm:py-5 text-gray-500 dark:text-gray-400 font-bold'>
                    {t('compare.table.fsc')}
                  </td>
                  {results.map((r, i) => (
                    <td
                      key={i}
                      className={`px-3 sm:px-8 py-3 sm:py-5 text-center tabular-nums font-bold ${i === bestPriceIndex ? 'bg-emax-50/20 dark:bg-emax-900/5 text-blue-600' : 'text-blue-500/70'}`}
                    >
                      {r ? `₩${formatNum(r.breakdown.intlFsc)}` : '-'}
                    </td>
                  ))}
                </tr>
                <tr className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors'>
                  <td className='px-3 sm:px-8 py-3 sm:py-5 text-gray-500 dark:text-gray-400 font-bold'>
                    {t('compare.table.addons')}
                  </td>
                  {results.map((r, i) => (
                    <td
                      key={i}
                      className={`px-3 sm:px-8 py-3 sm:py-5 text-center tabular-nums font-bold ${i === bestPriceIndex ? 'bg-emax-50/20 dark:bg-emax-900/5 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      {r ? `₩${formatNum(overseasSurchargesExBaseFsc(r.breakdown))}` : '-'}
                    </td>
                  ))}
                </tr>
                <tr className='bg-gray-50/50 dark:bg-gray-800/30 border-t-2 border-gray-100 dark:border-gray-800'>
                  <td className='px-3 sm:px-8 py-4 sm:py-6 text-gray-900 dark:text-white font-black text-sm sm:text-base'>
                    {t('compare.table.grandTotal')}
                  </td>
                  {results.map((r, i) => (
                    <td
                      key={i}
                      className={`px-3 sm:px-8 py-4 sm:py-6 text-center tabular-nums text-base sm:text-xl font-black ${i === bestPriceIndex ? 'text-emax-600 bg-emax-50/40 dark:bg-emax-900/20' : 'text-gray-900 dark:text-white'}`}
                    >
                      {r ? `₩${formatNum(r.totalQuoteAmount)}` : '-'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuoteComparison;
