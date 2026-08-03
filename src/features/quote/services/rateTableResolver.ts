import { ShippingItemType } from '@/types';
import {
  UPS_EXACT_RATES,
  UPS_RANGE_RATES,
  UPS_DOC_EXACT_RATES,
  UPS_DOC_MAX_KG,
} from '@/config/ups_tariff';
import {
  DHL_EXACT_RATES,
  DHL_RANGE_RATES,
  DHL_DOC_EXACT_RATES,
  DHL_DOC_MAX_KG,
} from '@/config/dhl_tariff';
import {
  FEDEX_EXACT_RATES,
  FEDEX_RANGE_RATES,
  FEDEX_ENVELOPE_EXACT_RATES,
  FEDEX_PAK_EXACT_RATES,
  FEDEX_DOC_MAX_KG,
  FEDEX_ENVELOPE_MAX_KG,
} from '@/config/fedex_tariff';

export type ExactRateTable = Record<string, Record<number, number>>;
export type RangeRateTable = ReadonlyArray<{
  min: number;
  max: number;
  rates: Record<string, number>;
}>;

export type CarrierCode = 'UPS' | 'DHL' | 'FEDEX';

/** Round up to next 0.5kg rating increment (mirrors carrierRateEngine). */
export const roundToHalfKg = (weight: number): number => Math.ceil(weight * 2) / 2;

/**
 * Pick exact + range tables for a carrier based on shipping item type.
 * Document tables only apply within PDF weight caps; heavier → Non-Document.
 *
 * FedEx Document: Envelope ≤0.5kg, Pak ≤2.5kg; heavier → IP Parcel.
 */
export const resolveCarrierRateTables = (
  carrier: CarrierCode,
  shippingItemType: ShippingItemType | undefined,
  billableWeight: number,
): { exact: ExactRateTable; range: RangeRateTable; usedDocument: boolean } => {
  const isDocument = shippingItemType === ShippingItemType.DOCUMENT;
  const rated = roundToHalfKg(billableWeight);

  if (carrier === 'FEDEX') {
    if (isDocument && rated <= FEDEX_ENVELOPE_MAX_KG) {
      return {
        exact: FEDEX_ENVELOPE_EXACT_RATES,
        range: FEDEX_RANGE_RATES,
        usedDocument: true,
      };
    }
    if (isDocument && rated <= FEDEX_DOC_MAX_KG) {
      return {
        exact: FEDEX_PAK_EXACT_RATES,
        range: FEDEX_RANGE_RATES,
        usedDocument: true,
      };
    }
    return {
      exact: FEDEX_EXACT_RATES,
      range: FEDEX_RANGE_RATES,
      usedDocument: false,
    };
  }

  if (carrier === 'DHL') {
    if (isDocument && rated <= DHL_DOC_MAX_KG) {
      return { exact: DHL_DOC_EXACT_RATES, range: DHL_RANGE_RATES, usedDocument: true };
    }
    return { exact: DHL_EXACT_RATES, range: DHL_RANGE_RATES, usedDocument: false };
  }

  if (isDocument && rated <= UPS_DOC_MAX_KG) {
    return { exact: UPS_DOC_EXACT_RATES, range: UPS_RANGE_RATES, usedDocument: true };
  }
  return { exact: UPS_EXACT_RATES, range: UPS_RANGE_RATES, usedDocument: false };
};
