import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calculator, ArrowRightLeft } from 'lucide-react';
import { useExchangeRates } from '@/features/dashboard/hooks/useExchangeRates';

export const ExchangeRateCalculatorWidget: React.FC = () => {
  const { t } = useLanguage();
  const { data, loading } = useExchangeRates();

  const [amount, setAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('KRW');

  const currencies = useMemo(() => {
    return [
      { currency: 'KRW', flag: '🇰🇷', rate: 1 },
      ...data,
    ];
  }, [data]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const currentResult = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || currencies.length === 1) return 0;

    const fromRate = currencies.find(c => c.currency === fromCurrency)?.rate || 1;
    const toRate = currencies.find(c => c.currency === toCurrency)?.rate || 1;

    // Convert fromCurrency to KRW, then KRW to toCurrency
    const amountInKrw = numAmount * fromRate;
    const finalAmount = amountInKrw / toRate;
    
    return finalAmount;
  }, [amount, fromCurrency, toCurrency, currencies]);

  return (
    <div className="bg-white dark:bg-jways-800 rounded-2xl shadow-sm border border-gray-100 dark:border-jways-700 overflow-hidden transition-colors duration-200">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center text-sm">
          <Calculator className="w-4 h-4 mr-2 text-jways-500" />
          {t('widget.calculator')}
        </h3>
      </div>
      
      <div className="p-5">
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              {t('common.amount')}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-50 dark:bg-jways-900 border border-gray-200 dark:border-jways-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-jways-500 focus:border-transparent transition-all outline-none"
              placeholder="0.00"
              min="0"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* From Currency */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                {t('common.from')}
              </label>
              <div className="relative">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-jways-900 border border-gray-200 dark:border-jways-700 rounded-xl pl-3 pr-8 py-2.5 text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-jways-500 focus:border-transparent transition-all outline-none appearance-none"
                  disabled={loading}
                >
                  {currencies.map(c => (
                    <option key={c.currency} value={c.currency}>
                      {c.flag} {c.currency}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="pt-5 flex-shrink-0">
              <button
                type="button"
                onClick={handleSwap}
                className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-jways-700 dark:hover:bg-jways-600 text-gray-600 dark:text-gray-300 transition-colors"
                aria-label="Swap currencies"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* To Currency */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                {t('common.to')}
              </label>
              <div className="relative">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-jways-900 border border-gray-200 dark:border-jways-700 rounded-xl pl-3 pr-8 py-2.5 text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-jways-500 focus:border-transparent transition-all outline-none appearance-none"
                  disabled={loading}
                >
                  {currencies.map(c => (
                    <option key={c.currency} value={c.currency}>
                      {c.flag} {c.currency}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-jways-700">
            <div className="bg-jways-50 dark:bg-jways-900/30 rounded-xl p-4 border border-jways-100 dark:border-jways-800 flex flex-col items-center justify-center min-h-[80px]">
              {loading && currencies.length === 1 ? (
                <div className="animate-pulse bg-jways-200 dark:bg-jways-700 h-8 w-3/4 rounded"></div>
              ) : (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                    {amount || '0'} {fromCurrency} =
                  </span>
                  <span className="text-2xl font-extrabold text-jways-700 dark:text-jways-400">
                    {currentResult.toLocaleString(undefined, {
                      minimumFractionDigits: toCurrency === 'KRW' || toCurrency === 'JPY' ? 0 : 2,
                      maximumFractionDigits: toCurrency === 'KRW' || toCurrency === 'JPY' ? 0 : 2,
                    })} {toCurrency}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
