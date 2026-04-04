/**
 * DHL Add-on Cost Calculator
 * Extracted from calculationService.ts for modularity.
 */
import type { QuoteInput, CostBreakdown } from "@/types";
import type { AddonRateLike } from "@/config/addon-utils";
import { calcAddonFee, findRate } from "@/config/addon-utils";
import {
  DHL_ADDON_RATES,
  isDhlOversizePiece,
  isDhlOverWeight,
  calculateRemoteAreaFee,
  calculateInsuranceFee,
} from "@/config/dhl_addons";
import { applyPackingDimensions } from "@/lib/packing-utils";

export type CarrierAddOnDetails = NonNullable<CostBreakdown["carrierAddOnDetails"]>;

export const calculateDhlAddOnCosts = (
  input: QuoteInput,
  billableWeight: number,
  fscPercent: number
): { total: number; details: CarrierAddOnDetails } => {
  const fscRate = (fscPercent || 0) / 100;
  const details: CarrierAddOnDetails = [];
  let total = 0;

  // Use DB rates if available, otherwise hardcoded
  const dbRates = input.resolvedAddonRates?.filter(r => r.carrier === 'DHL');
  const useDb = dbRates && dbRates.length > 0;

  const findDhlRate = (code: string): AddonRateLike | null =>
    findRate(code, useDb ? dbRates : undefined, DHL_ADDON_RATES);

  // 1. Auto-detected: OSP and OWT
  let ospCount = 0;
  let owtCount = 0;
  const ospDef = findDhlRate("OSP");
  const owtDef = findDhlRate("OWT");

  input.items.forEach((item) => {
    const packed = applyPackingDimensions(item.length, item.width, item.height, item.weight, input.packingType);
    const { l, w, h, weight } = packed;

    // OSP detection using DB detectRules or hardcoded
    if (useDb && ospDef?.detectRules) {
      const rules = ospDef.detectRules;
      const maxL = (rules.max_longest as number) ?? 100;
      const maxS = (rules.max_second as number) ?? 80;
      const sorted = [l, w, h].sort((a, b) => b - a);
      if (sorted[0] > maxL || sorted[1] > maxS) ospCount += item.quantity;
    } else {
      if (isDhlOversizePiece(l, w, h)) ospCount += item.quantity;
    }

    // OWT detection
    if (useDb && owtDef?.detectRules) {
      const threshold = (owtDef.detectRules.weight_threshold as number) ?? 70;
      if (weight > threshold) owtCount += item.quantity;
    } else {
      if (isDhlOverWeight(weight)) owtCount += item.quantity;
    }
  });

  if (ospCount > 0 && ospDef) {
    const amount = ospDef.amount * ospCount;
    const fsc = ospDef.fscApplicable ? amount * fscRate : 0;
    details.push({ code: "OSP", nameKo: ospDef.nameKo, nameEn: ospDef.nameEn, amount, fscAmount: fsc });
    total += amount + fsc;
  }
  if (owtCount > 0 && owtDef) {
    const amount = owtDef.amount * owtCount;
    const fsc = owtDef.fscApplicable ? amount * fscRate : 0;
    details.push({ code: "OWT", nameKo: owtDef.nameKo, nameEn: owtDef.nameEn, amount, fscAmount: fsc });
    total += amount + fsc;
  }

  // 2. User-selected add-ons
  const selectedCodes = input.dhlAddOns || [];
  selectedCodes.forEach((code) => {
    const addon = findDhlRate(code);
    if (!addon) return;

    let amount: number;
    if (useDb) {
      amount = calcAddonFee(addon, billableWeight, input.dhlDeclaredValue || 0);
      if (code === "IRR" && addon.chargeType === 'per_piece') {
        const totalPieces = input.items.reduce((s, i) => s + i.quantity, 0);
        amount = addon.amount * totalPieces;
      }
    } else {
      amount = addon.amount;
      if (code === "RMT") amount = calculateRemoteAreaFee(billableWeight);
      if (code === "INS") amount = calculateInsuranceFee(input.dhlDeclaredValue || 0);
      if (code === "IRR") {
        const totalPieces = input.items.reduce((s, i) => s + i.quantity, 0);
        amount = addon.amount * totalPieces;
      }
    }

    const fsc = addon.fscApplicable ? amount * fscRate : 0;
    details.push({ code, nameKo: addon.nameKo, nameEn: addon.nameEn, amount, fscAmount: fsc });
    total += amount + fsc;
  });

  return { total, details };
};
