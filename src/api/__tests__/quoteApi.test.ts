import { describe, it, expect } from 'vitest';
import { mapBreakdown } from '../quoteApi';

describe('mapBreakdown', () => {
  it('maps old backend fields (upsBase) to generic names (intlBase)', () => {
    const raw = {
      packingMaterial: 5000,
      packingLabor: 3000,
      packingFumigation: 10000,
      handlingFees: 15000,
      upsBase: 100000,
      upsFsc: 30000,
      upsWarRisk: 5000,
      upsSurge: 8000,
      destDuty: 0,
      totalCost: 176000,
    };
    const result = mapBreakdown(raw);
    expect(result.intlBase).toBe(100000);
    expect(result.intlFsc).toBe(30000);
    expect(result.intlWarRisk).toBe(5000);
    expect(result.intlSurge).toBe(8000);
  });

  it('passes through new field names (intlBase) directly', () => {
    const raw = {
      packingMaterial: 5000,
      packingLabor: 3000,
      packingFumigation: 10000,
      handlingFees: 15000,
      intlBase: 120000,
      intlFsc: 36000,
      intlWarRisk: 6000,
      intlSurge: 0,
      destDuty: 0,
      totalCost: 196000,
    };
    const result = mapBreakdown(raw);
    expect(result.intlBase).toBe(120000);
    expect(result.intlFsc).toBe(36000);
    expect(result.intlWarRisk).toBe(6000);
    expect(result.intlSurge).toBe(0);
  });

  it('prefers new field names (intlBase) over old when both present', () => {
    const raw = {
      upsBase: 100000,
      intlBase: 120000,
      upsFsc: 30000,
      intlFsc: 36000,
    };
    const result = mapBreakdown(raw);
    expect(result.intlBase).toBe(120000);
    expect(result.intlFsc).toBe(36000);
  });

  it('defaults missing fields to 0', () => {
    const raw = {};
    const result = mapBreakdown(raw);
    expect(result.packingMaterial).toBe(0);
    expect(result.packingLabor).toBe(0);
    expect(result.packingFumigation).toBe(0);
    expect(result.handlingFees).toBe(0);
    expect(result.intlBase).toBe(0);
    expect(result.intlFsc).toBe(0);
    expect(result.intlWarRisk).toBe(0);
    expect(result.intlSurge).toBe(0);
    expect(result.destDuty).toBe(0);
    expect(result.totalCost).toBe(0);
  });
});
