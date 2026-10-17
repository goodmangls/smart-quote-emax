import { render, screen } from '@testing-library/react';
import { CarrierComparisonCard } from '../CarrierComparisonCard';
import { QuoteInput, QuoteResult } from '@/types';

const mocks = vi.hoisted(() => ({
  fsc: undefined as undefined | Record<string, { international: number; domestic: number }>,
  surcharges: {} as Record<string, unknown[]>,
  addons: {} as Record<string, unknown[]>,
  calcImpl: null as null | ((input: Record<string, unknown>) => unknown),
  calls: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'ko', setLanguage: vi.fn(), t: (key: string) => key }),
}));

vi.mock('@sentry/browser', () => ({ captureException: vi.fn() }));

vi.mock('@/features/dashboard/hooks/useFscRates', () => ({
  useFscRates: () => ({
    data: mocks.fsc ? { rates: mocks.fsc, updatedAt: '2026-10-12' } : null,
    loading: false,
    error: null,
    retry: vi.fn(),
  }),
}));

vi.mock('@/features/dashboard/hooks/useSurcharges', () => ({
  useSurcharges: (carrier: string) => ({ surcharges: mocks.surcharges[carrier] ?? [] }),
}));

vi.mock('@/features/dashboard/hooks/useAddonRates', () => ({
  useAddonRates: (carrier: string) => ({ rates: mocks.addons[carrier] ?? [] }),
}));

vi.mock('@/features/quote/services/calculationService', () => ({
  calculateQuote: (input: Record<string, unknown>) => {
    mocks.calls.push(input);
    if (mocks.calcImpl) return mocks.calcImpl(input);
    return {
      totalQuoteAmount: 1_000_000,
      totalQuoteAmountUSD: 700,
      appliedZone: 'Z1',
      transitTime: '3 days',
    };
  },
}));

const DB_FSC = {
  UPS: { international: 47.5, domestic: 0 },
  DHL: { international: 45, domestic: 0 },
  FEDEX: { international: 46.25, domestic: 0 },
  OCS: { international: 25, domestic: 0 },
};

const surcharge = (code: string, carrier: string) => ({
  id: 1,
  code,
  name: `${code} name`,
  name_ko: null,
  charge_type: 'fixed',
  amount: 1000,
  carrier,
  source_url: null,
  effective_from: '2026-01-01',
  effective_to: null,
});

const addonRate = (code: string, carrier: 'UPS' | 'DHL' | 'FEDEX') => ({
  id: 2,
  code,
  carrier,
  nameEn: code,
  nameKo: code,
  description: null,
  chargeType: 'fixed',
  unit: 'shipment',
  amount: 5000,
  perKgRate: null,
  ratePercent: null,
  minAmount: null,
  fscApplicable: false,
  autoDetect: false,
  selectable: true,
  condition: null,
  detectRules: null,
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  sourceUrl: null,
  sortOrder: 0,
});

const baseInput = {
  overseasCarrier: 'UPS',
  destinationCountry: 'US',
  discountPercent: 0,
  exchangeRate: 1400,
} as unknown as QuoteInput;

const renderCard = (input: QuoteInput) =>
  render(
    <CarrierComparisonCard
      input={input}
      currentResult={{} as QuoteResult}
      onSwitchCarrier={vi.fn()}
      showUSD
    />,
  );

const callFor = (carrier: string) => mocks.calls.filter((c) => c.overseasCarrier === carrier);

beforeEach(() => {
  mocks.fsc = DB_FSC;
  mocks.surcharges = {};
  mocks.addons = {};
  mocks.calcImpl = null;
  mocks.calls = [];
});

