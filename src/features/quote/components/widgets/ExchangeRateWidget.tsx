import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { RefreshCw, TrendingUp, TrendingDown, Minus, DollarSign, Fuel, ExternalLink } from 'lucide-react';
import { WidgetSkeleton } from '@/features/dashboard/components/WidgetSkeleton';
import { WidgetError } from '@/features/dashboard/components/WidgetError';
import { useExchangeRates } from '@/features/dashboard/hooks/useExchangeRates';
import { useFscRates } from '@/features/dashboard/hooks/useFscRates';
import { UPS_FSC_URL, DHL_FSC_URL } from '@/config/rates';

export const ExchangeRateWidget: React.FC = () => {
  const { t } = useLanguage();
  const { 
    data: exchangeData, 
    loading: ratesLoading, 
    error: ratesError, 
    lastUpdated: ratesUpdated, 
    isStale: ratesStale, 
    retry: retryRates 
  } = useExchangeRates();

  const {
    data: fscData,
    loading: fscLoading,
    error: fscError,
    retry: retryFsc
  } = useFscRates();

  const loading = ratesLoading || fscLoading;
  const error = ratesError || fscError;
  const isStale = ratesStale;

  const handleRetry = () => {
    retryRates();
    retryFsc();
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const trendColors = (trend: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    if (trend === 'down') return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
    return 'text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
  };

  return (
    <div className="bg-white dark:bg-jways-800 rounded-2xl shadow-sm border border-gray-100 dark:border-jways-700 overflow-hidden transition-colors duration-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center text-sm">
          <DollarSign className="w-4 h-4 mr-2 text-green-500" />
          {t('widget.exchange')}
        </h3>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          {!loading && exchangeData.length > 0 && (
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isStale
                  ? 'bg-gray-300 dark:bg-gray-600'
                  : 'bg-emerald-500 animate-pulse'
              }`}
              title={isStale ? 'Stale' : 'Live'}
            />
          )}
          <button
            onClick={handleRetry}
            className={`text-gray-400 hover:text-jways-500 dark:text-gray-400 dark:hover:text-jways-400 transition-colors ${loading ? 'animate-spin cursor-not-allowed' : ''}`}
            disabled={loading}
            aria-label={t('widget.exchange.refresh')}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col overflow-y-auto">
        {loading && exchangeData.length === 0 ? (
          <WidgetSkeleton lines={8} />
        ) : error && exchangeData.length === 0 ? (
          <WidgetError message={error} onRetry={handleRetry} />
        ) : (
          <div className="space-y-6">
            {/* Exchange Rates */}
            <div>
              <div className="flex items-center justify-between mb-3 text-[10px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                <span>{t('widget.exchange.currency')}</span>
                <div className="flex items-center gap-6">
                  <span className="w-20 text-right">{t('widget.exchange.rate')}</span>
                  <span className="w-16 text-right">{t('widget.exchange.change')}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {exchangeData.map((rate) => (
                  <div
                    key={rate.currency}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-jways-900/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg leading-none" role="img" aria-label={rate.currency}>
                        {rate.flag}
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          {rate.currency}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-400 ml-1.5 hidden sm:inline">
                          / KRW
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-20 text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                          {rate.rate.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md w-16 justify-end ${trendColors(rate.trend)}`}
                      >
                        <TrendIcon trend={rate.trend} />
                        <span className="tabular-nums">
                          {rate.change > 0 ? '+' : ''}
                          {rate.change.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FSC Rates */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-jways-500" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                    {t('widget.fsc.title')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  <span className="w-12 text-center">{t('widget.fsc.intl')}</span>
                  <span className="w-12 text-center">{t('widget.fsc.dom')}</span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'UPS', link: UPS_FSC_URL, logo: '📦' },
                  { name: 'DHL', link: DHL_FSC_URL, logo: '🚚' }
                ].map((carrier) => {
                  const rates = fscData?.rates?.[carrier.name as 'UPS' | 'DHL'];
                  return (
                    <div
                      key={carrier.name}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-jways-900/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <a 
                          href={carrier.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-100 hover:text-jways-600 dark:hover:text-jways-400 transition-colors"
                        >
                          {carrier.name}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 text-right">
                          <span className="text-sm font-bold text-jways-600 dark:text-jways-400">
                            {rates ? `${rates.international}%` : '--'}
                          </span>
                        </div>
                        <div className="w-12 text-right">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {rates ? `${rates.domestic}%` : '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && (exchangeData.length > 0 || fscData) && (
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-400">
              <span>* {t('widget.exchange.desc')}</span>
              <span className="flex items-center gap-1">
                {(ratesLoading || fscLoading) && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                {ratesUpdated?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
