import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppliedSurcharge } from '@/features/dashboard/hooks/useSurcharges';
import { ResolvedSurcharge } from '@/api/surchargeApi';
import { ExternalLink, AlertTriangle, Shield, Loader2, RefreshCw, Info } from 'lucide-react';
import { formatKRW } from '@/lib/format';

const CARRIER_SURCHARGE_URLS: Record<string, { label: string; url: string }> = {
  UPS: {
    label: 'UPS Surcharges',
    url: 'https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page',
  },
  DHL: {
    label: 'DHL Surcharges',
    url: 'https://mydhl.express.dhl/kr/ko/ship/surcharges.html',
  },
};

interface Props {
  carrier: string;
  surcharges: ResolvedSurcharge[];
  appliedSurcharges: AppliedSurcharge[];
  systemTotal: number;
  manualSurgeCost: number | undefined;
  onManualSurgeChange: (value: number | undefined) => void;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRetry: () => void;
  isMobileView: boolean;
}

export const SurchargePanel: React.FC<Props> = ({
  carrier,
  surcharges,
  appliedSurcharges,
  systemTotal,
  manualSurgeCost,
  onManualSurgeChange,
  loading,
  error,
  lastUpdated,
  onRetry,
  isMobileView,
}) => {
  const { t, language } = useLanguage();
  const isKo = language === 'ko';

  const inputClass = `w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-jways-500 focus:ring-jways-500 border bg-white dark:bg-gray-700 dark:text-white transition-colors placeholder-gray-400 ${isMobileView ? 'text-base py-3.5 px-4' : 'text-sm py-2 px-3'}`;
  const labelClass = `block font-medium text-gray-700 dark:text-gray-300 mb-1 ml-0.5 ${isMobileView ? 'text-base' : 'text-sm'}`;

  const carrierLink = CARRIER_SURCHARGE_URLS[carrier];
  const hasSurcharges = surcharges.length > 0;
  const grandTotal = systemTotal + (manualSurgeCost ?? 0);

  return (
    <div className="col-span-1 md:col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <label className={labelClass}>
          <Shield className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-500" />
          {t('calc.service.surcharge.title')}
        </label>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
      </div>

      {/* Active Surcharges Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
        {hasSurcharges ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <th className="text-left px-3 py-1.5 font-semibold">{t('calc.service.surcharge.item')}</th>
                <th className="text-center px-2 py-1.5 font-semibold">{t('calc.service.surcharge.type')}</th>
                <th className="text-right px-3 py-1.5 font-semibold">{t('calc.service.surcharge.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {appliedSurcharges.map((s) => (
                <tr key={s.code} className="border-t border-gray-100 dark:border-gray-600 odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700/50">
                  <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <span>{isKo && s.nameKo ? s.nameKo : s.name}</span>
                      {s.sourceUrl && (
                        <a
                          href={s.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-jways-500 transition-colors flex-shrink-0"
                          title={t('calc.service.surcharge.verifyLink')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                      s.chargeType === 'rate'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {s.chargeType === 'rate' ? `${s.amount}%` : 'Fixed'}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-gray-800 dark:text-gray-200">
                    {formatKRW(s.appliedAmount)}
                  </td>
                </tr>
              ))}

              {/* System subtotal */}
              {appliedSurcharges.length > 0 && (
                <tr className="border-t-2 border-gray-200 dark:border-gray-500 bg-amber-50 dark:bg-amber-900/10">
                  <td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {t('calc.service.surcharge.systemTotal')}
                  </td>
                  <td className="px-3 py-1.5 text-right font-bold text-amber-700 dark:text-amber-400">
                    {formatKRW(systemTotal)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="px-3 py-3 text-xs text-gray-400 dark:text-gray-500 text-center">
            {loading
              ? t('calc.service.surcharge.loading')
              : error
                ? t('calc.service.surcharge.errorLoad')
                : t('calc.service.surcharge.none')
            }
          </div>
        )}
      </div>

      {/* Manual Additional Surge Input */}
      <div className="mt-3">
        <label className={`block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-0.5`}>
          {t('calc.service.surcharge.manualLabel')}
        </label>
        <input
          type="number"
          step="1000"
          min="0"
          value={manualSurgeCost ?? ''}
          onChange={(e) => onManualSurgeChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className={inputClass}
          placeholder="0"
          inputMode="numeric"
          autoComplete="off"
        />
        <p className="mt-0.5 text-[10px] text-gray-400">
          {t('calc.service.surcharge.manualHint')}
        </p>
      </div>

      {/* Grand Total */}
      {grandTotal > 0 && (
        <div className="mt-2 flex justify-between items-center px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {t('calc.service.surcharge.grandTotal')}
          </span>
          <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
            {formatKRW(grandTotal)}
          </span>
        </div>
      )}

      {/* Carrier Official Links */}
      <div className="mt-2 flex items-center gap-3 flex-wrap">
        {carrierLink && (
          <a
            href={carrierLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-jways-600 dark:text-jways-400 hover:text-jways-700 dark:hover:text-jways-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {carrierLink.label}
          </a>
        )}
        {error && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {t('calc.service.surcharge.retry')}
          </button>
        )}
        {lastUpdated && !error && (
          <span className="text-[10px] text-gray-400">
            {t('calc.service.surcharge.updated')}: {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Real-time Notice */}
      <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 px-3 py-2 text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">{t('calc.service.surcharge.notice.title')}</p>
            <p>{t('calc.service.surcharge.notice.body')}</p>
            <div className="mt-1 flex items-center gap-2">
              {Object.entries(CARRIER_SURCHARGE_URLS).map(([key, val]) => (
                <a
                  key={key}
                  href={val.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 underline decoration-dotted hover:decoration-solid"
                >
                  <Info className="w-2.5 h-2.5" />
                  {key}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
