import { QuoteInput, QuoteResult, PackingType, Incoterm, CargoItem } from '@/types';
import {
  FUMIGATION_FEE,
  DEFAULT_EXCHANGE_RATE,
  PACKING_MATERIAL_BASE_COST,
  PACKING_LABOR_UNIT_COST,
  WAR_RISK_SURCHARGE_RATE,
  TRANSIT_TIMES,
} from '@/config/rates';
import { UPS_EXACT_RATES, UPS_RANGE_RATES } from '@/config/ups_tariff';
import { DHL_EXACT_RATES, DHL_RANGE_RATES } from '@/config/dhl_tariff';
import { FEDEX_EXACT_RATES, FEDEX_RANGE_RATES } from '@/config/fedex_tariff';
import { EMAX_RATES, EMAX_HANDLING_CHARGE } from '@/config/emax_tariff';
import {
  OCS_EXACT_RATES,
  OCS_RANGE_RATES,
  OCS_HANDLING_CHARGE,
  OCS_SUPPORTED_COUNTRIES,
} from '@/config/ocs_tariff';
import { determineOcsZone } from '@/config/ocs_zones';
import { applyPackingDimensions } from '@/lib/packing-utils';
import { MAX_DISCOUNT_PERCENT } from '@/config/business-rules';
import { calculateDhlAddOnCosts } from './dhlAddonCalculator';
import { calculateUpsAddOnCosts } from './upsAddonCalculator';

// --- Types for Internal Calculations ---
interface ItemCalculationResult {
  totalActualWeight: number;
  totalPackedVolumetricWeight: number;
  packingMaterialCost: number;
  packingLaborCost: number;
  warnings: string[];
}

interface CarrierCostResult {
  intlBase: number;
  intlFsc: number;
  intlWarRisk: number;
  appliedZone: string;
  transitTime: string;
}

// --- Helper Functions ---

export const calculateVolumetricWeight = (
  l: number,
  w: number,
  h: number,
  divisor: number = 5000,
) => {
  return (Math.ceil(l) * Math.ceil(w) * Math.ceil(h)) / divisor;
};

// --- Zone Mappings (extracted to config files) ---
import { determineUpsZone } from '@/config/ups_zones';
import { determineDhlZone } from '@/config/dhl_zones';
import { determineFedexZone } from '@/config/fedex_zones';
export { determineUpsZone, determineDhlZone, determineFedexZone };

// --- Common Rate Lookup for UPS/DHL ---
const roundToHalf = (num: number) => Math.ceil(num * 2) / 2;

type ExactRateTable = Record<string, Record<number, number>>;
type RangeRateEntry = { min: number; max: number; rates: Record<string, number> };

const lookupCarrierRate = (
  billableWeight: number,
  zoneKey: string,
  exactRates: ExactRateTable,
  rangeRates: RangeRateEntry[],
): number => {
  const lookupWeight = roundToHalf(billableWeight);
  const zoneRates = exactRates[zoneKey];

  if (zoneRates && zoneRates[lookupWeight]) {
    return zoneRates[lookupWeight];
  }

  const range = rangeRates.find((r) => billableWeight >= r.min && billableWeight <= r.max);
  if (range && range.rates[zoneKey]) {
    const weights = Object.keys(zoneRates)
      .map(Number)
      .sort((a, b) => a - b);
    const maxExactWeight = weights[weights.length - 1];
    const maxExactRate = zoneRates[maxExactWeight];
    const overageKg = Math.ceil(billableWeight) - maxExactWeight;
    return maxExactRate + overageKg * range.rates[zoneKey];
  }

  if (zoneRates) {
    const weights = Object.keys(zoneRates)
      .map(Number)
      .sort((a, b) => a - b);
    const found = weights.find((w) => w >= lookupWeight);
    if (found) return zoneRates[found];

    const nextRange = rangeRates.find((r) => r.min <= Math.ceil(billableWeight));
    if (nextRange && nextRange.rates[zoneKey]) {
      return Math.ceil(billableWeight) * nextRange.rates[zoneKey];
    }
  }

  throw new Error(`Rate not found: zone=${zoneKey}, weight=${billableWeight}kg`);
};

