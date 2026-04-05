import React from 'react';
import { QuoteSummary } from '@/types';
import { Eye, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { formatNum } from '@/lib/format';
import { STATUS_COLORS } from '@/features/history/constants';

function getExpiryFromDate(validityDate: string) {
  const expiry = new Date(validityDate);
  const now = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { daysLeft, expired: daysLeft <= 0 };
}

interface Props {
  quotes: QuoteSummary[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onView: (id: number) => void;
  onDelete: (id: number, refNo: string) => void;
}

export const QuoteHistoryTable: React.FC<Props> = ({
  quotes,
  isLoading,
  hasActiveFilters,
  onView,
  onDelete,
}) => {
  const emptyMessage = hasActiveFilters
    ? 'No quotes match your filters.'
    : 'No quotes saved yet. Calculate a quote and save it!';

  return (
    <div>
      {/* Mobile card view */}
      <div className="sm:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-gray-100 dark:border-gray-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : quotes.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400 dark:text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          quotes.map((q) => {
            const expiry = q.validityDate && (q.status === 'draft' || q.status === 'sent')
              ? getExpiryFromDate(q.validityDate)
              : null;
            return (
              <div
                key={q.id}
                className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-medium text-gray-900 dark:text-white">{q.referenceNo}</span>
                    {q.surchargeStale && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        재확인
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[q.status]}`}>
                    {q.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(q.createdAt).toLocaleDateString('ko-KR')}</span>
                    {expiry && (
                      <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
                        expiry.expired ? 'text-red-500 dark:text-red-400' :
                        expiry.daysLeft <= 3 ? 'text-amber-500 dark:text-amber-400' :
                        'text-green-500 dark:text-green-400'
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        {expiry.expired ? 'Expired' : `${expiry.daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {q.destinationCountry}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                    {formatNum(q.totalQuoteAmount)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    ${q.totalQuoteAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs tabular-nums ${q.discountPercent >= 10 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {q.discountPercent.toFixed(1)}%
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onView(q.id)}
                      className="p-2.5 rounded-md text-gray-400 hover:text-emax-600 hover:bg-emax-50 dark:hover:bg-emax-900/20 transition-colors"
                      aria-label="View detail"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(q.id, q.referenceNo)}
                      className="p-2.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ref No</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Dest</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount (KRW)</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">USD</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Discount</th>
            <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="px-4 py-3"><div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" /></td>
                </tr>
              ))}
            </>
          ) : quotes.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            quotes.map((q) => (
              <tr
                key={q.id}
                className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900 dark:text-white">
                  {q.referenceNo}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="text-gray-500 dark:text-gray-400">
                    {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                  {q.validityDate && (q.status === 'draft' || q.status === 'sent') ? (() => {
                    const { daysLeft, expired } = getExpiryFromDate(q.validityDate);
                    return (
                      <div className={`flex items-center gap-0.5 mt-0.5 text-[10px] font-medium ${
                        expired ? 'text-red-500 dark:text-red-400' :
                        daysLeft <= 3 ? 'text-amber-500 dark:text-amber-400' :
                        'text-green-500 dark:text-green-400'
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        {expired ? 'Expired' : `${daysLeft}d left`}
                      </div>
                    );
                  })() : null}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {q.destinationCountry}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white tabular-nums">
                  {formatNum(q.totalQuoteAmount)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 tabular-nums text-xs">
                  ${q.totalQuoteAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className={q.discountPercent >= 10 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                    {q.discountPercent.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[q.status]}`}>
                      {q.status}
                    </span>
                    {q.surchargeStale && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        재확인
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onView(q.id)}
                      className="p-2.5 sm:p-1.5 rounded-md text-gray-400 hover:text-emax-600 hover:bg-emax-50 dark:hover:bg-emax-900/20 transition-colors"
                      aria-label="View detail"
                    >
                      <Eye className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(q.id, q.referenceNo)}
                      className="p-2.5 sm:p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};
