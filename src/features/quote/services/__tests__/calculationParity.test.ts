import { calculateQuote } from '../calculationService';
import type { QuoteInput } from '@/types';
import fixtures from '../../../../../shared/test-fixtures/calculation-parity.json';

describe('Calculation Parity Tests (Frontend)', () => {
  fixtures.fixtures.forEach((fixture) => {
    it(`produces valid output: ${fixture.name}`, () => {
      const result = calculateQuote(fixture.input as unknown as QuoteInput);

      // Structural assertions
      expect(result.totalCostAmount).toBeGreaterThanOrEqual(0);
      expect(result.totalQuoteAmount).toBeGreaterThanOrEqual(0);
      expect(result.carrier).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.totalCost).toBe(result.totalCostAmount);

      // Verify all breakdown fields exist
      expect(result.breakdown).toEqual(
        expect.objectContaining({
          packingMaterial: expect.any(Number),
          packingLabor: expect.any(Number),
          packingFumigation: expect.any(Number),
          handlingFees: expect.any(Number),
          pickupInSeoul: expect.any(Number),
          intlBase: expect.any(Number),
          intlFsc: expect.any(Number),
          intlWarRisk: expect.any(Number),
          intlSurge: expect.any(Number),
          destDuty: expect.any(Number),
          totalCost: expect.any(Number),
        })
      );
    });
  });

  it('includes pickupInSeoulCost in totalCostAmount', () => {
    const fixture = fixtures.fixtures.find(f => f.name === 'dhl_eu_with_pickup')!;
    const result = calculateQuote(fixture.input as unknown as QuoteInput);

    expect(result.breakdown.pickupInSeoul).toBe(50000);
    // totalCost must include pickup
    expect(result.totalCostAmount).toBeGreaterThan(50000);
  });

  it('includes manualSurgeCost in breakdown.intlSurge', () => {
    const fixture = fixtures.fixtures.find(f => f.name === 'emax_cn_ddp_with_surge')!;
    const result = calculateQuote(fixture.input as unknown as QuoteInput);

    expect(result.breakdown.intlSurge).toBe(40000);
  });

  it('handling fee is always 0 (no auto handling fee)', () => {
    const fixture = fixtures.fixtures.find(f => f.name === 'basic_ups_us_wooden_box')!;
    const result = calculateQuote(fixture.input as unknown as QuoteInput);

    expect(result.breakdown.handlingFees).toBe(0);
  });

  it('zeroes fumigation when manualPackingCost overrides Packing & Docs', () => {
    const fixture = fixtures.fixtures.find(f => f.name === 'ups_jp_manual_packing')!;
    const result = calculateQuote(fixture.input as unknown as QuoteInput);

    expect(result.breakdown.handlingFees).toBe(0);
    expect(result.breakdown.packingFumigation).toBe(0);
  });

  it('snapshots all fixture outputs for cross-platform comparison', () => {
    const snapshots: Record<string, object> = {};

    fixtures.fixtures.forEach((fixture) => {
      const result = calculateQuote(fixture.input as unknown as QuoteInput);
      snapshots[fixture.name] = {
        totalCostAmount: result.totalCostAmount,
        totalQuoteAmount: result.totalQuoteAmount,
        totalQuoteAmountUSD: Math.round(result.totalQuoteAmountUSD * 100) / 100,
        discountPercent: result.discountPercent,
        billableWeight: result.billableWeight,
        carrier: result.carrier,
        breakdown: result.breakdown,
      };
    });

    expect(snapshots).toMatchSnapshot();
  });
});
