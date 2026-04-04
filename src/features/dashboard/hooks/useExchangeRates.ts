import { useState, useEffect, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/browser';
import { fetchExchangeRates } from '@/api/exchangeRateApi';
import type { ExchangeRate } from '@/types/dashboard';

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes (server caches for 1 hour)
const STALE_THRESHOLD = 35 * 60 * 1000; // 35 minutes — data considered stale

interface UseExchangeRatesResult {
  data: ExchangeRate[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isStale: boolean;
  retry: () => void;
}

export function useExchangeRates(): UseExchangeRatesResult {
  const [data, setData] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const lastFetchedAt = useRef<number>(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rates = await fetchExchangeRates();
      setData(rates);
      setLastUpdated(new Date());
      setIsStale(false);
      lastFetchedAt.current = Date.now();
    } catch (err) {
      Sentry.captureException(err);
      setError(err instanceof Error ? err.message : 'Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh only if stale (avoid redundant API calls)
  const refreshIfStale = useCallback(() => {
    if (Date.now() - lastFetchedAt.current > STALE_THRESHOLD) {
      load();
    }
  }, [load]);

  // Periodic polling
  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  // Stale timer — tick every 30s to update isStale flag
  useEffect(() => {
    const tick = () => {
      if (lastFetchedAt.current > 0) {
        setIsStale(Date.now() - lastFetchedAt.current > STALE_THRESHOLD);
      }
    };
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Refresh when tab becomes visible (if data is stale)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshIfStale();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refreshIfStale]);

  // Refresh when coming back online
  useEffect(() => {
    const onOnline = () => refreshIfStale();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refreshIfStale]);

  return { data, loading, error, lastUpdated, isStale, retry: load };
}
