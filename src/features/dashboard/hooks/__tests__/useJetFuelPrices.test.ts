import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import type { JetFuelPrice } from '@/api/eiaApi';

const mockFetchJetFuelPrices = vi.fn();

vi.mock('@/api/eiaApi', () => ({
  fetchJetFuelPrices: (...args: unknown[]) => mockFetchJetFuelPrices(...args),
}));

vi.mock('@sentry/browser', () => ({
  captureException: vi.fn(),
}));

import { useJetFuelPrices } from '../useJetFuelPrices';

describe('useJetFuelPrices', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockFetchJetFuelPrices.mockReset();
  });

  it('starts in loading state', () => {
    mockFetchJetFuelPrices.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useJetFuelPrices());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('loads data successfully', async () => {
    const mockData: JetFuelPrice[] = [
      { date: '2026-03-07', price: 2.1 },
      { date: '2026-03-14', price: 2.15 },
    ];
    mockFetchJetFuelPrices.mockResolvedValue(mockData);

    const { result } = renderHook(() => useJetFuelPrices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('handles error state', async () => {
    mockFetchJetFuelPrices.mockRejectedValue(new Error('API unavailable'));

    const { result } = renderHook(() => useJetFuelPrices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API unavailable');
    expect(result.current.data).toEqual([]);
  });

  it('passes weeks parameter to fetchJetFuelPrices', async () => {
    mockFetchJetFuelPrices.mockResolvedValue([]);

    renderHook(() => useJetFuelPrices(24));

    await waitFor(() => {
      expect(mockFetchJetFuelPrices).toHaveBeenCalledWith(24);
    });
  });

  it('provides a retry function', async () => {
    mockFetchJetFuelPrices
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce([{ date: '2026-03-14', price: 2.15 }]);

    const { result } = renderHook(() => useJetFuelPrices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('fail');

    // retry
    result.current.retry();

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
    expect(result.current.error).toBeNull();
  });
});
