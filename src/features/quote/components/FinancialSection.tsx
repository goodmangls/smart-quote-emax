import React from 'react';
import { QuoteInput } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { UPS_FSC_URL, DHL_FSC_URL, FEDEX_FSC_URL } from '@/config/rates';
import { TrendingUp, ExternalLink, Target } from 'lucide-react';
import { inputStyles } from './input-styles';
import type { ResolvedDiscount } from '@/api/discountRuleApi';

interface Props {
  input: QuoteInput;
  onFieldChange: <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => void;
  isMobileView: boolean;
  effectiveDiscountPercent?: number;
  hideMargin?: boolean;
  resolvedDiscount?: ResolvedDiscount | null;
  onDiscountChange?: (val: number) => void;
  showUSD?: boolean;
}

export const FinancialSection: React.FC<Props> = ({ input, onFieldChange, isMobileView = false, effectiveDiscountPercent, hideMargin, resolvedDiscount, onDiscountChange, showUSD = true }) => {
  const { inputClass, labelClass, grayCardClass } = inputStyles;
  const ic = inputClass(isMobileView);
  const lc = labelClass(isMobileView);
  const { t, language } = useLanguage();
  const isKo = language === 'ko';

  const financialGrid = `grid grid-cols-1 ${!isMobileView ? 'sm:grid-cols-3' : 'grid-cols-2'} gap-3`;

  return (
    <div className={grayCardClass}>
      <div className="flex items-center justify-between mb-4">
         <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider flex items-center">
             <TrendingUp className="w-4 h-4 mr-2 text-emax-600 dark:text-emax-400" />
              {showUSD 
                ? t('calc.section.financial')
                : isKo 
                  ? '재무 항목 적용' 
                  : 'Financial Application'
              }
         </h3>
         <div className="flex items-center gap-3">
             <a
                 href={UPS_FSC_URL}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-[10px] sm:text-xs text-gray-500 hover:text-blue-600 flex items-center transition-colors"
                 title="Check Official UPS FSC"
             >
                 UPS FSC <ExternalLink className="w-3 h-3 ml-1" />
             </a>
             <a
                 href={DHL_FSC_URL}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-[10px] sm:text-xs text-gray-500 hover:text-yellow-600 flex items-center transition-colors"
                 title="Check Official DHL Fuel Surcharge"
             >
                 DHL FSC <ExternalLink className="w-3 h-3 ml-1" />
             </a>
             <a
                 href={FEDEX_FSC_URL}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-[10px] sm:text-xs text-gray-500 hover:text-orange-600 flex items-center transition-colors"
                 title="Check Official FedEx Fuel Surcharge"
             >
                 FedEx FSC <ExternalLink className="w-3 h-3 ml-1" />
             </a>
         </div>
      </div>
      <div className={financialGrid}>
         {showUSD && (
            <div>
                <label className={lc}>Ex. Rate (KRW/USD)</label>
                <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm font-bold">&#8361;</span>
                    </div>
                    <input
                        type="number"
                        step="any"
                        min="1"
                        value={input.exchangeRate}
                        onChange={(e) => { const v = Number(e.target.value); onFieldChange('exchangeRate', isNaN(v) || v < 1 ? 1 : v); }}
                        className={`${ic} pl-8 pr-20`}
                        placeholder="1430"
                        inputMode="decimal"
                        autoComplete="off"
                    />
                </div>
                <p className="mt-1 text-[9px] text-gray-400 dark:text-gray-500">
                  {t('calc.financial.exchangeHint')}
                </p>
            </div>
          )}
         <div>
             <label className={lc}>FSC %</label>
             <div className="relative rounded-lg shadow-sm">
                 <input
                     type="number"
                     step="0.01"
                     min="0"
                     value={input.fscPercent}
                     onChange={(e) => { const v = Number(e.target.value); onFieldChange('fscPercent', isNaN(v) || v < 0 ? 0 : v); }}
                     className={`${ic} pr-20`}
                     placeholder="30.25"
                     inputMode="decimal"
                     autoComplete="off"
                 />
                 <div className="pointer-events-none absolute inset-y-0 right-16 flex items-center">
                   <span className="text-gray-500 sm:text-sm font-bold">%</span>
                 </div>
             </div>
             <p className="mt-1 text-[9px] text-gray-400 dark:text-gray-500">
               {t('calc.financial.fscHint')}
             </p>
         </div>
         {(!hideMargin || !showUSD) && (
             <div>
                 <label className={lc}>Discount (%)</label>
                 <div className="relative rounded-lg shadow-sm">
                     <input
                         type="number"
                         step="0.1"
                         min="0"
                         value={input.discountPercent}
                         onChange={(e) => {
                  const v = Number(e.target.value);
                  const newDiscount = isNaN(v) || v < 0 ? 0 : Math.min(v, 99.9);
                  if (onDiscountChange) {
                    onDiscountChange(newDiscount);
                  } else {
                    onFieldChange('discountPercent', newDiscount);
                  }
                }}
                         className={`${ic} pr-16`}
                         placeholder="15"
                         inputMode="decimal"
                         autoComplete="off"
                     />
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                         <span className="text-gray-500 sm:text-sm font-bold">%</span>
                     </div>
                 </div>
                 {effectiveDiscountPercent !== undefined && effectiveDiscountPercent !== input.discountPercent && (
                  <p className="mt-1 text-[10px] text-emax-600 font-medium">
                    Applied: {effectiveDiscountPercent}%
                  </p>
                )}
                {resolvedDiscount && showUSD && (
                   <div className={`mt-1.5 flex items-start gap-1.5 text-[9px] leading-relaxed ${
                     resolvedDiscount.fallback
                       ? 'text-gray-400 dark:text-gray-500'
                       : 'text-emerald-600 dark:text-emerald-400'
                   }`}>
                     <Target className="w-3 h-3 flex-shrink-0 mt-0.5" />
                     <span>
                       {resolvedDiscount.matchedRule
                         ? `${isKo ? '적용 룰' : 'Rule'}: ${resolvedDiscount.matchedRule.name} → ${resolvedDiscount.discountPercent}%`
                         : `${isKo ? '기본 할인 적용' : 'Default discount'}: ${resolvedDiscount.discountPercent}%`
                       }
                     </span>
                   </div>
                 )}
             </div>
         )}
      </div>
    </div>
  );
};
