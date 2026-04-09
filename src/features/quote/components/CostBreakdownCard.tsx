import React, { useState, useCallback } from 'react';
import { QuoteResult } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calculator, Plane, Info, Shield, Package, BoxSelect, PackageCheck, ArrowUpDown } from 'lucide-react';
import { formatKRW, formatUSD } from '@/lib/format';
import { resultStyles } from './result-styles';

interface Props {
  result: QuoteResult;
  onDiscountChange: (newDiscount: number) => void;
  discountPercent: number;
  hideMargin?: boolean;
  isKorean?: boolean;
  showUSD?: boolean;
}

export const CostBreakdownCard: React.FC<Props> = ({ result, onDiscountChange, discountPercent, hideMargin, isKorean = false, showUSD = false }) => {
  const { cardClass } = resultStyles;
  const { t } = useLanguage();
  // Admin (!hideMargin): KRW default + toggle; Member: nationality-based fixed
  const [showKRW, setShowKRW] = useState(!showUSD ? true : isKorean);

  const exchangeRate = result.totalQuoteAmountUSD > 0
    ? result.totalQuoteAmount / result.totalQuoteAmountUSD
    : 1400;

  const formatCurrency = useCallback(
    (val: number) => showKRW ? formatKRW(val) : formatUSD(val / exchangeRate),
    [showKRW, exchangeRate]
  );

  const baseRate = result.breakdown.intlBase;
  const discountAmount = result.discountAmount;
  const baseWithDiscount = baseRate - discountAmount;
  const fscAmount = result.breakdown.intlFsc;
  const packingTotal = result.breakdown.packingMaterial + result.breakdown.packingLabor + result.breakdown.packingFumigation + result.breakdown.handlingFees;

  // Derive FSC% for display
  // Derive FSC% for display
  const fscPercent = baseWithDiscount > 0 ? Math.round(fscAmount / baseWithDiscount * 1000) / 10 : 0;

  return (
      <div className={cardClass}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center transition-colors">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center text-sm">
                <Calculator className="w-4 h-4 mr-2 text-emax-500" />
                {t('quote.logisticsCost')}
            </h3>
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
              {(!hideMargin || !showUSD) && <span className="text-[10px] font-bold px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 uppercase tracking-wide">Internal</span>}
            </div>
        </div>

        <div className="p-5 space-y-6 text-sm">

            {/* 1. Base Rate + Margin + FSC */}
            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Freight Cost</h4>
                <div className="space-y-3 pl-3 border-l-2 border-dashed border-gray-200 dark:border-gray-700">

                    {/* Base Rate — Member sees Base+Margin as "Base Rate" */}
                    <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                            <Plane className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span>Base Rate{!hideMargin ? ` (${result.carrier})` : ''}</span>
                        </div>
                        <span className="font-medium">{formatCurrency((hideMargin && showUSD) ? baseWithDiscount : baseRate)}</span>
                    </div>

                    {/* Margin (on Base Rate) */}
                    {(!hideMargin || !showUSD) && (
                    <div className="flex justify-between items-center text-green-700 dark:text-green-400">
                        <div className="flex items-center">
                            <span className="mr-2 font-medium">{t('quote.discount')}</span>
                            <div className="relative rounded-md shadow-sm w-24">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={discountPercent}
                                    onChange={(e) => onDiscountChange(Number(e.target.value))}
                                    className="focus:ring-emax-500 focus:border-emax-500 block w-full text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-6 py-1 text-right font-bold"
                                    inputMode="decimal"
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 text-xs">%</div>
                            </div>
                        </div>
                        <span className="font-bold">- {formatCurrency(discountAmount)}</span>
                    </div>
                    )}

                    {/* Subtotal: Base + Margin */}
                    {(!hideMargin || !showUSD) && (
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pl-6">
                        <span>Subtotal (Base - Discount)</span>
                        <span>{formatCurrency(baseWithDiscount)}</span>
                    </div>
                    )}

                    {/* FSC on (Base + Margin) */}
                    {fscAmount > 0 && (
                    <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                        <div className="flex items-center pl-6">
                            <span>FSC ({fscPercent}%)</span>
                        </div>
                        <span className="font-medium">+ {formatCurrency(fscAmount)}</span>
                    </div>
                    )}
                </div>

                {/* Freight Subtotal */}
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 font-bold text-gray-800 dark:text-white">
                    <span className="pl-3">Freight Total</span>
                    <span>{formatCurrency(baseWithDiscount + fscAmount)}</span>
                </div>
            </div>

            {/* 2. Add-ons (separate from freight) */}
            {(packingTotal > 0 || result.breakdown.pickupInSeoul > 0 || result.breakdown.intlSurge > 0 || (result.breakdown.carrierAddOnTotal ?? 0) > 0 || result.breakdown.destDuty > 0) && (
            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Add-ons</h4>
                <div className="space-y-3 pl-3 border-l-2 border-dashed border-amber-200 dark:border-amber-700">

                    {/* Packing & Docs */}
                    {packingTotal > 0 && (
                    <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                            <PackageCheck className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span>Packing & Docs</span>
                        </div>
                        <span className="font-medium">{formatCurrency(packingTotal)}</span>
                    </div>
                    )}

                    {/* Seoul Pickup */}
                    {result.breakdown.pickupInSeoul > 0 && (
                    <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                            <BoxSelect className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span>Seoul Pickup</span>
                        </div>
                        <span className="font-medium">{formatCurrency(result.breakdown.pickupInSeoul)}</span>
                    </div>
                    )}

                    {/* Surcharges */}
                    {result.breakdown.appliedSurcharges && result.breakdown.appliedSurcharges.length > 0 && (
                      result.breakdown.appliedSurcharges.map((s) => (
                        <div key={s.code} className="flex justify-between items-center text-amber-600 dark:text-amber-500">
                            <div className="flex items-center">
                                <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>{s.nameKo || s.name} {s.chargeType === 'rate' ? `(${s.amount}%)` : ''}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(s.appliedAmount)}</span>
                        </div>
                      ))
                    )}
                    {(result.breakdown.intlManualSurge ?? 0) > 0 && (
                    <div className="flex justify-between items-center text-amber-600 dark:text-amber-500">
                        <div className="flex items-center">
                            <BoxSelect className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Manual Surge</span>
                        </div>
                        <span className="font-medium">{formatCurrency(result.breakdown.intlManualSurge!)}</span>
                    </div>
                    )}

                    {/* Carrier Add-ons */}
                    {result.breakdown.carrierAddOnDetails && result.breakdown.carrierAddOnDetails.length > 0 && (
                    <div className="flex flex-col space-y-1">
                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                            <div className="flex items-center">
                                <Package className={`w-4 h-4 mr-2 flex-shrink-0 ${result.carrier === 'UPS' ? 'text-blue-500' : 'text-yellow-500'}`} />
                                <span>{result.carrier} Add-ons</span>
                            </div>
                            <span className="font-medium">{formatCurrency(result.breakdown.carrierAddOnTotal || 0)}</span>
                        </div>
                        <div className="space-y-0.5 text-xs text-gray-500 dark:text-gray-400 pl-6">
                            {result.breakdown.carrierAddOnDetails.map((d) => (
                                <div key={d.code} className={`flex justify-between ${result.carrier === 'UPS' ? 'text-blue-700 dark:text-blue-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                                    <span>{d.nameKo} ({d.code})</span>
                                    <span>{formatCurrency(d.amount + d.fscAmount)}{d.fscAmount > 0 ? ' +FSC' : ''}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* DDP Duty */}
                    {result.breakdown.destDuty > 0 && (
                    <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                        <div className="flex items-center pl-6">
                            <span>Destination Duty</span>
                        </div>
                        <span className="font-medium">{formatCurrency(result.breakdown.destDuty)}</span>
                    </div>
                    )}
                </div>
            </div>
            )}

            {/* 3. Final Quote Price */}
            <div className="bg-emax-50 dark:bg-emax-900/20 p-4 rounded-xl border border-emax-100 dark:border-emax-800/30">
                <div className="flex justify-between items-center">
                    <span className="text-emax-900 dark:text-emax-100 font-extrabold text-lg">{t('quote.finalPrice')}</span>
                    <div className="flex flex-col items-end">
                        <span className="text-emax-900 dark:text-emax-100 font-extrabold text-lg">
                          {showKRW ? formatKRW(result.totalQuoteAmount) : (showUSD ? formatUSD(result.totalQuoteAmountUSD) : formatKRW(result.totalQuoteAmount))}
                        </span>
                        {showUSD && (
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                            ({t('quote.approx')} {showKRW ? formatUSD(result.totalQuoteAmountUSD) : formatKRW(result.totalQuoteAmount)})
                        </span>
                        )}
                    </div>
                </div>
            </div>

        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 text-xs text-gray-500 dark:text-gray-400 flex items-start transition-colors">
             <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
             <p className="leading-relaxed">
                 {t('calc.costBasis.disclaimer')}
             </p>
        </div>
      </div>
  );
};
