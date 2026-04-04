import { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { fetchPortWeather } from '@/api/weatherApi';
import type { PortWeather } from '@/types/dashboard';

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

interface UsePortWeatherResult {
  data: PortWeather[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function usePortWeather(): UsePortWeatherResult {
  const [data, setData] = useState<PortWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const weather = await fetchPortWeather();
      setData(weather);
    } catch (err) {
      Sentry.captureException(err);
      setError(err instanceof Error ? err.message : 'Failed to load weather');
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
