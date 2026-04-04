import { useState, useEffect, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/browser';
import { resolveAddonRates, AddonRate } from '@/api/addonRateApi';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: AddonRate[];
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};

export function useAddonRates(carrier: 'DHL' | 'UPS') {
  const [rates, setRates] = useState<AddonRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchRates = useCallback(async () => {
    // Check cache
    const cached = cache[carrier];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setRates(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await resolveAddonRates(carrier);
      if (mountedRef.current) {
        setRates(data);
        cache[carrier] = { data, timestamp: Date.now() };
      }
    } catch (err) {
      Sentry.captureException(err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load addon rates');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [carrier]);

  useEffect(() => {
    mountedRef.current = true;
    fetchRates();
    return () => { mountedRef.current = false; };
  }, [fetchRates]);

  const retry = useCallback(() => {
    delete cache[carrier];
    fetchRates();
  }, [carrier, fetchRates]);

  return { rates, loading, error, retry };
}
