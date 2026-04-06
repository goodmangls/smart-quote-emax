import { vi } from 'vitest';

vi.mock('@/lib/fetchWithRetry', () => ({
  fetchWithRetry: <T>(fn: () => Promise<T>) => fn(),
}));

vi.mock('../apiClient', () => ({
  API_URL: 'http://localhost:3000',
}));

function makeMockProxyResponse() {
  return {
    data: [
      { date: '2026-02-28', price: 2.05 },
      { date: '2026-03-07', price: 2.1 },
      { date: '2026-03-14', price: 2.15 },
    ],
  };
}

describe('fetchJetFuelPrices', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses successful proxy response and returns prices in order', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeMockProxyResponse()),
      }),
    );

    const { fetchJetFuelPrices } = await import('../eiaApi');
    const result = await fetchJetFuelPrices(3);

    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2026-02-28');
    expect(result[0].price).toBeCloseTo(2.05);
    expect(result[2].date).toBe('2026-03-14');
    expect(result[2].price).toBeCloseTo(2.15);
  });

  it('passes weeks param to proxy URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { fetchJetFuelPrices } = await import('../eiaApi');
    await fetchJetFuelPrices(8);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/jet_fuel?weeks=8',
    );
  });

  it('returns empty array when response has no data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const { fetchJetFuelPrices } = await import('../eiaApi');
    const result = await fetchJetFuelPrices();
    expect(result).toEqual([]);
  });

  it('throws on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const { fetchJetFuelPrices } = await import('../eiaApi');
    await expect(fetchJetFuelPrices()).rejects.toThrow('Network error');
  });

  it('throws on non-OK HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const { fetchJetFuelPrices } = await import('../eiaApi');
    await expect(fetchJetFuelPrices()).rejects.toThrow('Jet Fuel API error: 500');
  });

  it('filters out entries with NaN price values', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { date: '2026-03-14', price: 2.15 },
              { date: '2026-03-07', price: NaN },
            ],
          }),
      }),
    );

    const { fetchJetFuelPrices } = await import('../eiaApi');
    const result = await fetchJetFuelPrices();
    expect(result).toHaveLength(1);
    expect(result[0].price).toBeCloseTo(2.15);
  });
});
