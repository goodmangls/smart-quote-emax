import type { QuoteInput } from '@/types';
import type { ResolvedSurcharge } from '@/api/surchargeApi';
import type { AddonRate } from '@/api/addonRateApi';

type QuoteSurcharges = NonNullable<QuoteInput['resolvedSurcharges']>;
type QuoteAddonRates = NonNullable<QuoteInput['resolvedAddonRates']>;

/**
 * Maps one carrier's resolved system surcharges into the QuoteInput shape that
 * calculateQuote() reads. Returns undefined when the carrier has none, so the
 * calculator never sees a stale list left over from another carrier.
 */
export function toQuoteSurcharges(src: ResolvedSurcharge[]): QuoteSurcharges | undefined {
  const mapped = src.map((s) => ({
    code: s.code,
    name: s.name,
    nameKo: s.name_ko,
    chargeType: s.charge_type,
    amount: s.amount,
    sourceUrl: s.source_url,
  }));
  return mapped.length > 0 ? mapped : undefined;
}

/** Maps one carrier's DB add-on rates into the QuoteInput shape. */
export function toQuoteAddonRates(src: AddonRate[]): QuoteAddonRates {
  return src.map((r) => ({
    code: r.code,
    carrier: r.carrier,
    nameEn: r.nameEn,
    nameKo: r.nameKo,
    chargeType: r.chargeType,
    unit: r.unit,
    amount: r.amount,
    perKgRate: r.perKgRate,
    ratePercent: r.ratePercent,
    minAmount: r.minAmount,
    fscApplicable: r.fscApplicable,
    autoDetect: r.autoDetect,
    selectable: r.selectable,
    condition: r.condition,
    detectRules: r.detectRules,
  }));
}
