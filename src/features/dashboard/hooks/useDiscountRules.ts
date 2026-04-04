import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/browser';
import { getDiscountRules, type DiscountRule } from '@/api/discountRuleApi';

export function useDiscountRules() {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rules } = await getDiscountRules();
      setRules(rules || []);
    } catch (e) {
      Sentry.captureException(e);
      setError(e instanceof Error ? e.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  return useMemo(() => ({
    rules,
    loading,
    error,
    refetch: fetchRules
  }), [rules, loading, error, fetchRules]);
}