// Surge auto-calc disabled; manual surge input applies to all carriers via calculateQuote().
export const calculateItemCosts = (
  items: CargoItem[],
  packingType: PackingType,
  manualPackingCost?: number,
  volumetricDivisor: number = 5000,
): ItemCalculationResult => {
  let totalActualWeight = 0;
  let totalPackedVolumetricWeight = 0;
  let packingMaterialCost = 0;
  let packingLaborCost = 0;
  const warnings: string[] = [];

  items.forEach((item) => {
    const packed = applyPackingDimensions(
      item.length,
      item.width,
      item.height,
      item.weight,
      packingType,
    );
    const { l, w, h, weight } = packed;

    // Packing impact
    if (packingType !== PackingType.NONE) {
      const surfaceAreaM2 = (2 * (l * w + l * h + w * h)) / 10000;
      packingMaterialCost += surfaceAreaM2 * PACKING_MATERIAL_BASE_COST * item.quantity;
      const laborPerItem =
        packingType === PackingType.VACUUM
          ? PACKING_LABOR_UNIT_COST * 1.5
          : PACKING_LABOR_UNIT_COST;
      packingLaborCost += laborPerItem * item.quantity;
    }

    // Surge/AHS auto-calculation disabled — manual input via QuoteInput.manualSurgeCost.
    // Applies to all carriers (UPS, DHL, EMAX). See calculateQuote() for integration.

    totalActualWeight += weight * item.quantity;
    totalPackedVolumetricWeight +=
      calculateVolumetricWeight(l, w, h, volumetricDivisor) * item.quantity;
  });

  // Manual Override Logic
  if (manualPackingCost !== undefined && manualPackingCost >= 0) {
    packingMaterialCost = manualPackingCost;
    packingLaborCost = 0;
  }

  return {
    totalActualWeight,
    totalPackedVolumetricWeight,
    packingMaterialCost,
    packingLaborCost,
    warnings,
  };
};

export const calculateUpsCosts = (billableWeight: number, country: string): CarrierCostResult => {
  const zoneInfo = determineUpsZone(country);
  const intlBase = lookupCarrierRate(
    billableWeight,
    zoneInfo.rateKey,
    UPS_EXACT_RATES,
    UPS_RANGE_RATES as RangeRateEntry[],
  );
  const intlWarRisk = intlBase * (WAR_RISK_SURCHARGE_RATE / 100);
  return {
    intlBase,
    intlFsc: 0, // FSC calculated in orchestrator
    intlWarRisk,
    appliedZone: zoneInfo.label,
    transitTime: TRANSIT_TIMES.UPS,
  };
};

// --- DHL Calculator ---

export const calculateDhlCosts = (billableWeight: number, country: string): CarrierCostResult => {
  const zoneInfo = determineDhlZone(country);
  const intlBase = lookupCarrierRate(
    billableWeight,
    zoneInfo.rateKey,
    DHL_EXACT_RATES,
    DHL_RANGE_RATES as RangeRateEntry[],
  );
  const intlWarRisk = intlBase * (WAR_RISK_SURCHARGE_RATE / 100);
  return {
    intlBase,
    intlFsc: 0, // FSC calculated in orchestrator
    intlWarRisk,
    appliedZone: zoneInfo.label,
    transitTime: TRANSIT_TIMES.DHL,
  };
};

// --- FedEx Calculator ---

export const calculateFedexCosts = (billableWeight: number, country: string): CarrierCostResult => {
  const zoneInfo = determineFedexZone(country);
  const intlBase = lookupCarrierRate(
    billableWeight,
    zoneInfo.rateKey,
    FEDEX_EXACT_RATES,
    FEDEX_RANGE_RATES as RangeRateEntry[],
  );
  const intlWarRisk = intlBase * (WAR_RISK_SURCHARGE_RATE / 100);
  return {
    intlBase,
    intlFsc: 0, // FSC calculated in orchestrator
    intlWarRisk,
    appliedZone: zoneInfo.label,
    transitTime: TRANSIT_TIMES.FEDEX,
  };
};

// --- OCS Calculator ---

export const calculateOcsCosts = (billableWeight: number, country: string): CarrierCostResult => {
  const zoneInfo = determineOcsZone(country);
  const intlBase =
    lookupCarrierRate(
      billableWeight,
      zoneInfo.rateKey,
      OCS_EXACT_RATES,
      OCS_RANGE_RATES as RangeRateEntry[],
    ) + OCS_HANDLING_CHARGE;
  return {
    intlBase,
    intlFsc: 0, // FSC calculated in orchestrator (percentage on discounted base)
    intlWarRisk: 0,
    appliedZone: zoneInfo.label,
    transitTime: TRANSIT_TIMES.OCS,
  };
};

// --- EMAX Calculator ---

export const calculateEmaxCosts = (billableWeight: number, country: string): CarrierCostResult => {
  const countryKey = country === 'CN' ? 'CN' : 'VN';
  const perKgRate = EMAX_RATES[countryKey] ?? EMAX_RATES['VN'];
  const intlBase = Math.ceil(billableWeight) * perKgRate + EMAX_HANDLING_CHARGE;

  return {
    intlBase,
    intlFsc: 0,
    intlWarRisk: 0,
    appliedZone: `E-MAX ${countryKey}`,
    transitTime: TRANSIT_TIMES.EMAX,
  };
};

// --- Main Orchestrator ---

