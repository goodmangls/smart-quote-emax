import { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { getFscRates, FscRates } from '@/api/fscApi';

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function useFscRates() {
  const [data, setData] = useState<FscRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rates = await getFscRates();
      setData(rates);
    } catch (err) {
      Sentry.captureException(err);
      setError(err instanceof Error ? err.message : 'Failed to load FSC rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  return { data, loading, error, retry: load };
}
