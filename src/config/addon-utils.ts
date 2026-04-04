/**
 * Shared addon rate utilities for DHL/UPS add-on cost calculations.
 * Consolidates duplicated types, interfaces, and functions from
 * calculationService.ts, DhlAddOnPanel.tsx, and UpsAddOnPanel.tsx.
 */

import { DHL_ADDON_RATES } from '@/config/dhl_addons';
import { UPS_ADDON_RATES } from '@/config/ups_addons';
import type { AddonRate } from '@/api/addonRateApi';

// ── Shared Types (used in calculationService.ts) ──

export type AddonRateLike = {
  code: string;
  nameKo: string;
  nameEn: string;
  amount: number;
  chargeType: string;
  fscApplicable: boolean;
  perKgRate?: number | null;
  ratePercent?: number | null;
  minAmount?: number | null;
  detectRules?: Record<string, number | string[]> | null;
};

// ── Shared NormalizedRate (used in UI panels) ──

export interface NormalizedRate {
  code: string;
  nameKo: string;
  nameEn: string;
  amount: number;
  chargeType: string;
  unit: string;
  fscApplicable: boolean;
  autoDetect: boolean;
  selectable: boolean;
  condition?: string | null;
  perKgRate: number | null;
  ratePercent: number | null;
  minAmount: number | null;
  detectRules: Record<string, number | string[]> | null;
}

// ── DHL rate defaults for hardcoded fallback ──

const DHL_HARDCODED_DEFAULTS: Record<string, { perKgRate: number | null; ratePercent: number | null; minAmount: number | null; detectRules: Record<string, number | string[]> | null }> = {
  RMT: { perKgRate: 750, ratePercent: null, minAmount: 35000, detectRules: null },
  INS: { perKgRate: null, ratePercent: 1.0, minAmount: 17000, detectRules: null },
  OSP: { perKgRate: null, ratePercent: null, minAmount: null, detectRules: { max_longest: 100, max_second: 80 } },
  OWT: { perKgRate: null, ratePercent: null, minAmount: null, detectRules: { weight_threshold: 70 } },
};

// ── UPS rate defaults for hardcoded fallback ──

const UPS_HARDCODED_DEFAULTS: Record<string, { perKgRate: number | null; minAmount: number | null; detectRules: Record<string, number | string[]> | null }> = {
  RMT: { perKgRate: 570, minAmount: 31400, detectRules: null },
  EXT: { perKgRate: 640, minAmount: 34200, detectRules: null },
  AHS: { perKgRate: null, minAmount: null, detectRules: { weight_threshold: 25, max_longest: 122, max_second: 76, packing_types: ['WOODEN_BOX', 'SKID'] } },
};

// ── Shared normalizeRates function ──

export function normalizeDhlRates(dbRates?: AddonRate[]): NormalizedRate[] {
  if (dbRates && dbRates.length > 0) {
    return dbRates.map(r => ({
      code: r.code,
      nameKo: r.nameKo,
      nameEn: r.nameEn,
      amount: r.amount,
      chargeType: r.chargeType,
      unit: r.unit,
      fscApplicable: r.fscApplicable,
      autoDetect: r.autoDetect,
      selectable: r.selectable,
      perKgRate: r.perKgRate,
      ratePercent: r.ratePercent,
      minAmount: r.minAmount,
      detectRules: r.detectRules,
    }));
  }
  return DHL_ADDON_RATES.map(r => {
    const defaults = DHL_HARDCODED_DEFAULTS[r.code];
    return {
      code: r.code,
      nameKo: r.nameKo,
      nameEn: r.nameEn,
      amount: r.amount,
      chargeType: r.chargeType,
      unit: r.unit,
      fscApplicable: r.fscApplicable,
      autoDetect: r.autoDetect ?? false,
      selectable: r.selectable,
      perKgRate: defaults?.perKgRate ?? null,
      ratePercent: defaults?.ratePercent ?? null,
      minAmount: defaults?.minAmount ?? null,
      detectRules: defaults?.detectRules ?? null,
    };
  });
}

export function normalizeUpsRates(dbRates?: AddonRate[]): NormalizedRate[] {
  if (dbRates && dbRates.length > 0) {
    return dbRates.map(r => ({
      code: r.code,
      nameKo: r.nameKo,
      nameEn: r.nameEn,
      amount: r.amount,
      chargeType: r.chargeType,
      unit: r.unit,
      fscApplicable: r.fscApplicable,
      autoDetect: r.autoDetect,
      selectable: r.selectable,
      condition: r.condition,
      perKgRate: r.perKgRate,
      minAmount: r.minAmount,
      ratePercent: null,
      detectRules: r.detectRules,
    }));
  }
  return UPS_ADDON_RATES.map(r => {
    const defaults = UPS_HARDCODED_DEFAULTS[r.code];
    return {
      code: r.code,
      nameKo: r.nameKo,
      nameEn: r.nameEn,
      amount: r.amount,
      chargeType: r.chargeType,
      unit: r.unit,
      fscApplicable: r.fscApplicable,
      autoDetect: r.autoDetect ?? false,
      selectable: r.selectable,
      condition: r.condition ?? null,
      perKgRate: defaults?.perKgRate ?? null,
      minAmount: defaults?.minAmount ?? null,
      ratePercent: null,
      detectRules: defaults?.detectRules ?? null,
    };
  });
}

// ── Shared calcAddonFee function (CRITICAL 1 + 3) ──

export const calcAddonFee = (
  rate: { chargeType: string; amount: number; perKgRate?: number | null; ratePercent?: number | null; minAmount?: number | null },
  billableWeight: number,
  declaredValue: number
): number => {
  if (rate.chargeType === 'calculated') {
    if (rate.perKgRate) {
      const min = rate.minAmount ?? rate.amount;
      return Math.max(min, Math.ceil(billableWeight) * rate.perKgRate);
    }
    if (rate.ratePercent) {
      const min = rate.minAmount ?? rate.amount;
      return Math.max(declaredValue * rate.ratePercent / 100, min);
    }
  }
  return rate.amount;
};

// ── Shared findRate function (CRITICAL 3) ──

export const findRate = (
  code: string,
  dbRates: AddonRateLike[] | undefined,
  hardcodedRates: readonly { code: string; nameKo: string; nameEn: string; amount: number; chargeType: string; fscApplicable: boolean }[],
): AddonRateLike | null => {
  if (dbRates && dbRates.length > 0) {
    const r = dbRates.find(a => a.code === code);
    return r ? { ...r } : null;
  }
  const h = hardcodedRates.find(a => a.code === code);
  return h ? { code: h.code, nameKo: h.nameKo, nameEn: h.nameEn, amount: h.amount, chargeType: h.chargeType, fscApplicable: h.fscApplicable } : null;
};