describe('CarrierComparisonCard per-carrier inputs', () => {
  it('prices each column with that carrier’s DB FSC, not the shipped constants', () => {
    renderCard(baseInput);

    expect(callFor('UPS').at(-1)?.fscPercent).toBe(47.5);
    expect(callFor('DHL').at(-1)?.fscPercent).toBe(45);
    expect(callFor('FEDEX').at(-1)?.fscPercent).toBe(46.25);
  });

  it('uses the FSC the user typed for the selected carrier, and DB rates for the others', () => {
    renderCard({ ...baseInput, fscPercent: 30 } as QuoteInput);

    expect(callFor('UPS').at(-1)?.fscPercent).toBe(30);
    expect(callFor('DHL').at(-1)?.fscPercent).toBe(45);
    expect(callFor('FEDEX').at(-1)?.fscPercent).toBe(46.25);
  });

  it('does not carry the selected carrier’s surcharges into another carrier’s column', () => {
    mocks.surcharges = {
      UPS: [surcharge('UPS-WAR', 'UPS')],
      DHL: [surcharge('DHL-FUEL', 'DHL')],
    };
    const upsSurcharges = [
      {
        code: 'UPS-WAR',
        name: 'UPS-WAR name',
        nameKo: null,
        chargeType: 'fixed',
        amount: 1000,
        sourceUrl: null,
      },
    ];
    renderCard({ ...baseInput, resolvedSurcharges: upsSurcharges } as QuoteInput);

    const dhlCall = callFor('DHL').at(-1);
    expect(dhlCall?.resolvedSurcharges).toEqual([
      {
        code: 'DHL-FUEL',
        name: 'DHL-FUEL name',
        nameKo: null,
        chargeType: 'fixed',
        amount: 1000,
        sourceUrl: null,
      },
    ]);
    expect(callFor('FEDEX').at(-1)?.resolvedSurcharges).toBeUndefined();
    expect(callFor('UPS').at(-1)?.resolvedSurcharges).toEqual([
      {
        code: 'UPS-WAR',
        name: 'UPS-WAR name',
        nameKo: null,
        chargeType: 'fixed',
        amount: 1000,
        sourceUrl: null,
      },
    ]);
  });

  it('does not carry the selected carrier’s add-on rates into another carrier’s column', () => {
    mocks.addons = {
      UPS: [addonRate('UPS-RES', 'UPS')],
      DHL: [addonRate('DHL-OWT', 'DHL')],
    };
    renderCard({
      ...baseInput,
      resolvedAddonRates: [addonRate('UPS-RES', 'UPS')],
    } as unknown as QuoteInput);

    const dhlRates = (callFor('DHL').at(-1)?.resolvedAddonRates ?? []) as Array<{ code: string }>;
    expect(dhlRates.map((r) => r.code)).toEqual(['DHL-OWT']);
    expect(callFor('FEDEX').at(-1)?.resolvedAddonRates).toBeUndefined();
  });

  it('still renders both top columns', () => {
    renderCard(baseInput);
    expect(screen.getByText('UPS')).toBeInTheDocument();
    expect(screen.getByText('DHL')).toBeInTheDocument();
  });
});

describe('CarrierComparisonCard error reporting', () => {
  it('reports a non-zone calculation failure to Sentry with carrier tag', async () => {
    const Sentry = await import('@sentry/browser');
    const boom = new Error('corrupted DHL table: boom-report-1');
    mocks.calcImpl = (input) => {
      if (input.overseasCarrier === 'DHL') throw boom;
      return {
        totalQuoteAmount: 1_000_000,
        totalQuoteAmountUSD: 700,
        appliedZone: 'Z1',
        transitTime: '3 days',
      };
    };

    renderCard(baseInput);

    expect(Sentry.captureException).toHaveBeenCalledWith(boom, {
      tags: { feature: 'carrier-comparison', carrier: 'DHL' },
    });
  });

  it('reports a missing-rate failure too: emax has no expected per-carrier skip', async () => {
    const Sentry = await import('@sentry/browser');
    vi.mocked(Sentry.captureException).mockClear();
    const gap = new Error('Rate not found: zone=Z99, weight=88kg');
    mocks.calcImpl = (input) => {
      if (input.overseasCarrier === 'DHL') throw gap;
      return {
        totalQuoteAmount: 1_000_000,
        totalQuoteAmountUSD: 700,
        appliedZone: 'Z1',
        transitTime: '3 days',
      };
    };

    renderCard(baseInput);

    expect(Sentry.captureException).toHaveBeenCalledWith(gap, {
      tags: { feature: 'carrier-comparison', carrier: 'DHL' },
    });
  });

  it('reports the same distinct failure only once per session', async () => {
    const Sentry = await import('@sentry/browser');
    vi.mocked(Sentry.captureException).mockClear();
    mocks.calcImpl = (input) => {
      if (input.overseasCarrier === 'FEDEX') throw new Error('dedupe-marker-7');
      return {
        totalQuoteAmount: 1_000_000,
        totalQuoteAmountUSD: 700,
        appliedZone: 'Z1',
        transitTime: '3 days',
      };
    };

    renderCard(baseInput);
    renderCard(baseInput);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
