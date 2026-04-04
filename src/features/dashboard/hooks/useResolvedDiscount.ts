import { useState, useEffect, useMemo } from 'react';
import { resolveDiscount, type ResolvedDiscount } from '@/api/discountRuleApi';

export function useResolvedDiscount(
  email?: string,
  nationality?: string,
  weight?: number
) {
  const [data, setData] = useState<ResolvedDiscount | null>(null);

  // Stabilize weight before deps to prevent infinite API calls from floating-point jitter
  const stableWeight = weight !== undefined ? Math.round(weight * 100) / 100 : undefined;

  useEffect(() => {
    if (!email || stableWeight === undefined) return;

    resolveDiscount(email, nationality || '', stableWeight)
      .then(setData)
      .catch(() => setData(null));
  }, [email, nationality, stableWeight]);

  return useMemo(() => ({ data }), [data]);
}
