import { describe, it, expect } from 'vitest';
import {
  determineUpsZone,
  determineDhlZone,
  determineFedexZone,
  calculateDhlCosts,
  calculateFedexCosts,
  calculateEmaxCosts,
  calculateOcsCosts,
  calculateUpsCosts,
  calculateQuote,
} from './calculationService';
import { PackingType, Incoterm, QuoteInput } from '@/types';
import { DHL_EXACT_RATES } from '@/config/dhl_tariff';
import { FEDEX_EXACT_RATES } from '@/config/fedex_tariff';
import { OCS_EXACT_RATES } from '@/config/ocs_tariff';
import { determineOcsZone } from '@/config/ocs_zones';

describe('calculationService', () => {
  // --- Zone Mapping Tests ---

  describe('determineUpsZone', () => {
    it('maps US to Z5', () => {
      expect(determineUpsZone('US')).toEqual({ rateKey: 'Z5', label: 'Z5/Americas' });
    });

    it('maps CN to Z1', () => {
      expect(determineUpsZone('CN')).toEqual({ rateKey: 'Z1', label: 'Z1/Asia' });
    });

    it('maps JP to Z2', () => {
      expect(determineUpsZone('JP')).toEqual({ rateKey: 'Z2', label: 'Z2/JP-VN' });
    });

    it('maps HK to Z10', () => {
      expect(determineUpsZone('HK')).toEqual({ rateKey: 'Z10', label: 'Z10/HK+S.China' });
    });

    it('maps TH to Z3', () => {
      expect(determineUpsZone('TH')).toEqual({ rateKey: 'Z3', label: 'Z3/SEA' });
    });

    it('maps SG to Z1 (not Z2)', () => {
      expect(determineUpsZone('SG')).toEqual({ rateKey: 'Z1', label: 'Z1/Asia' });
    });

    it('maps DE to Z6 (Zone Guide 2026)', () => {
      expect(determineUpsZone('DE')).toEqual({ rateKey: 'Z6', label: 'Z6/W.Europe' });
    });

    it('maps AT to Z7 (Zone Guide 2026)', () => {
      expect(determineUpsZone('AT')).toEqual({ rateKey: 'Z7', label: 'Z7/N.Europe' });
    });

    it('maps unknown country to Rest of World (Z10)', () => {
      expect(determineUpsZone('XX')).toEqual({ rateKey: 'Z10', label: 'Rest of World' });
    });
  });

  describe('determineDhlZone', () => {
    it('maps JP to Z2', () => {
      expect(determineDhlZone('JP')).toEqual({ rateKey: 'Z2', label: 'Z2/Japan' });
    });

    it('maps CN to Z1', () => {
      expect(determineDhlZone('CN')).toEqual({ rateKey: 'Z1', label: 'Z1/Asia' });
    });

    it('maps VN to Z3', () => {
      expect(determineDhlZone('VN')).toEqual({ rateKey: 'Z3', label: 'Z3/SEA' });
    });

    it('maps AU to Z4', () => {
      expect(determineDhlZone('AU')).toEqual({ rateKey: 'Z4', label: 'Z4/Oceania' });
    });

    it('maps US to Z5', () => {
      expect(determineDhlZone('US')).toEqual({ rateKey: 'Z5', label: 'Z5/Americas' });
    });

    it('maps DE to Z6 (Europe)', () => {
      expect(determineDhlZone('DE')).toEqual({ rateKey: 'Z6', label: 'Z6/Europe' });
    });

    it('maps CZ to Z6 (Zone Guide 2026)', () => {
      expect(determineDhlZone('CZ')).toEqual({ rateKey: 'Z6', label: 'Z6/Europe' });
    });

    it('maps BR to Z8', () => {
      expect(determineDhlZone('BR')).toEqual({ rateKey: 'Z8', label: 'Z8/Global' });
    });

    it('maps AE to Z7 (Zone Guide 2026)', () => {
      expect(determineDhlZone('AE')).toEqual({ rateKey: 'Z7', label: 'Z7/ME-Balkans' });
    });

    it('falls back to Z8 for unknown country', () => {
      expect(determineDhlZone('XX')).toEqual({ rateKey: 'Z8', label: 'Rest of World' });
    });
  });

  describe('determineFedexZone', () => {
    it('maps US to ZF', () => {
      expect(determineFedexZone('US')).toEqual({ rateKey: 'ZF', label: 'US/CA/NZ/MX' });
    });

    it('maps HK to ZV', () => {
      expect(determineFedexZone('HK')).toEqual({ rateKey: 'ZV', label: 'Hong Kong' });
    });

    it('maps CN to ZW', () => {
      expect(determineFedexZone('CN')).toEqual({ rateKey: 'ZW', label: 'China' });
    });

    it('maps DE to ZM', () => {
      expect(determineFedexZone('DE')).toEqual({ rateKey: 'ZM', label: 'Western Europe' });
    });

    it('falls back to ZJ for unknown country', () => {
      expect(determineFedexZone('XX')).toEqual({ rateKey: 'ZJ', label: 'Rest of World' });
    });
  });

  // --- UPS Cost Tests ---

  describe('calculateUpsCosts', () => {
    // UPS Z5 (US) exact table 최대 무게 = 20kg, Z5[20] = 660000
    // Range 요율은 backend 와 동일한 "base(maxExactRate) + overage × range_rate" 공식 사용
    // (backend mirror: smart-quote-api/app/services/calculators/base_rate_lookup.rb)

    it('uses fallback path for 20.3kg dead-zone (20 < w < 20.5 range min)', () => {
      // 20.3kg: exact miss (Z5[20.5] 미정의), range miss (20.3 < 20.5),
      // fallback 경로: ceil(20.3)=21 × UPS_RANGE_RATES[20.5-44].Z5(32100) = 674,100
      const result = calculateUpsCosts(20.3, 'US');
      expect(result.intlBase).toBe(21 * 32100);
    });

    it('uses 70.1-99 tier range rate for 80kg (base+overage formula)', () => {
      // Z5[20](660000) + (80 - 20) × 30500 = 2,490,000
      const result = calculateUpsCosts(80, 'US');
      expect(result.intlBase).toBe(660000 + (80 - 20) * 30500);
    });

    it('uses 299.1+ tier range rate for 350kg (base+overage formula)', () => {
      // Z5[20](660000) + (350 - 20) × 29200 = 10,296,000
      const result = calculateUpsCosts(350, 'US');
      expect(result.intlBase).toBe(660000 + (350 - 20) * 29200);
    });
  });

  // --- DHL Cost Tests ---

  describe('calculateDhlCosts', () => {
    it('returns correct exact rate for DHL Z1 at 1kg', () => {
      const result = calculateDhlCosts(1, 'CN');
      expect(result.intlBase).toBe(DHL_EXACT_RATES['Z1'][1]);
      expect(result.intlFsc).toBe(0); // FSC now calculated in orchestrator
      expect(result.intlWarRisk).toBe(0);
    });

    it('returns correct exact rate for DHL Z5 (US) at 5kg', () => {
      const result = calculateDhlCosts(5, 'US');
      expect(result.intlBase).toBe(DHL_EXACT_RATES['Z5'][5]);
    });

    it('uses range rate for DHL Z1 at 50kg (base+overage formula)', () => {
      // DHL Z1 exact max = 30kg. base + overage × range rate:
      //   Z1[30](630300) + (50 - 30) × 20400 = 1,038,300
      const result = calculateDhlCosts(50, 'CN');
      expect(result.intlBase).toBe(DHL_EXACT_RATES['Z1'][30] + (50 - 30) * 20400);
    });

    it('carrier function returns intlFsc=0 (FSC calculated in orchestrator)', () => {
      const result = calculateDhlCosts(1, 'CN');
      expect(result.intlFsc).toBe(0);
    });

    it('war risk is disabled (returns 0)', () => {
      const result = calculateDhlCosts(1, 'CN');
      expect(result.intlWarRisk).toBe(0);
    });
  });

  // --- FedEx Cost Tests ---

  describe('calculateFedexCosts', () => {
    it('returns correct exact rate for FedEx ZV (HK) at 1kg', () => {
      const result = calculateFedexCosts(1, 'HK');
      expect(result.intlBase).toBe(FEDEX_EXACT_RATES['ZV'][1]);
    });

    it('uses range rate for FedEx ZF (US) at 50kg (base+overage formula)', () => {
      // FedEx ZF exact max = 20.5kg. base + overage × range rate(44.1-99):
      //   ZF[20.5](630600) + (50 - 20.5) × 29100 = 1,489,050
      const result = calculateFedexCosts(50, 'US');
      expect(result.intlBase).toBe(FEDEX_EXACT_RATES['ZF'][20.5] + (50 - 20.5) * 29100);
    });
  });

  // --- EMAX Cost Tests ---

  describe('calculateEmaxCosts', () => {
    it('calculates EMAX CN at 10kg', () => {
      const result = calculateEmaxCosts(10, 'CN');
      // Exact rate for CN 10kg = 165000
      expect(result.intlBase).toBe(165000);
      expect(result.intlFsc).toBe(0);
      expect(result.intlWarRisk).toBe(0);
    });

    it('calculates EMAX VN at 5.3kg', () => {
      const result = calculateEmaxCosts(5.3, 'VN');
      // 5.3 rounds to 5.5kg -> exact rate for VN (Hanoi) 5.5kg = 79500
      expect(result.intlBase).toBe(79500);
    });

    it('defaults unknown country to VN rate', () => {
      const result = calculateEmaxCosts(1, 'TH');
      // 1kg VN fallback = 30000
      expect(result.intlBase).toBe(30000);
    });

    it('returns zero FSC and war risk', () => {
      const result = calculateEmaxCosts(10, 'CN');
      expect(result.intlFsc).toBe(0);
      expect(result.intlWarRisk).toBe(0);
    });
  });

  // --- OCS Zone Tests ---

  describe('determineOcsZone', () => {
    it('maps TW/HK/SG to Z1', () => {
      expect(determineOcsZone('TW')).toEqual({ rateKey: 'Z1', label: 'Z1/TW-HK-SG' });
      expect(determineOcsZone('HK')).toEqual({ rateKey: 'Z1', label: 'Z1/TW-HK-SG' });
      expect(determineOcsZone('SG')).toEqual({ rateKey: 'Z1', label: 'Z1/TW-HK-SG' });
    });

    it('maps CN to Z2', () => {
      expect(determineOcsZone('CN')).toEqual({ rateKey: 'Z2', label: 'Z2/CN' });
    });

    it('maps JP to Z3', () => {
      expect(determineOcsZone('JP')).toEqual({ rateKey: 'Z3', label: 'Z3/JP' });
    });

    it('falls back to Z1 (with unsupported label) for unsupported country', () => {
      expect(determineOcsZone('US')).toEqual({
        rateKey: 'Z1',
        label: 'OCS (unsupported, Z1 fallback)',
      });
    });
  });

  // --- OCS Cost Tests ---

  describe('calculateOcsCosts', () => {
    it('returns correct exact rate for OCS Z1 (TW) at 1kg', () => {
      const result = calculateOcsCosts(1, 'TW');
      expect(result.intlBase).toBe(OCS_EXACT_RATES['Z1'][1]);
      expect(result.intlFsc).toBe(0); // FSC computed in orchestrator
      expect(result.intlWarRisk).toBe(0);
    });

    it('returns correct exact rate for OCS Z2 (CN) at 5kg', () => {
      const result = calculateOcsCosts(5, 'CN');
      expect(result.intlBase).toBe(OCS_EXACT_RATES['Z2'][5]);
    });

    it('returns correct exact rate for OCS Z3 (JP) at 20kg', () => {
      const result = calculateOcsCosts(20, 'JP');
      expect(result.intlBase).toBe(OCS_EXACT_RATES['Z3'][20]);
    });

    it('uses range rate for OCS Z1 (TW) at 30kg (base+overage formula)', () => {
      // OCS Z1 exact max = 20kg (317,500). 30kg falls in 30~39.5 range (Z1 = 14710/kg).
      // base + (ceil(30) - 20) × range_rate = 317500 + 10 × 14710 = 464,600
      const result = calculateOcsCosts(30, 'TW');
      expect(result.intlBase).toBe(317500 + 10 * 14710);
    });

    it('uses range rate for OCS Z2 (CN) at 100kg (From-100 tier)', () => {
      // OCS Z2[20] = 349,930. From-100 Z2 = 18,320/kg.
      // 349930 + (100 - 20) × 18320 = 1,815,530
      const result = calculateOcsCosts(100, 'CN');
      expect(result.intlBase).toBe(349930 + 80 * 18320);
    });

    it('falls back to Z1 rate for unsupported country', () => {
      const result = calculateOcsCosts(1, 'US');
      expect(result.intlBase).toBe(OCS_EXACT_RATES['Z1'][1]);
      expect(result.appliedZone).toContain('unsupported');
    });
  });

  // --- calculateQuote() Integration Tests ---

  describe('calculateQuote', () => {
    const baseInput: QuoteInput = {
      originCountry: 'KR',
      destinationCountry: 'US',
      destinationZip: '10001',
      incoterm: Incoterm.DAP,
      packingType: PackingType.NONE,
      items: [{ id: '1', width: 30, length: 40, height: 30, weight: 10, quantity: 1 }],
      discountPercent: 15,
      dutyTaxEstimate: 0,
      exchangeRate: 1300,
      fscPercent: 30,
    };

    it('UPS quote: populates all breakdown fields', () => {
      const result = calculateQuote({ ...baseInput, overseasCarrier: 'UPS' });
      expect(result.carrier).toBe('UPS');
      expect(result.breakdown.intlBase).toBeGreaterThan(0);
      expect(result.breakdown.intlFsc).toBeGreaterThan(0);
      expect(result.breakdown.intlWarRisk).toBe(0);
      expect(result.totalQuoteAmount).toBeGreaterThan(0);
      expect(result.totalCostAmount).toBeGreaterThan(0);
    });

    it('DHL quote: uses DHL zone and rates', () => {
      const result = calculateQuote({
        ...baseInput,
        overseasCarrier: 'DHL',
        destinationCountry: 'JP',
      });
      expect(result.carrier).toBe('DHL');
      expect(result.appliedZone).toBe('Z2/Japan');
      expect(result.breakdown.intlBase).toBeGreaterThan(0);
    });

    it('FEDEX quote: uses FEDEX zone and rates', () => {
      const result = calculateQuote({
        ...baseInput,
        overseasCarrier: 'FEDEX',
        destinationCountry: 'US',
      });
      expect(result.carrier).toBe('FEDEX');
      expect(result.appliedZone).toBe('US/CA/NZ/MX');
      expect(result.breakdown.intlBase).toBeGreaterThan(0);
    });

    it('OCS quote: routes to OCS calculator and applies 10% FSC default', () => {
      const result = calculateQuote({
        ...baseInput,
        overseasCarrier: 'OCS',
        destinationCountry: 'TW',
        fscPercent: 10,
      });
      expect(result.carrier).toBe('OCS');
      expect(result.appliedZone).toContain('Z1');
      expect(result.breakdown.intlBase).toBe(OCS_EXACT_RATES['Z1'][10]);
      // FSC = baseWithDiscount × 10%, base discounted by 15%.
      const baseWithDiscount = OCS_EXACT_RATES['Z1'][10] * (1 - 0.15);
      expect(result.breakdown.intlFsc).toBe(Math.round(baseWithDiscount * 0.1));
    });

    it('OCS quote: surfaces coverage warning for unsupported destination', () => {
      const result = calculateQuote({
        ...baseInput,
        overseasCarrier: 'OCS',
        destinationCountry: 'US',
      });
      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('OCS only services')]),
      );
    });

    it('EMAX quote: uses 6000 volumetric divisor and EMAX rates', () => {
      const result = calculateQuote({
        ...baseInput,
        overseasCarrier: 'EMAX',
        destinationCountry: 'CN',
      });
      expect(result.carrier).toBe('EMAX');
      expect(result.appliedZone).toContain('E-MAX');
      // EMAX FSC is per-kg (CN: 930 KRW/kg, effective 2026-07-16~2026-07-31).
      // billable=10kg → 9300 KRW.
      // (15-day variable per KG policy)
      expect(result.breakdown.intlFsc).toBe(9300);
      expect(result.breakdown.intlWarRisk).toBe(0);
    });

    it('discount calculation: target revenue rounded up to 100', () => {
      const result = calculateQuote(baseInput);
      // discount calculation applies (1-discount%) to base rate
      expect(result.totalQuoteAmount % 100).toBe(0);
      expect(result.discountAmount).toBeGreaterThan(0);
      expect(result.discountPercent).toBeGreaterThan(0);
    });

    it('EXW incoterm: shows Collect Term warning', () => {
      const result = calculateQuote({ ...baseInput, incoterm: Incoterm.EXW });
      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('Collect Term')]),
      );
      // EXW and DAP produce same quote (discount on base rate, FSC on discounted base)
      // EXW only adds a warning that freight may be billed to consignee
      const dapResult = calculateQuote({ ...baseInput, incoterm: Incoterm.DAP });
      expect(result.totalQuoteAmount).toBe(dapResult.totalQuoteAmount);
    });

    it('defaults to UPS when no carrier specified', () => {
      const result = calculateQuote({ ...baseInput, overseasCarrier: undefined });
      expect(result.carrier).toBe('UPS');
    });

    it('surge is 0 by default (auto-calc disabled)', () => {
      const result = calculateQuote({ ...baseInput, overseasCarrier: 'UPS' });
      expect(result.breakdown.intlSurge).toBe(0);
    });

    it('manual surge cost is applied when provided', () => {
      const result = calculateQuote({
        ...baseInput,
        overseasCarrier: 'UPS',
        manualSurgeCost: 50000,
      });
      expect(result.breakdown.intlSurge).toBe(50000);
      expect(result.totalCostAmount).toBeGreaterThan(
        calculateQuote({ ...baseInput, overseasCarrier: 'UPS' }).totalCostAmount,
      );
    });

    it('manual surge cost works for DHL too', () => {
      const result = calculateQuote({
        ...baseInput,
        overseasCarrier: 'DHL',
        destinationCountry: 'JP',
        manualSurgeCost: 30000,
      });
      expect(result.breakdown.intlSurge).toBe(30000);
    });

    it('manual surge cost works for EMAX too', () => {
      const result = calculateQuote({
        ...baseInput,
        overseasCarrier: 'EMAX',
        destinationCountry: 'CN',
        manualSurgeCost: 20000,
      });
      expect(result.breakdown.intlSurge).toBe(20000);
      expect(result.totalCostAmount).toBeGreaterThan(
        calculateQuote({ ...baseInput, overseasCarrier: 'EMAX', destinationCountry: 'CN' })
          .totalCostAmount,
      );
    });

    it('VACUUM packing: labor cost is 1.5x per item, not compounding', () => {
      const singleItem = calculateQuote({
        ...baseInput,
        packingType: PackingType.VACUUM,
        items: [{ id: '1', width: 30, length: 30, height: 30, weight: 5, quantity: 1 }],
      });
      const threeItems = calculateQuote({
        ...baseInput,
        packingType: PackingType.VACUUM,
        items: [{ id: '1', width: 30, length: 30, height: 30, weight: 5, quantity: 3 }],
      });
      // Labor should be exactly 3x for 3 items (not 1.5^3 = 3.375x)
      expect(threeItems.breakdown.packingLabor).toBe(singleItem.breakdown.packingLabor * 3);
    });
  });

  // --- Per-Box Billable Weight (multi-box, 2+ boxes) ---
  // E-MAX confirmed rule: for shipments of 2+ boxes, round each box's chargeable
  // weight up to 0.5kg individually, then sum.
  // billableWeight = Σᵢ roundToHalf( max(actualᵢ, volumetricᵢ) )  [per physical box]
  // Single box (Σquantity === 1) keeps the legacy max-of-totals behavior unchanged.
  describe('per-box billable weight (multi-box)', () => {
    const base: QuoteInput = {
      originCountry: 'KR',
      destinationCountry: 'US',
      destinationZip: '10001',
      incoterm: Incoterm.DAP,
      packingType: PackingType.NONE,
      items: [],
      discountPercent: 0,
      dutyTaxEstimate: 0,
      exchangeRate: 1300,
      fscPercent: 30,
    };

    it('multi-box mixed density: sums per-box chargeable (UPS /5000)', () => {
      // Box A 50×40×30 wt5 → vol 12, max(5,12)=12 → 12.0
      // Box B 10×10×10 wt20 → vol 0.2, max(20,0.2)=20 → 20.0
      // Per-box: 12 + 20 = 32.  Legacy max-of-totals would be max(25, 12.2) = 25.
      const result = calculateQuote({
        ...base,
        overseasCarrier: 'UPS',
        items: [
          { id: 'A', length: 50, width: 40, height: 30, weight: 5, quantity: 1 },
          { id: 'B', length: 10, width: 10, height: 10, weight: 20, quantity: 1 },
        ],
      });
      expect(result.billableWeight).toBe(32);
    });

    it('per-box 0.5kg rounding accumulates across quantity (UPS /5000)', () => {
      // Box 30×20×15 wt1 → vol 1.8, max(1,1.8)=1.8 → roundToHalf 2.0; ×3 = 6.0
      // Legacy would be max(actual 3, vol 5.4) = 5.4.
      const result = calculateQuote({
        ...base,
        overseasCarrier: 'UPS',
        items: [{ id: 'A', length: 30, width: 20, height: 15, weight: 1, quantity: 3 }],
      });
      expect(result.billableWeight).toBe(6);
    });

    it('single box (Σqty=1) keeps legacy raw max-of-totals (no rounding)', () => {
      // Box 30×20×15 wt1 → vol 1.8, max(1,1.8)=1.8 → stays 1.8 (single box, unchanged)
      const result = calculateQuote({
        ...base,
        overseasCarrier: 'UPS',
        items: [{ id: 'A', length: 30, width: 20, height: 15, weight: 1, quantity: 1 }],
      });
      expect(result.billableWeight).toBeCloseTo(1.8, 5);
    });

    it('EMAX multi-box: per-box chargeable on /6000 divisor flows into per-kg FSC', () => {
      // Box A 60×50×40 wt1 → vol 120000/6000=20, max(1,20)=20 → 20
      // Box B 10×10×10 wt30 → vol 1000/6000≈0.167, max(30,0.167)=30 → 30
      // Per-box billable = 50.  Legacy max-of-totals = max(31, 20.167) = 31.
      // EMAX FSC (CN 930 KRW/kg, effective 2026-07-16~2026-07-31):
      // roundToHalf(50) × 930 = 46500.
      const result = calculateQuote({
        ...base,
        overseasCarrier: 'EMAX',
        destinationCountry: 'CN',
        items: [
          { id: 'A', length: 60, width: 50, height: 40, weight: 1, quantity: 1 },
          { id: 'B', length: 10, width: 10, height: 10, weight: 30, quantity: 1 },
        ],
      });
      expect(result.billableWeight).toBe(50);
      expect(result.breakdown.intlFsc).toBe(46500);
    });
  });
});
