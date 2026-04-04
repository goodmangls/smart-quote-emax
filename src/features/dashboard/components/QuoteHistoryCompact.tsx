import React, { useState, useEffect } from 'react';
import * as Sentry from '@sentry/browser';
import { FileText, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { listQuotes } from '@/api/quoteApi';
import type { QuoteSummary } from '@/types';
import { formatKRW } from '@/lib/format';

const statusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-jways-700 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const QuoteHistoryCompact: React.FC = () => {
  const { t } = useLanguage();
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await listQuotes({ page: 1, perPage: 5 });
        setQuotes(result.quotes.slice(0, 5));
      } catch (e) {
        // Silently fail — quote history is not critical for UI
        Sentry.captureException(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 rounded-lg bg-gray-200 dark:bg-jways-700" />
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <FileText className="w-10 h-10 text-gray-300 dark:text-jways-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('dashboard.noQuotes')}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-jways-700">
      {quotes.map((quote) => (
        <div key={quote.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-jways-700/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-mono font-bold text-jways-600 dark:text-jways-400 shrink-0">
              {quote.referenceNo}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
              → {quote.destinationCountry}
            </span>
            <span className={`text-xs sm:text-[10px] uppercase font-bold px-2 sm:px-1.5 py-1 sm:py-0.5 rounded ${statusColor[quote.status] || statusColor.draft}`}>
              {quote.status}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatKRW(quote.totalQuoteAmount)}
            </span>
            <ArrowRight className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
};
