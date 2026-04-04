import { vi } from 'vitest';

vi.mock('@/lib/fetchWithRetry', () => ({
  fetchWithRetry: <T>(fn: () => Promise<T>) => fn(),
}));

function makeMockEiaResponse() {
  return {
    response: {
      data: [
        { period: '2026-03-14', value: '2.150' },
        { period: '2026-03-07', value: '2.100' },
        { period: '2026-02-28', value: '2.050' },
      ],
    },
  };
}

describe('fetchJetFuelPrices', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns empty array when API key is not configured', async () => {
    vi.stubEnv('VITE_EIA_API_KEY', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { fetchJetFuelPrices } = await import('../eiaApi');
    const result = await fetchJetFuelPrices();

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_EIA_API_KEY not configured'),
    );
  });

  it('parses successful EIA response and returns prices in chronological order', async () => {
    vi.stubEnv('VITE_EIA_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeMockEiaResponse()),
      }),
    );

    const { fetchJetFuelPrices } = await import('../eiaApi');
    const result = await fetchJetFuelPrices(3);

    expect(result).toHaveLength(3);
    // reversed to chronological order
    expect(result[0].date).toBe('2026-02-28');
    expect(result[0].price).toBeCloseTo(2.05);
    expect(result[2].date).toBe('2026-03-14');
    expect(result[2].price).toBeCloseTo(2.15);
  });

  it('returns empty array when response has no data', async () => {
    vi.stubEnv('VITE_EIA_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: {} }),
      }),
    );

    const { fetchJetFuelPrices } = await import('../eiaApi');
    const result = await fetchJetFuelPrices();
    expect(result).toEqual([]);
  });

  it('throws on network error', async () => {
    vi.stubEnv('VITE_EIA_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const { fetchJetFuelPrices } = await import('../eiaApi');
    await expect(fetchJetFuelPrices()).rejects.toThrow('Network error');
  });

  it('throws on non-OK HTTP response', async () => {
    vi.stubEnv('VITE_EIA_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const { fetchJetFuelPrices } = await import('../eiaApi');
    await expect(fetchJetFuelPrices()).rejects.toThrow('EIA API error: 500');
  });

  it('filters out entries with NaN price values', async () => {
    vi.stubEnv('VITE_EIA_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            response: {
              data: [
                { period: '2026-03-14', value: '2.150' },
                { period: '2026-03-07', value: 'N/A' },
              ],
            },
          }),
      }),
    );

    const { fetchJetFuelPrices } = await import('../eiaApi');
    const result = await fetchJetFuelPrices();
    expect(result).toHaveLength(1);
    expect(result[0].price).toBeCloseTo(2.15);
  });
});
