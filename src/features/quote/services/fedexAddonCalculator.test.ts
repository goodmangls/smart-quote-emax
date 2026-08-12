import { describe, it, expect } from 'vitest';
import { calculateFedexAddOnCosts, getFedexMinChargeableWeight } from './fedexAddonCalculator';
import { calculateQuote } from './calculationService';
import { PackingType, Incoterm, QuoteInput, CargoItem } from '@/types';

/**
 * FedEx add-on rules, per "추가 서비스 요금 및 기타 정보 — 대한민국" (KR_20251119_102313).
 *
 * The two rules worth guarding are FedEx-specific and both cut against the obvious
 * implementation: 비표준화물 fees are highest-only rather than additive, and the
 * 18kg minimum acts on the tariff lookup rather than on an add-on line.
 */
describe('FedEx add-ons', () => {
  const item = (o: Partial<CargoItem> = {}): CargoItem => ({
    id: '1',
    width: 30,
    length: 40,
    height: 30,
    weight: 10,
    quantity: 1,
    ...o,
  });

  const input = (o: Partial<QuoteInput> = {}): QuoteInput => ({
    originCountry: 'KR',
    destinationCountry: 'JP',
    destinationZip: '100-0001',
    incoterm: Incoterm.DAP,
    packingType: PackingType.NONE,
    items: [item()],
    discountPercent: 0,
    dutyTaxEstimate: 0,
    exchangeRate: 1300,
    fscPercent: 30,
    overseasCarrier: 'FEDEX',
    ...o,
  });

  const addons = (o: Partial<QuoteInput> = {}) => calculateFedexAddOnCosts(input(o), 10, 0);
  const codes = (o: Partial<QuoteInput> = {}) => addons(o).details.map((d) => d.code);
  const amountOf = (code: string, o: Partial<QuoteInput> = {}) =>
    addons(o).details.find((d) => d.code === code)?.amount;

  describe('nothing applies to an ordinary package', () => {
    it('charges no add-ons for a small parcel to Japan', () => {
      expect(addons().total).toBe(0);
      expect(codes()).toEqual([]);
    });
  });

  describe('추가 취급 요금 – 용적 (AHD, 35,600원) — each criterion independently', () => {
    it('가장 긴 면 >121cm', () => {
      expect(codes({ items: [item({ length: 122 })] })).toContain('AHD');
      expect(codes({ items: [item({ length: 121 })] })).not.toContain('AHD');
    });

    it('두 번째로 긴 면 >76cm', () => {
      // Height kept at 6cm so 길이+둘레 stays at 266 — isolates the second-side rule.
      expect(codes({ items: [item({ length: 100, width: 77, height: 6 })] })).toContain('AHD');
      expect(codes({ items: [item({ length: 100, width: 76, height: 6 })] })).not.toContain('AHD');
    });

    it('길이+둘레 >266cm', () => {
      // 100 + 2×60 + 2×24 = 268
      expect(codes({ items: [item({ length: 100, width: 60, height: 24 })] })).toContain('AHD');
      // 100 + 2×60 + 2×23 = 266 — at the threshold, not over it
      expect(codes({ items: [item({ length: 100, width: 60, height: 23 })] })).not.toContain('AHD');
    });

    it('용적 >169,901cm³', () => {
      // 88×44×44: 길이+둘레 264 and every side under its limit, so only volume can trigger.
      // 170,368cm³ — just over. This is close to the largest box that clears the linear
      // rules at all, which is why the margin is thin.
      expect(codes({ items: [item({ length: 88, width: 44, height: 44 })] })).toContain('AHD');
      // 88×44×43 = 166,496cm³, 길이+둘레 262
      expect(codes({ items: [item({ length: 88, width: 44, height: 43 })] })).not.toContain('AHD');
    });

    it('charges 35,600원 per package', () => {
      expect(amountOf('AHD', { items: [item({ length: 122 })] })).toBe(35_600);
    });

    it('multiplies by quantity', () => {
      expect(amountOf('AHD', { items: [item({ length: 122, quantity: 3 })] })).toBe(35_600 * 3);
    });
  });

  describe('추가 취급 요금 – 중량 (AHW) / 패키징 (AHP)', () => {
    it('실제 중량 >25kg → AHW', () => {
      expect(codes({ items: [item({ weight: 26 })] })).toContain('AHW');
      expect(codes({ items: [item({ weight: 25 })] })).not.toContain('AHW');
    });

    it('목재/스키드 포장 → AHP', () => {
      expect(codes({ packingType: PackingType.WOODEN_BOX })).toContain('AHP');
      expect(codes({ packingType: PackingType.SKID })).toContain('AHP');
    });

    it('진공 포장은 해당 없음', () => {
      expect(codes({ packingType: PackingType.VACUUM })).not.toContain('AHP');
    });
  });

  describe('highest-only — 2종 이상 해당 시 가장 높은 금액 하나만', () => {
    it('charges Oversize alone, not Oversize + AHD', () => {
      // 250cm longest clears both the 121cm (AHD) and 243cm (Oversize) thresholds.
      const result = addons({ items: [item({ length: 250 })] });
      expect(result.details).toHaveLength(1);
      expect(result.details[0].code).toBe('OVR');
      expect(result.details[0].amount).toBe(86_000);
    });

    it('charges Unauthorized alone when all three tiers are met', () => {
      const result = addons({ items: [item({ length: 300, weight: 70 })] });
      expect(result.details).toHaveLength(1);
      expect(result.details[0].code).toBe('UNA');
      expect(result.details[0].amount).toBe(378_200);
    });

    it('never sums two 35,600원 lines for one package', () => {
      // Over both the dimension and the weight criteria.
      const result = addons({ items: [item({ length: 122, weight: 30 })] });
      expect(result.details).toHaveLength(1);
      expect(result.details[0].amount).toBe(35_600);
    });

    it('still resolves per package, so a mixed shipment can carry two different codes', () => {
      const result = addons({
        items: [item({ id: 'a', length: 250 }), item({ id: 'b', weight: 30 })],
      });
      expect(result.details.map((d) => d.code).sort()).toEqual(['AHW', 'OVR']);
    });
  });

  describe('18kg 최소 청구 중량', () => {
    it('is null when no package meets the 용적 criteria', () => {
      expect(getFedexMinChargeableWeight([item()], PackingType.NONE)).toBeNull();
    });

    it('is 18kg for one triggering package', () => {
      expect(getFedexMinChargeableWeight([item({ length: 122 })], PackingType.NONE)).toBe(18);
    });

    it('scales with the number of triggering boxes', () => {
      expect(getFedexMinChargeableWeight([item({ length: 122, quantity: 3 })], PackingType.NONE)).toBe(54);
    });

    it('counts only the triggering boxes in a mixed shipment', () => {
      expect(
        getFedexMinChargeableWeight([item({ id: 'a', length: 122 }), item({ id: 'b' })], PackingType.NONE),
      ).toBe(18);
    });

    it('raises the quoted billable weight — the flat fee alone would not', () => {
      // Long and thin: 122cm trips 용적, but 122×10×10/5000 = 2.44kg volumetric and
      // 5kg actual both sit under the floor, so the floor is what binds.
      const light = calculateQuote(
        input({ items: [item({ weight: 5, length: 122, width: 10, height: 10 })] }),
      );
      expect(light.billableWeight).toBe(18);
      expect(light.warnings.join(' ')).toMatch(/Minimum Chargeable Weight/i);
    });

    it('leaves billable weight alone when nothing triggers', () => {
      const normal = calculateQuote(input({ items: [item({ weight: 5 })] }));
      expect(normal.billableWeight).toBeLessThan(18);
      expect(normal.warnings.join(' ')).not.toMatch(/Minimum Chargeable Weight/i);
    });

    it('does not lower a shipment already heavier than the floor', () => {
      const heavy = calculateQuote(input({ items: [item({ weight: 40, length: 122 })] }));
      expect(heavy.billableWeight).toBeGreaterThan(18);
    });
  });

  describe('destination-driven', () => {
    it('adds the U.S. import processing fee for US only', () => {
      expect(amountOf('USI', { destinationCountry: 'US' })).toBe(3_900);
      expect(codes({ destinationCountry: 'JP' })).not.toContain('USI');
    });

    it('does not apply FSC to the import processing fee', () => {
      const r = calculateFedexAddOnCosts(input({ destinationCountry: 'US' }), 10, 30);
      expect(r.details.find((d) => d.code === 'USI')?.fscAmount).toBe(0);
    });
  });

  describe('둘 중 큰 금액 (greater-of)', () => {
    it('uses the flat amount at low weight', () => {
      // 2,360 × 10kg = 23,600 < 152,100
      expect(calculateFedexAddOnCosts(input({ fedexAddOns: ['DGA'] }), 10, 0).total).toBe(152_100);
    });

    it('uses the per-kg amount at high weight', () => {
      // 2,360 × 100kg = 236,000 > 152,100
      expect(calculateFedexAddOnCosts(input({ fedexAddOns: ['DGA'] }), 100, 0).total).toBe(236_000);
    });

    it('applies the same rule to inaccessible DG', () => {
      expect(calculateFedexAddOnCosts(input({ fedexAddOns: ['DGI'] }), 10, 0).total).toBe(93_800);
      expect(calculateFedexAddOnCosts(input({ fedexAddOns: ['DGI'] }), 100, 0).total).toBe(132_000);
    });
  });

  describe('dry ice is waived alongside dangerous goods', () => {
    it('charges dry ice on its own', () => {
      expect(calculateFedexAddOnCosts(input({ fedexAddOns: ['DIC'] }), 10, 0).total).toBe(6_600);
    });

    it('drops dry ice when DG is also declared', () => {
      const r = calculateFedexAddOnCosts(input({ fedexAddOns: ['DIC', 'DGA'] }), 10, 0);
      expect(r.details.map((d) => d.code)).toEqual(['DGA']);
    });
  });

  describe('운송 신고 금액 추가 비용', () => {
    it('is free at or below 115,000원', () => {
      expect(codes({ fedexDeclaredValue: 115_000 })).not.toContain('DVL');
    });

    it('charges 1,420원 per 115,000원 step, rounded up', () => {
      expect(amountOf('DVL', { fedexDeclaredValue: 115_001 })).toBe(2_840); // 2 steps
      expect(amountOf('DVL', { fedexDeclaredValue: 460_000 })).toBe(5_680); // 4 steps
    });
  });

  describe('user-selected flat fees', () => {
    it.each([
      ['SPU', 20_100],
      ['SDL', 20_100],
      ['RES', 4_400],
      ['ADR', 14_600],
      ['TPC', 14_200],
      ['SIG', 4_000],
      ['SDS', 4_600],
      ['SAS', 5_800],
    ])('%s charges %i원', (code, expected) => {
      expect(calculateFedexAddOnCosts(input({ fedexAddOns: [code] }), 10, 0).total).toBe(expected);
    });

    it('ignores an unknown code rather than throwing', () => {
      expect(calculateFedexAddOnCosts(input({ fedexAddOns: ['NOPE'] }), 10, 0).total).toBe(0);
    });
  });

  describe('FSC', () => {
    it('applies FSC to surcharges that carry it', () => {
      const r = calculateFedexAddOnCosts(input({ fedexAddOns: ['SPU'] }), 10, 30);
      expect(r.details[0].fscAmount).toBeCloseTo(20_100 * 0.3, 5);
      expect(r.total).toBeCloseTo(20_100 * 1.3, 5);
    });
  });
});
