import { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { fetchJetFuelPrices } from '@/api/eiaApi';
import type { JetFuelPrice } from '@/api/eiaApi';

interface UseJetFuelPricesResult {
  data: JetFuelPrice[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useJetFuelPrices(weeks: number = 12): UseJetFuelPricesResult {
  const [data, setData] = useState<JetFuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prices = await fetchJetFuelPrices(weeks);
      setData(prices);
    } catch (err) {
      Sentry.captureException(err);
      setError(
        err instanceof Error ? err.message : 'Failed to load jet fuel prices',
      );
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, retry: load };
}
