import { describe, it, expect } from 'vitest';
import { getDocumentCapKg } from '../documentCaps';
import { calculateQuote } from '../calculationService';
import { QuoteInput, Incoterm, PackingType, ShippingItemType } from '@/types';

describe('getDocumentCapKg', () => {
  it('returns carrier-specific Document caps', () => {
    expect(getDocumentCapKg('UPS')).toBe(5);
    expect(getDocumentCapKg('DHL')).toBe(2);
    expect(getDocumentCapKg('FEDEX')).toBe(2.5);
    expect(getDocumentCapKg(undefined)).toBe(5);
  });
});

describe('documentRatedAsParcel', () => {
  const baseInput: QuoteInput = {
    originCountry: 'KR',
    destinationCountry: 'US',
    destinationZip: '10001',
    overseasCarrier: 'FEDEX',
    shippingItemType: ShippingItemType.DOCUMENT,
    packingType: PackingType.NONE,
    incoterm: Incoterm.DAP,
    dutyTaxEstimate: 0,
    discountPercent: 0,
    exchangeRate: 1450,
    fscPercent: 39.75,
    items: [
      {
        id: '1',
        width: 32,
        length: 24,
        height: 1,
        weight: 5.3,
        quantity: 1,
      },
    ],
  };

  it('sets documentRatedAsParcel when FedEx Document weight exceeds 2.5kg', () => {
    const result = calculateQuote(baseInput);
    expect(result.documentRatedAsParcel).toBe(true);
    expect(result.warnings.some((w) => w.includes('IP Parcel tariff'))).toBe(true);
  });

  it('does not set documentRatedAsParcel within Document cap', () => {
    const result = calculateQuote({
      ...baseInput,
      items: [{ ...baseInput.items[0], weight: 1.0 }],
    });
    expect(result.documentRatedAsParcel).toBeFalsy();
  });

  it('clears flag when Shipping Item is Parcel', () => {
    const result = calculateQuote({
      ...baseInput,
      shippingItemType: ShippingItemType.NON_DOCUMENT,
    });
    expect(result.documentRatedAsParcel).toBeFalsy();
  });
});
