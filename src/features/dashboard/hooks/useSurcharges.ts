import { useState, useEffect, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/browser';
import { resolveSurcharges, ResolvedSurcharge } from '@/api/surchargeApi';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: ResolvedSurcharge[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(carrier: string, country?: string): string {
  return `${carrier}:${country || '*'}`;
}

export interface AppliedSurcharge {
  code: string;
  name: string;
  nameKo: string | null;
  chargeType: 'fixed' | 'rate';
  amount: number;       // raw amount (KRW for fixed, % for rate)
  appliedAmount: number; // calculated KRW amount
  sourceUrl: string | null;
}

export function useSurcharges(carrier: string, country?: string, zone?: string) {
  const [surcharges, setSurcharges] = useState<ResolvedSurcharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!carrier) return;

    const key = getCacheKey(carrier, country);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setSurcharges(cached.data);
      setLastUpdated(new Date(cached.timestamp));
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const result = await resolveSurcharges(carrier, country, zone);
      const data = result.surcharges || [];
      setSurcharges(data);
      setLastUpdated(new Date());
      cache.set(key, { data, timestamp: Date.now() });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      Sentry.captureException(err);
      setError(err instanceof Error ? err.message : 'Failed to load surcharges');
      // Keep stale cache data if available
      if (cached) {
        setSurcharges(cached.data);
      }
    } finally {
      setLoading(false);
    }
  }, [carrier, country, zone]);

  useEffect(() => {
    load();
    return () => { abortRef.current?.abort(); };
  }, [load]);

  // Calculate applied amounts given a base rate
  const calculateApplied = useCallback((intlBase: number): AppliedSurcharge[] => {
    return surcharges.map(s => ({
      code: s.code,
      name: s.name,
      nameKo: s.name_ko,
      chargeType: s.charge_type,
      amount: s.amount,
      appliedAmount: s.charge_type === 'rate'
        ? Math.round(intlBase * s.amount / 100)
        : Math.round(s.amount),
      sourceUrl: s.source_url,
    }));
  }, [surcharges]);

  const totalAmount = useCallback((intlBase: number): number => {
    return calculateApplied(intlBase).reduce((sum, s) => sum + s.appliedAmount, 0);
  }, [calculateApplied]);

  return { surcharges, loading, error, lastUpdated, calculateApplied, totalAmount, retry: load };
}
