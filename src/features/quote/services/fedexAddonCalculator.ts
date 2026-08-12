/**
 * FedEx Add-on Cost Calculator
 * Source: FedEx "추가 서비스 요금 및 기타 정보 — 대한민국" (KR_20251119_102313), IPE/IP/IE.
 *
 * Mirrors upsAddonCalculator/dhlAddonCalculator in shape. Two FedEx-specific rules
 * that the other carriers do not have:
 *
 *  1. **Highest-only** — when one package meets two or more 비표준화물 criteria
 *     (용적/중량/패키징/특대형/미허가), only the single highest fee is charged, not
 *     the sum. Charging them additively would overquote by up to 4×.
 *  2. **18kg 최소 청구 중량** — a package meeting the 용적 criteria is rated at no
 *     less than 18kg. Because the fees are flat, this rule acts on the base tariff
 *     lookup rather than on any add-on line; see getFedexMinChargeableWeight, which
 *     calculationService applies to billableWeight before the carrier rate lookup.
 */
import type { QuoteInput, CargoItem } from '@/types';
import type { AddonRateLike } from '@/config/addon-utils';
import type { CarrierAddOnDetails } from './dhlAddonCalculator';
import { calcAddonFee, findRate } from '@/config/addon-utils';
import { applyPackingDimensions } from '@/lib/packing-utils';
import { PackingType } from '@/types';
import {
  FEDEX_ADDON_RATES,
  FEDEX_HARDCODED_DEFAULTS,
  FEDEX_MIN_CHARGEABLE_WEIGHT_KG,
  calculateFedexDeclaredValueFee,
  isFedexAhsDimension,
  isFedexAhsPackaging,
  isFedexAhsWeight,
  isFedexOversize,
  isFedexUnauthorized,
} from '@/config/fedex_addons';

/** Non-standard codes a single package qualifies for, before the highest-only rule. */
const nonStandardCodesFor = (
  l: number,
  w: number,
  h: number,
  weight: number,
  packingType: PackingType,
): string[] => {
  const codes: string[] = [];
  if (isFedexAhsDimension(l, w, h)) codes.push('AHD');
  if (isFedexAhsWeight(weight)) codes.push('AHW');
  if (isFedexAhsPackaging(packingType)) codes.push('AHP');
  if (isFedexOversize(l, w, h, weight)) codes.push('OVR');
  if (isFedexUnauthorized(l, w, h, weight)) codes.push('UNA');
  return codes;
};

/**
 * Chargeable-weight floor imposed by the 용적 criteria, or null when no package
 * triggers it (in which case the weight pipeline must be left untouched).
 *
 * Returns 18kg per triggering box. A shipment mixing triggering and non-triggering
 * boxes gets only the triggering boxes' floor, so the result can sit below FedEx's
 * own per-package rating for such mixes — it never exceeds it. Exact for the common
 * single-box and all-boxes-oversized cases.
 */
export const getFedexMinChargeableWeight = (
  items: CargoItem[],
  packingType: PackingType,
): number | null => {
  let triggeringBoxes = 0;
  items.forEach((item) => {
    const { l, w, h } = applyPackingDimensions(
      item.length,
      item.width,
      item.height,
      item.weight,
      packingType,
    );
    if (isFedexAhsDimension(l, w, h)) triggeringBoxes += item.quantity;
  });
  return triggeringBoxes > 0 ? triggeringBoxes * FEDEX_MIN_CHARGEABLE_WEIGHT_KG : null;
};

export const calculateFedexAddOnCosts = (
  input: QuoteInput,
  billableWeight: number,
  fscPercent: number,
): { total: number; details: CarrierAddOnDetails } => {
  const fscRate = (fscPercent || 0) / 100;
  const details: CarrierAddOnDetails = [];
  let total = 0;

  const dbRates = input.resolvedAddonRates?.filter((r) => r.carrier === 'FEDEX');
  const useDb = dbRates && dbRates.length > 0;

  const findFedexRate = (code: string): AddonRateLike | null => {
    const rate = findRate(code, useDb ? dbRates : undefined, FEDEX_ADDON_RATES);
    if (!rate) return null;
    // The hardcoded table carries kg rates separately; DB rows already have them.
    const defaults = FEDEX_HARDCODED_DEFAULTS[code];
    return useDb || !defaults ? rate : { ...rate, ...defaults };
  };

  const push = (code: string, rate: AddonRateLike, amount: number, nameKo?: string) => {
    const fsc = rate.fscApplicable ? amount * fscRate : 0;
    details.push({ code, nameKo: nameKo ?? rate.nameKo, nameEn: rate.nameEn, amount, fscAmount: fsc });
    total += amount + fsc;
  };

  // 1. 비표준화물 (자동 감지) — per package, highest fee only.
  const nonStandardTotals = new Map<string, { amount: number; count: number }>();
  input.items.forEach((item) => {
    const { l, w, h, weight } = applyPackingDimensions(
      item.length,
      item.width,
      item.height,
      item.weight,
      input.packingType,
    );

    const candidates = nonStandardCodesFor(l, w, h, weight, input.packingType)
      .map((code) => ({ code, rate: findFedexRate(code) }))
      .filter((c): c is { code: string; rate: AddonRateLike } => c.rate !== null);
    if (candidates.length === 0) return;

    const winner = candidates.reduce((a, b) => (b.rate.amount > a.rate.amount ? b : a));
    const prev = nonStandardTotals.get(winner.code);
    nonStandardTotals.set(winner.code, {
      amount: winner.rate.amount,
      count: (prev?.count ?? 0) + item.quantity,
    });
  });

  nonStandardTotals.forEach(({ amount, count }, code) => {
    const rate = findFedexRate(code);
    if (rate) push(code, rate, amount * count);
  });

  // 2. 목적지 기반 (자동 감지)
  if (input.destinationCountry === 'US') {
    const usi = findFedexRate('USI');
    if (usi) push('USI', usi, usi.amount);
  }

  // 3. 운송 신고 금액 추가 비용 — 115,000원 초과분에 대해 115,000원당 1,420원
  const declaredValueFee = calculateFedexDeclaredValueFee(input.fedexDeclaredValue ?? 0);
  if (declaredValueFee > 0) {
    details.push({
      code: 'DVL',
      nameKo: '운송 신고 금액 추가 비용',
      nameEn: 'Declared Value Surcharge',
      amount: declaredValueFee,
      fscAmount: 0,
    });
    total += declaredValueFee;
  }

  // 4. 사용자 선택
  (input.fedexAddOns || []).forEach((code) => {
    const rate = findFedexRate(code);
    if (!rate) return;
    // Dry ice is waived when dangerous goods are also declared.
    if (code === 'DIC' && (input.fedexAddOns || []).some((c) => c === 'DGA' || c === 'DGI')) return;
    push(code, rate, calcAddonFee(rate, billableWeight, 0));
  });

  return { total, details };
};
