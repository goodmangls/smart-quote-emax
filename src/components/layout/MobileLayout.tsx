import React, { useEffect, useRef } from 'react';
import { QuoteInput, QuoteResult } from '@/types';
import { InputSection } from '@/features/quote/components/InputSection';
import { ResultSection } from '@/features/quote/components/ResultSection';
import { Moon, Sun, Monitor, RotateCcw, FileDown, ChevronDown, Globe, Scale } from 'lucide-react';
import { AdminWidgets } from '@/pages/components/AdminWidgets';
import { formatKRW, formatUSDInt } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ResolvedDiscount } from '@/api/discountRuleApi';

const LANGUAGES = [
  { code: 'en' as const, label: 'EN', flag: '🇺🇸' },
  { code: 'ko' as const, label: 'KO', flag: '🇰🇷' },
];

interface Props {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  isMobileView: boolean;
  setIsMobileView: (isMobile: boolean) => void;
  input: QuoteInput;
  setInput: React.Dispatch<React.SetStateAction<QuoteInput>>;
  result: QuoteResult | null;
  onDiscountChange: (val: number) => void;
  onDownloadPdf: () => void;
  onReset: () => void;
  scrollToResults: () => void;
  hideMargin?: boolean;
  resolvedDiscount?: ResolvedDiscount | null;
  isAdmin?: boolean;
  isKorean?: boolean;
}

export const MobileLayout: React.FC<Props> = ({
  isDarkMode,
  setIsDarkMode,
  isMobileView,
  setIsMobileView,
  input,
  setInput,
  result,
  onDiscountChange,
  onDownloadPdf,
  onReset,
  scrollToResults,
  hideMargin,
  resolvedDiscount,
  isAdmin,
  isKorean = true,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const prevCarrierRef = useRef(input.overseasCarrier);

  // Auto-scroll to results when carrier changes
  useEffect(() => {
    if (prevCarrierRef.current !== input.overseasCarrier) {
      prevCarrierRef.current = input.overseasCarrier;
      // Delay to allow result recalculation
      setTimeout(() => {
        const el = document.getElementById('result-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [input.overseasCarrier]);
  const containerClass = "max-w-[420px] mx-auto border-x border-gray-200 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900 min-h-screen transition-all duration-300";
  const headerClass = "sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center justify-between";
  const mainClass = "px-4 py-6 pb-32 space-y-8";
  const bottomBarClass = "fixed bottom-0 z-40 bg-white/90 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] w-full max-w-[420px] left-1/2 -translate-x-1/2 transition-all duration-300";

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-black flex justify-center py-0 sm:py-8 transition-colors duration-200">
      <div className={containerClass}>
        
        {/* Header */}
        <header className={headerClass}>
          <div className="flex items-center space-x-2">
             <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
               {t('nav.smartQuote')}
             </span>
          </div>

          <div className="flex items-center space-x-1">
             {/* Compact Language Switcher */}
             <div className="relative">
               <select
                 value={language}
                 onChange={(e) => setLanguage(e.target.value as 'en' | 'ko')}
                 className="appearance-none bg-transparent text-xs text-gray-500 dark:text-gray-400 pl-5 pr-4 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer focus:outline-none"
                 aria-label="Language"
               >
                 {LANGUAGES.map((l) => (
                   <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                 ))}
               </select>
               <Globe className="w-3.5 h-3.5 absolute left-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
             </div>

             {/* Reset Button */}
             <button
               onClick={onReset}
               className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors"
               aria-label="Reset Quote"
             >
                <RotateCcw className="w-4 h-4" />
             </button>

             {/* View Mode Toggle */}
             <button
               onClick={() => setIsMobileView(!isMobileView)}
               className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
               aria-label="Switch to Desktop View"
             >
                <Monitor className="w-4 h-4" />
             </button>

             {/* Dark Mode Toggle */}
             <button
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
               aria-label="Toggle Dark Mode"
             >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
          </div>
        </header>

        {/* Main Content */}
        <main className={mainClass}>
          <div className="flex flex-col space-y-8">
              {/* Left Column: Input */}
              <div>
                 <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('calc.shipmentConfig')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('calc.shipmentConfigDesc')}</p>
                 </div>
                 
                 <InputSection 
                   input={input} 
                   onChange={setInput} 
                   onDiscountChange={onDiscountChange}
                   isMobileView={true} 
                   effectiveDiscountPercent={result?.discountPercent} 
                   hideMargin={hideMargin} 
                   intlBase={result?.breakdown.intlBase} 
                   billableWeight={result?.billableWeight} 
                   resolvedDiscount={resolvedDiscount} 
                 />
                 {isAdmin && <AdminWidgets />}
              </div>

              {/* Right Column: Result */}
              <div id="result-section">
                 {result && (
                  <ResultSection
                    result={result}
                    input={input}
                    hideMargin={hideMargin}
                    onDiscountChange={onDiscountChange}
                    onDownloadPdf={onDownloadPdf}
                    onSwitchCarrier={(carrier) => setInput(prev => ({ ...prev, overseasCarrier: carrier }))}
                    discountPercent={input.discountPercent}
                    isKorean={isKorean}
                  />
                 )}
              </div>
          </div>
        </main>

        {/* Sticky Bottom Bar */}
        {result && (
          <div className={bottomBarClass}>
              {/* Top row: carrier badge + billable weight */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                  result.carrier === 'UPS' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                  result.carrier === 'DHL' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                }`}>
                  {result.carrier}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                  <Scale className="w-3 h-3" />
                  {result.billableWeight.toFixed(1)}kg
                </span>
              </div>

              {/* Main row: price + action buttons */}
              <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('calc.totalEstimate')}</p>
                    <div className="flex items-baseline space-x-1">
                      {isKorean ? (
                        <>
                          <p className="text-lg font-bold text-jways-700 dark:text-jways-400">
                            {formatKRW(result.totalQuoteAmount)}
                          </p>
                          <span className="text-[10px] text-gray-400">
                            ({formatUSDInt(result.totalQuoteAmountUSD)})
                          </span>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-jways-700 dark:text-jways-400">
                            {formatUSDInt(result.totalQuoteAmountUSD)}
                          </p>
                          <span className="text-[10px] text-gray-400">
                            ({formatKRW(result.totalQuoteAmount)})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* PDF Download */}
                    <button
                      onClick={onDownloadPdf}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Download PDF"
                    >
                      <FileDown className="w-4.5 h-4.5" />
                    </button>
                    {/* View Details */}
                    <button
                      onClick={scrollToResults}
                      className="flex items-center bg-jways-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg shadow-jways-600/25 hover:bg-jways-500 active:scale-95 transition-all"
                    >
                      {t('calc.viewDetails')}
                      <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};
