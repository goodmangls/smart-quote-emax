import { evaluateFxDrift, FX_STEP, FX_NEAR_BAND } from '../fxDrift';

/**
 * The dashboard watches USD/KRW all day; the quoting rate only moves when
 * someone runs /fx-update. This decides when that gap is worth interrupting
 * about.
 *
 * The applied rate is floor(하나은행 송금환율 / 50) × 50, so the bucket for an
 * applied 1350 is [1350, 1400). Leaving that bucket is what needs action.
 */
describe('evaluateFxDrift', () => {
  const applied = 1350;

  it('is quiet in the middle of the bucket', () => {
    expect(evaluateFxDrift({ market: 1370, applied }).level).toBe('ok');
  });

  // Sitting exactly on the bucket floor is not a quiet place: one tick down
  // and the policy picks a different rate.
  it('warns when the market sits exactly on the bucket floor', () => {
    expect(evaluateFxDrift({ market: applied, applied }).level).toBe('approaching');
  });

  it('is quiet a comfortable distance above the floor', () => {
    expect(evaluateFxDrift({ market: applied + FX_NEAR_BAND + 1, applied }).level).toBe('ok');
  });

  it('flags drift once the market sits in a higher bucket', () => {
    const drift = evaluateFxDrift({ market: 1402, applied });

    expect(drift.level).toBe('drift');
    expect(drift.suggested).toBe(1400);
  });

  it('flags drift once the market sits in a lower bucket', () => {
    const drift = evaluateFxDrift({ market: 1349, applied });

    expect(drift.level).toBe('drift');
    expect(drift.suggested).toBe(1300);
  });

  // The widget reads the mid-market rate, but the policy input is the Hana Bank
  // remittance rate, which sits above it. Warning a band early covers that gap
  // rather than pretending the two are the same number.
  it('warns while still inside the bucket but close to the upper boundary', () => {
    const drift = evaluateFxDrift({ market: FX_STEP * 28 - FX_NEAR_BAND, applied });

    expect(drift.level).toBe('approaching');
    expect(drift.suggested).toBe(applied);
  });

  it('warns while close to the lower boundary', () => {
    const drift = evaluateFxDrift({ market: applied + FX_NEAR_BAND - 1, applied });

    expect(drift.level).toBe('approaching');
  });

  it('reports how far the market is from leaving the bucket', () => {
    // 1400 is the upper boundary for an applied 1350.
    expect(evaluateFxDrift({ market: 1390, applied }).distanceToBoundary).toBe(10);
    // Below the bucket floor the nearer boundary is 1350 itself.
    expect(evaluateFxDrift({ market: 1356, applied }).distanceToBoundary).toBe(6);
  });

  it('treats a market rate equal to the next boundary as drift, not approaching', () => {
    expect(evaluateFxDrift({ market: 1400, applied }).level).toBe('drift');
  });

  // A missing or nonsensical live rate must not raise an alarm — the widget
  // already surfaces its own load errors, and a false "change the rate" is
  // worse than staying quiet.
  it.each([undefined, null, 0, Number.NaN, -1])('stays quiet for a %s market rate', (market) => {
    expect(evaluateFxDrift({ market: market as number, applied }).level).toBe('ok');
  });

  it('carries the numbers the banner needs to show', () => {
    const drift = evaluateFxDrift({ market: 1402, applied });

    expect(drift).toMatchObject({ market: 1402, applied: 1350, suggested: 1400 });
  });

  // This repo went stale at 1450 while the policy input was in the 1300s. That
  // is the case the banner exists for, so pin it.
  it('flags the five-month drift this feature exists to catch', () => {
    const drift = evaluateFxDrift({ market: 1383.13, applied: 1450 });

    expect(drift.level).toBe('drift');
    expect(drift.suggested).toBe(1350);
  });
});
