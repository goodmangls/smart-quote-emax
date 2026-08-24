import { renderHook } from '@testing-library/react';
import { useCarrierFscDefault } from '../useCarrierFscDefault';
import {
  DEFAULT_FSC_PERCENT,
  DEFAULT_FSC_PERCENT_DHL,
  DEFAULT_FSC_PERCENT_FEDEX,
  DEFAULT_FSC_PERCENT_OCS,
} from '@/config/rates';

const mockUseFscRates = vi.hoisted(() => vi.fn());

vi.mock('@/features/dashboard/hooks/useFscRates', () => ({
  useFscRates: mockUseFscRates,
}));

// Deliberately unlike any shipped constant. A fixture set to today's real rate
// stops discriminating the moment that rate lands in rates.ts — which is
// exactly what happened the first time these were written.
const DB_UPS = 50.5;
const DB_DHL = 51.5;
const DB_FEDEX = 52.5;
const DB_OCS = 53.5;

const dbRates = () => ({
  data: {
    rates: {
      UPS: { international: DB_UPS, domestic: DB_UPS },
      DHL: { international: DB_DHL, domestic: DB_DHL },
      FEDEX: { international: DB_FEDEX, domestic: DB_FEDEX },
      OCS: { international: DB_OCS, domestic: DB_OCS },
    },
    updatedAt: '2026-08-24T00:00:00Z',
  },
  loading: false,
  error: null,
  retry: vi.fn(),
});

/** What the hook sees before the request resolves — the constants, per useFscRates. */
const stillLoading = () => ({
  data: {
    rates: {
      UPS: { international: DEFAULT_FSC_PERCENT, domestic: DEFAULT_FSC_PERCENT },
      DHL: { international: DEFAULT_FSC_PERCENT_DHL, domestic: DEFAULT_FSC_PERCENT_DHL },
      FEDEX: { international: DEFAULT_FSC_PERCENT_FEDEX, domestic: DEFAULT_FSC_PERCENT_FEDEX },
      OCS: { international: DEFAULT_FSC_PERCENT_OCS, domestic: DEFAULT_FSC_PERCENT_OCS },
    },
    updatedAt: '',
  },
  loading: true,
  error: null,
  retry: vi.fn(),
});

beforeEach(() => mockUseFscRates.mockReset());

/**
 * The admin FSC widget writes to fsc_rates, but nothing on the quoting path
 * read it — the calculator, the best-carrier pick, and the comparison page all
 * used the shipped constants, so a rate raised in the widget changed no quote.
 *
 * `resolve` covers the per-carrier lists; the return value covers the currently
 * selected carrier and keeps the quote input in step with it.
 */
describe('useCarrierFscDefault', () => {
  it('resolves the DB rate for each carrier', () => {
    mockUseFscRates.mockReturnValue(dbRates());

    const { result } = renderHook(() =>
      useCarrierFscDefault({ carrier: 'UPS', fscPercent: DB_UPS, onApply: vi.fn() })
    );

    expect(result.current.resolve('UPS')).toBe(DB_UPS);
    expect(result.current.resolve('DHL')).toBe(DB_DHL);
    expect(result.current.resolve('FEDEX')).toBe(DB_FEDEX);
    expect(result.current.resolve('OCS')).toBe(DB_OCS);
  });

  // EMAX bills fuel per kg on its own branch; a percentage must never apply,
  // even if an EMAX row is added to the table.
  it('keeps EMAX at zero regardless of the DB', () => {
    mockUseFscRates.mockReturnValue({
      data: {
        rates: { ...dbRates().data.rates, EMAX: { international: 99, domestic: 99 } },
        updatedAt: '',
      },
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const { result } = renderHook(() =>
      useCarrierFscDefault({ carrier: 'EMAX', fscPercent: 0, onApply: vi.fn() })
    );

    expect(result.current.resolve('EMAX')).toBe(0);
    expect(result.current.current).toBe(0);
  });

  it('falls back to the constant when the DB has no row for the carrier', () => {
    mockUseFscRates.mockReturnValue({
      data: { rates: { UPS: { international: DB_UPS, domestic: DB_UPS } }, updatedAt: '' },
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const { result } = renderHook(() =>
      useCarrierFscDefault({ carrier: 'OCS', fscPercent: DEFAULT_FSC_PERCENT_OCS, onApply: vi.fn() })
    );

    expect(result.current.resolve('OCS')).toBe(DEFAULT_FSC_PERCENT_OCS);
  });

  it('applies the DB rate once it arrives, replacing the constant', () => {
    mockUseFscRates.mockReturnValue(stillLoading());
    const onApply = vi.fn();

    const { rerender } = renderHook(
      (props: { fsc: number }) =>
        useCarrierFscDefault({ carrier: 'UPS', fscPercent: props.fsc, onApply }),
      { initialProps: { fsc: DEFAULT_FSC_PERCENT } }
    );

    onApply.mockClear();
    mockUseFscRates.mockReturnValue(dbRates());
    rerender({ fsc: DEFAULT_FSC_PERCENT });

    expect(onApply).toHaveBeenCalledWith(DB_UPS);
  });

  // The race this guards: a user typing a negotiated rate before the response
  // lands must not have it overwritten when it does.
  it('does not overwrite a rate the user typed while the request was in flight', () => {
    mockUseFscRates.mockReturnValue(stillLoading());
    const onApply = vi.fn();

    const { rerender } = renderHook(
      (props: { fsc: number }) =>
        useCarrierFscDefault({ carrier: 'UPS', fscPercent: props.fsc, onApply }),
      { initialProps: { fsc: DEFAULT_FSC_PERCENT } }
    );

    rerender({ fsc: 20 });
    onApply.mockClear();

    mockUseFscRates.mockReturnValue(dbRates());
    rerender({ fsc: 20 });

    expect(onApply).not.toHaveBeenCalled();
  });

  it('applies the new carrier default on a carrier switch even after a manual edit', () => {
    mockUseFscRates.mockReturnValue(dbRates());
    const onApply = vi.fn();

    const { rerender } = renderHook(
      (props: { carrier: string; fsc: number }) =>
        useCarrierFscDefault({ carrier: props.carrier, fscPercent: props.fsc, onApply }),
      { initialProps: { carrier: 'UPS', fsc: DB_UPS } }
    );

    rerender({ carrier: 'UPS', fsc: 20 });
    onApply.mockClear();

    rerender({ carrier: 'DHL', fsc: 20 });

    expect(onApply).toHaveBeenCalledWith(DB_DHL);
  });

  // The comparison page uses resolve only; without onApply the hook must not
  // try to sync anything.
  it('skips the sync entirely when no onApply is given', () => {
    mockUseFscRates.mockReturnValue(dbRates());

    const { result, rerender } = renderHook(() => useCarrierFscDefault({ carrier: 'DHL' }));
    rerender();

    expect(result.current.resolve('DHL')).toBe(DB_DHL);
    expect(result.current.current).toBe(DB_DHL);
  });

  it('keeps an explicit 0 rather than treating it as untouched', () => {
    mockUseFscRates.mockReturnValue(dbRates());
    const onApply = vi.fn();

    const { rerender } = renderHook(
      (props: { fsc: number }) =>
        useCarrierFscDefault({ carrier: 'UPS', fscPercent: props.fsc, onApply }),
      { initialProps: { fsc: DB_UPS } }
    );

    rerender({ fsc: 0 });
    onApply.mockClear();
    rerender({ fsc: 0 });

    expect(onApply).not.toHaveBeenCalled();
  });
});
