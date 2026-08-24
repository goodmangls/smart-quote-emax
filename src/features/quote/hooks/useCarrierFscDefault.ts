import { useCallback, useEffect, useRef } from 'react';
import { useFscRates } from '@/features/dashboard/hooks/useFscRates';
import { defaultFscFor } from '@/config/rates';

interface Params {
  /** Currently selected carrier. */
  carrier: string;
  /** Current fscPercent on the quote input. */
  fscPercent?: number;
  /**
   * Called with the rate to apply. Omit on surfaces that quote every carrier at
   * its own default and have no single FSC field to keep in step — the
   * comparison page does that and only needs `resolve`.
   */
  onApply?: (next: number) => void;
}

interface Result {
  /** Rate for any carrier — for the best-carrier pick and the comparison page. */
  resolve: (carrier: string) => number;
  /** Rate for the currently selected carrier. */
  current: number;
}

/**
 * Resolves the fuel surcharge to default to, and keeps the quote input in step.
 *
 * The admin FSC widget writes to fsc_rates, but nothing on the quoting path
 * read it — the calculator, the best-carrier pick, and the comparison page all
 * used the shipped constants, so a rate raised in the widget changed no quote.
 * The backend had the same gap (FscFetcher was wired to its controller and
 * nothing else) and is fixed alongside this.
 *
 * The constants remain the value used while the request is in flight or if it
 * fails — useFscRates seeds its state with them — so a quote is never blocked
 * on the network; it starts from last week's figure and corrects itself.
 */
export function useCarrierFscDefault({ carrier, fscPercent, onApply }: Params): Result {
  const { data } = useFscRates();
  const rates = data?.rates as Record<string, { international: number }> | undefined;

  const resolve = useCallback(
    (target: string): number => {
      // EMAX bills fuel per kg on a separate branch, so it must never pick up a
      // percentage — not even one added to the table by hand.
      if (target === 'EMAX') return 0;
      return rates?.[target === 'FDX' ? 'FEDEX' : target]?.international ?? defaultFscFor(target);
    },
    [rates]
  );

  const resolved = resolve(carrier);

  // The rate this hook last handed out. While the field still holds it, nobody
  // has typed over it and a newly arrived DB rate may replace it. Seeded with
  // the value present on first render so an edit made before the response lands
  // is protected too — that race is why this is a ref rather than a plain
  // "did it change" check.
  const appliedRef = useRef<number | undefined>(fscPercent);
  const carrierRef = useRef<string>(carrier);

  useEffect(() => {
    if (!onApply) return;

    const carrierChanged = carrierRef.current !== carrier;
    // `===` on purpose: an explicit 0 is a real rate, not an absent one.
    const untouched = fscPercent === appliedRef.current;

    if (!carrierChanged && !untouched) return;

    carrierRef.current = carrier;
    if (fscPercent !== resolved) {
      appliedRef.current = resolved;
      onApply(resolved);
    }
  }, [carrier, fscPercent, resolved, onApply]);

  return { resolve, current: resolved };
}
