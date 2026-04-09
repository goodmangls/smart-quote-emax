import { describe, it, expect } from 'vitest';
import {
  determineUpsZone,
  determineDhlZone,
  determineFedexZone,
  calculateDhlCosts,
  calculateFedexCosts,
  calculateEmaxCosts,
  calculateUpsCosts,
  calculateQuote,
} from './calculationService';
import { PackingType, Incoterm, QuoteInput } from '@/types';
import { DHL_EXACT_RATES } from '@/config/dhl_tariff';
import { FEDEX_EXACT_RATES } from '@/config/fedex_tariff';

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
    it('uses 21-70 tier range rate for 20.3kg (boundary test)', () => {
      // 20.3kg > 20kg exact table max → should use 21-44 range rate
      // ceil(20.3) = 21, 21 * Z5 per-kg rate (24412) = 512652
      const result = calculateUpsCosts(20.3, 'US');
      expect(result.intlBase).toBe(21 * 24412);
    });

    it('uses 71-299 tier range rate for 80kg', () => {
      const result = calculateUpsCosts(80, 'US');
      expect(result.intlBase).toBe(80 * 23195);
    });

    it('uses 300+ tier range rate for 350kg', () => {
      const result = calculateUpsCosts(350, 'US');
      expect(result.intlBase).toBe(350 * 22207);
    });
  });

  // --- DHL Cost Tests ---

  describe('calculateDhlCosts', () => {
    it('returns correct exact rate for DHL Z1 at 1kg', () => {
      const result = calculateDhlCosts(1, 'CN');
      expect(result.intlBase).toBe(106688);
      expect(result.intlFsc).toBe(0); // FSC now calculated in orchestrator
      expect(result.intlWarRisk).toBe(0);
    });

    it('returns correct exact rate for DHL Z5 (US) at 5kg', () => {
      const result = calculateDhlCosts(5, 'US');
      expect(result.intlBase).toBe(DHL_EXACT_RATES['Z5'][5]);
    });

    it('uses range rate for DHL Z1 at 50kg', () => {
      const result = calculateDhlCosts(50, 'CN');
      expect(result.intlBase).toBe(50 * 13577);
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

    it('uses range rate for FedEx ZF (US) at 50kg', () => {
      const result = calculateFedexCosts(50, 'US');
      // 50 * ZF rate at [44.1-70] range (22000) = 1100000
      expect(result.intlBase).toBe(50 * 22000);
    });
  });

  // --- EMAX Cost Tests ---

  describe('calculateEmaxCosts', () => {
    it('calculates EMAX CN at 10kg', () => {
      const result = calculateEmaxCosts(10, 'CN');
      // ceil(10) * 13500 + 15000 = 150000
      expect(result.intlBase).toBe(150000);
      expect(result.intlFsc).toBe(0);
      expect(result.intlWarRisk).toBe(0);
    });

    it('calculates EMAX VN at 5.3kg', () => {
      const result = calculateEmaxCosts(5.3, 'VN');
      // ceil(5.3) * 10000 + 15000 = 75000
      expect(result.intlBase).toBe(75000);
    });

    it('defaults unknown country to VN rate', () => {
      const result = calculateEmaxCosts(1, 'TH');
      // ceil(1) * 10000 + 15000 = 25000
      expect(result.intlBase).toBe(25000);
    });

    it('returns zero FSC and war risk', () => {
      const result = calculateEmaxCosts(10, 'CN');
      expect(result.intlFsc).toBe(0);
      expect(result.intlWarRisk).toBe(0);
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

    it('EMAX quote: uses 6000 volumetric divisor and EMAX rates', () => {
      const result = calculateQuote({
        ...baseInput,
        overseasCarrier: 'EMAX',
        destinationCountry: 'CN',
      });
      expect(result.carrier).toBe('EMAX');
      expect(result.appliedZone).toContain('E-MAX');
      expect(result.breakdown.intlFsc).toBe(0);
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
        expect.arrayContaining([expect.stringContaining('Collect Term')])
      );
      // New structure: EXW and DAP produce same quote (margin on base rate, FSC on base+margin)
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
      const result = calculateQuote({ ...baseInput, overseasCarrier: 'UPS', manualSurgeCost: 50000 });
      expect(result.breakdown.intlSurge).toBe(50000);
      expect(result.totalCostAmount).toBeGreaterThan(
        calculateQuote({ ...baseInput, overseasCarrier: 'UPS' }).totalCostAmount
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
        calculateQuote({ ...baseInput, overseasCarrier: 'EMAX', destinationCountry: 'CN' }).totalCostAmount
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
});