export const calculateQuote = (input: QuoteInput): QuoteResult => {
  const carrier = input.overseasCarrier || 'UPS';
  const isEmax = carrier === 'EMAX';
  const volumetricDivisor = isEmax ? 6000 : 5000;

  // 1. Calculate Item Costs (Packing, Surge, Weights)
  const itemResult = calculateItemCosts(
    input.items,
    input.packingType,
    input.manualPackingCost,
    volumetricDivisor,
  );

  let packingFumigationCost = 0;
  if (input.packingType !== PackingType.NONE) {
    packingFumigationCost = FUMIGATION_FEE;
  }

  // Packing & Docs = user-entered manualPackingCost only. No auto handling fee.
  // When manualPackingCost is set: material=override, labor=0, fumigation=0, handling=0
  // When manualPackingCost is empty: material=auto, labor=auto, fumigation=auto, handling=0
  if (input.manualPackingCost !== undefined && input.manualPackingCost >= 0) {
    packingFumigationCost = 0;
  }

  const packingTotal =
    itemResult.packingMaterialCost + itemResult.packingLaborCost + packingFumigationCost;

  // 2. Billable Weight
  const billableWeight = Math.max(
    itemResult.totalActualWeight,
    itemResult.totalPackedVolumetricWeight,
  );
  const userWarnings = [...itemResult.warnings];

  if (itemResult.totalPackedVolumetricWeight > itemResult.totalActualWeight * 1.2) {
    userWarnings.push('High Volumetric Weight Detected (>20% over actual). Consider Repacking.');
  }

  // EMAX only services CN/VN routes from Korea
  if (carrier === 'EMAX' && !['CN', 'VN'].includes(input.destinationCountry)) {
    userWarnings.push(
      'EMAX only services China (CN) and Vietnam (VN). Using VN fallback rate — verify with carrier.',
    );
  }

  // OCS only services 5 routes (TW/HK/SG/CN/JP) from Korea
  if (
    carrier === 'OCS' &&
    !OCS_SUPPORTED_COUNTRIES.includes(
      input.destinationCountry as (typeof OCS_SUPPORTED_COUNTRIES)[number],
    )
  ) {
    userWarnings.push(
      'OCS only services Taiwan (TW), Hong Kong (HK), Singapore (SG), China (CN), and Japan (JP). Using Z1 fallback rate — verify with carrier.',
    );
  }

  // 3. Carrier Costs (routing by carrier)
  let carrierResult: CarrierCostResult;
  switch (carrier) {
    case 'DHL':
      carrierResult = calculateDhlCosts(billableWeight, input.destinationCountry);
      break;
    case 'FEDEX':
      carrierResult = calculateFedexCosts(billableWeight, input.destinationCountry);
      break;
    case 'EMAX':
      carrierResult = calculateEmaxCosts(billableWeight, input.destinationCountry);
      break;
    case 'OCS':
      carrierResult = calculateOcsCosts(billableWeight, input.destinationCountry);
      break;
    default:
      carrierResult = calculateUpsCosts(billableWeight, input.destinationCountry);
      break;
  }

  // System surcharges from DB (War Risk, PSS, EBS, etc.)
  const manualSurgeCost = input.manualSurgeCost ?? 0;
  let systemSurchargeTotal = 0;
  let appliedSurcharges:
    | NonNullable<import('@/types').CostBreakdown['appliedSurcharges']>
    | undefined;

  if (input.resolvedSurcharges && input.resolvedSurcharges.length > 0) {
    const applied = input.resolvedSurcharges.map((s) => {
      const appliedAmount =
        s.chargeType === 'rate'
          ? Math.round((carrierResult.intlBase * s.amount) / 100)
          : Math.round(s.amount);
      return {
        code: s.code,
        name: s.name,
        nameKo: s.nameKo ?? undefined,
        chargeType: s.chargeType,
        amount: s.amount,
        appliedAmount,
        sourceUrl: s.sourceUrl ?? undefined,
      };
    });
    systemSurchargeTotal = applied.reduce((sum, s) => sum + s.appliedAmount, 0);
    appliedSurcharges = applied;
  }

  const surgeCost = systemSurchargeTotal + manualSurgeCost;

  // 3a. Carrier Add-on Services (DHL or UPS)
  let carrierAddOnTotal = 0;
  let carrierAddOnDetails:
    | NonNullable<import('@/types').CostBreakdown['carrierAddOnDetails']>
    | undefined;
  if (carrier === 'DHL') {
    const dhlAddOns = calculateDhlAddOnCosts(input, billableWeight, input.fscPercent);
    carrierAddOnTotal = dhlAddOns.total;
    carrierAddOnDetails = dhlAddOns.details.length > 0 ? dhlAddOns.details : undefined;
  } else if (carrier === 'UPS') {
    const upsAddOns = calculateUpsAddOnCosts(input, billableWeight, input.fscPercent);
    carrierAddOnTotal = upsAddOns.total;
    carrierAddOnDetails = upsAddOns.details.length > 0 ? upsAddOns.details : undefined;
  }

  // 4. Duty
  let destDuty = 0;
  if (input.incoterm === Incoterm.DDP) {
    destDuty = input.dutyTaxEstimate;
  }

  // 4a. Extra Pick-up in Seoul cost
  const pickupInSeoul = input.pickupInSeoulCost ?? 0;

  // 5. Calculation Structure (할인율 기반):
  //    Step 1: Base Rate (캐리어 정가 tariff)
  //    Step 2: 할인 적용 (정가 × (1 - 할인율%))
  //    Step 3: FSC (할인 적용 후 Base × FSC%)
  //    Step 4: + Add-ons (Packing, Seoul Pickup, Surcharges, Carrier Add-ons, Duty)
  //    = Final Quote

  const exchangeRate = input.exchangeRate || DEFAULT_EXCHANGE_RATE;
  const safeDiscountPercent = Math.min(
    Math.max(input.discountPercent ?? 0, 0),
    MAX_DISCOUNT_PERCENT,
  );
  const baseRate = carrierResult.intlBase;

  // Step 2: 정가에서 할인 적용 (base × (1 - discount%))
  const baseWithDiscount = baseRate * (1 - safeDiscountPercent / 100);
  const discountAmount = baseRate - baseWithDiscount;

  // Step 3: FSC on discounted base — EMAX has no percentage FSC, it is per-kg
  let intlFscNew = 0;
  let fscRate = 0;
  if (carrier === 'EMAX') {
    // E-MAX FSC is 15-day variable per KG. Valid until May 15.
    const emaxFscPerKg = input.destinationCountry === 'CN' ? 2000 : 2100;
    intlFscNew = Math.round(billableWeight * emaxFscPerKg);
  } else {
    fscRate = (input.fscPercent || 0) / 100;
    intlFscNew = Math.round(baseWithDiscount * fscRate);
  }

  // Step 4: Add-ons (할인 미적용)
  const addOnTotal =
    packingTotal +
    pickupInSeoul +
    surgeCost +
    carrierAddOnTotal +
    destDuty +
    carrierResult.intlWarRisk;

  // Collect term handling
  if ([Incoterm.EXW, Incoterm.FOB].includes(input.incoterm)) {
    userWarnings.push(
      'Collect Term: International Freight calculated for reference but may be billed to Consignee/Partner.',
    );
  }

  // Final totals — costFsc is the FSC on 정가 base (할인 전), totalCostAmount is 정가 기준 총액
  const costFsc = carrier === 'EMAX' ? intlFscNew : Math.round(baseRate * fscRate);
  const totalCostAmount =
    baseRate +
    costFsc +
    carrierResult.intlWarRisk +
    surgeCost +
    packingTotal +
    carrierAddOnTotal +
    destDuty +
    pickupInSeoul;
  const rawQuoteAmount = baseWithDiscount + intlFscNew + addOnTotal;
  const totalQuoteAmount = Math.ceil(rawQuoteAmount / 100) * 100; // Round up to nearest 100 KRW
  const totalQuoteAmountUSD = totalQuoteAmount / exchangeRate;

  if (safeDiscountPercent >= 65) {
    userWarnings.push('High Discount Alert: Discount is 65% or above. Verification recommended.');
  }

  return {
    totalQuoteAmount,
    totalQuoteAmountUSD,
    totalCostAmount,
    discountAmount,
    discountPercent: Math.round(safeDiscountPercent * 100) / 100,
    currency: 'KRW',
    totalActualWeight: itemResult.totalActualWeight,
    totalVolumetricWeight: itemResult.totalPackedVolumetricWeight,
    billableWeight,
    appliedZone: carrierResult.appliedZone,
    transitTime: carrierResult.transitTime,
    carrier,
    warnings: userWarnings,
    breakdown: {
      packingMaterial: itemResult.packingMaterialCost,
      packingLabor: itemResult.packingLaborCost,
      packingFumigation: packingFumigationCost,
      handlingFees: 0,
      pickupInSeoul,
      intlBase: baseRate,
      intlFsc: intlFscNew,
      intlWarRisk: carrierResult.intlWarRisk,
      intlSurge: surgeCost,
      intlSystemSurcharge: systemSurchargeTotal || undefined,
      intlManualSurge: manualSurgeCost || undefined,
      appliedSurcharges,
      carrierAddOnTotal: carrierAddOnTotal || undefined,
      carrierAddOnDetails: carrierAddOnDetails,
      destDuty,
      totalCost: totalCostAmount,
    },
  };
};
