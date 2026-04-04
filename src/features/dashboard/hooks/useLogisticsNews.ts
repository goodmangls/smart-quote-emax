import { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { fetchLogisticsNews } from '@/api/noticeApi';
import type { LogisticsNews } from '@/types/dashboard';

interface UseLogisticsNewsResult {
  data: LogisticsNews[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const CARRIER_KEYWORDS = /\b(UPS|DHL|FedEx)\b/i;

export function useLogisticsNews(): UseLogisticsNewsResult {
  const [data, setData] = useState<LogisticsNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const news = await fetchLogisticsNews();
      setData(news.filter((item) => CARRIER_KEYWORDS.test(item.title)));
    } catch (err) {
      Sentry.captureException(err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, retry: load };
}
