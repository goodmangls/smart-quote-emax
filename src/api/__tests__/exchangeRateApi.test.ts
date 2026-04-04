import { vi } from 'vitest';
import { fetchExchangeRates } from '../exchangeRateApi';

vi.mock('@/lib/fetchWithRetry', () => ({
  fetchWithRetry: <T>(fn: () => Promise<T>) => fn(),
}));

function makeMockProxyResponse() {
  return {
    rates: [
      { currency: 'USD', code: 'USA', flag: '\u{1F1FA}\u{1F1F8}', rate: 1428.50, previousClose: 1425.00, change: 3.50, changePercent: 0.25, trend: 'up' },
      { currency: 'EUR', code: 'EUR', flag: '\u{1F1EA}\u{1F1FA}', rate: 1552.30, previousClose: 1550.00, change: 2.30, changePercent: 0.15, trend: 'up' },
      { currency: 'JPY', code: 'JPN', flag: '\u{1F1EF}\u{1F1F5}', rate: 9.45, previousClose: 9.50, change: -0.05, changePercent: -0.53, trend: 'down' },
      { currency: 'CNY', code: 'CHN', flag: '\u{1F1E8}\u{1F1F3}', rate: 196.80, previousClose: 196.80, change: 0, changePercent: 0, trend: 'flat' },
      { currency: 'GBP', code: 'GBR', flag: '\u{1F1EC}\u{1F1E7}', rate: 1812.40, previousClose: 1810.00, change: 2.40, changePercent: 0.13, trend: 'up' },
      { currency: 'SGD', code: 'SGP', flag: '\u{1F1F8}\u{1F1EC}', rate: 1068.20, previousClose: 1065.00, change: 3.20, changePercent: 0.30, trend: 'up' },
    ],
    fetchedAt: '2026-03-13T09:00:00+09:00',
    cached: true,
  };
}

function makeMockDirectApiResponse() {
  return {
    result: 'success',
    base_code: 'KRW',
    rates: {
      KRW: 1,
      USD: 0.0007, // 1 KRW = 0.0007 USD → 1 USD ≈ 1428.57 KRW
      EUR: 0.00064,
      JPY: 0.106,
      CNY: 0.00508,
      GBP: 0.00055,
      SGD: 0.00094,
    },
  };
}

describe('fetchExchangeRates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('fetches and returns 6 currencies from Rails proxy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeMockProxyResponse()),
    }));

    const result = await fetchExchangeRates();

    expect(result).toHaveLength(6);
    expect(result[0]).toMatchObject({
      currency: 'USD',
      code: 'USA',
      rate: 1428.50,
    });
  });

  it('calls the correct Rails proxy endpoint first', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeMockProxyResponse()),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchExchangeRates();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/exchange_rates')
    );
  });

  it('includes all expected currencies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeMockProxyResponse()),
    }));

    const result = await fetchExchangeRates();
    const currencies = result.map(r => r.currency);
    expect(currencies).toEqual(['USD', 'EUR', 'JPY', 'CNY', 'GBP', 'SGD']);
  });

  it('preserves trend information from server', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeMockProxyResponse()),
    }));

    const result = await fetchExchangeRates();
    const usd = result.find(r => r.currency === 'USD')!;
    expect(usd.trend).toBe('up');
    expect(usd.change).toBe(3.50);
    expect(usd.changePercent).toBe(0.25);
    expect(usd.previousClose).toBe(1425.00);
  });

  it('falls back to direct API when proxy fails', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 }) // proxy fails
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeMockDirectApiResponse()),
      });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchExchangeRates();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toBe('https://open.er-api.com/v6/latest/KRW');
    expect(result).toHaveLength(6);
    expect(result.map(r => r.currency)).toEqual(['USD', 'EUR', 'JPY', 'CNY', 'GBP', 'SGD']);
  });

  it('falls back to direct API when proxy returns empty rates', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rates: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeMockDirectApiResponse()),
      });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchExchangeRates();
    expect(result).toHaveLength(6);
  });

  it('calculates correct inverted rate from direct API', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeMockDirectApiResponse()),
      });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchExchangeRates();
    const usd = result.find(r => r.currency === 'USD')!;
    // 1 / 0.0007 = 1428.57... → rounded to 1428.57
    expect(usd.rate).toBeCloseTo(1428.57, 0);
  });

  it('throws when both proxy and direct API fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    await expect(fetchExchangeRates()).rejects.toThrow('Network error');
  });
});
