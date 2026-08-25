/**
 * Is the live USD/KRW far enough from the quoting rate to act on?
 *
 * The dashboard watches the market all day, but DEFAULT_EXCHANGE_RATE only
 * moves when someone runs /fx-update. Nothing connected the two, so a stale
 * quoting rate was invisible — this repo sat five months behind (1450, dated
 * 2026-03-24) before anyone noticed on 2026-08-25. This is what closes that
 * loop. Ported from smart-quote-main; keep the two copies in step.
 */

/** The quoting rate is always a multiple of this. See the /fx-update skill. */
export const FX_STEP = 50;

/**
 * How close to a bucket boundary counts as "about to move".
 *
 * The widget reads a mid-market rate; the policy input is the Hana Bank
 * remittance rate, which sits above it. Measured once (2026-08-25): mid
 * 1383.13 against a remittance rate of 1385 — under 2 KRW. A telegraphic
 * transfer spread can run near 1% (~14 KRW), so this band is sized for the
 * wider case rather than the one sample. Warning early costs a glance at the
 * bank page; warning late means quoting at the wrong rate.
 */
export const FX_NEAR_BAND = 15;

export type FxDriftLevel = 'ok' | 'approaching' | 'drift';

export interface FxDrift {
  level: FxDriftLevel;
  /** Live mid-market USD/KRW. */
  market: number;
  /** Rate the quotes currently use (DEFAULT_EXCHANGE_RATE). */
  applied: number;
  /** What the policy would pick for this market rate. */
  suggested: number;
  /** KRW until the market leaves the applied bucket. 0 once it has. */
  distanceToBoundary: number;
}

/** floor to the step — the KRW-strong direction, per the /fx-update policy. */
const bucketFor = (rate: number): number => Math.floor(rate / FX_STEP) * FX_STEP;

export function evaluateFxDrift({
  market,
  applied,
}: {
  market: number | null | undefined;
  applied: number;
}): FxDrift {
  const quiet: FxDrift = {
    level: 'ok',
    market: market ?? 0,
    applied,
    suggested: applied,
    distanceToBoundary: 0,
  };

  // No rate, a failed parse, or a nonsensical one: the widget reports its own
  // load failures, and a false "change the rate" is worse than silence.
  if (typeof market !== 'number' || !Number.isFinite(market) || market <= 0) {
    return quiet;
  }

  const suggested = bucketFor(market);
  if (suggested !== applied) {
    return { level: 'drift', market, applied, suggested, distanceToBoundary: 0 };
  }

  // Inside the applied bucket [applied, applied + FX_STEP). Either edge would
  // change the answer, so measure to whichever is nearer.
  const toUpper = applied + FX_STEP - market;
  const toLower = market - applied;
  const distanceToBoundary = Math.min(toUpper, toLower);

  return {
    // `<=` so "15 KRW to go" already warns. Warning early costs a glance at
    // the bank page; warning late means quoting at the wrong rate.
    level: distanceToBoundary <= FX_NEAR_BAND ? 'approaching' : 'ok',
    market,
    applied,
    suggested,
    distanceToBoundary,
  };
}
