import { vi } from 'vitest';
import { fetchPortWeather } from '../weatherApi';
import { MONITORED_PORTS } from '@/config/ports';

// Mock fetchWithRetry to call fn directly (no real retries in tests)
vi.mock('@/lib/fetchWithRetry', () => ({
  fetchWithRetry: <T>(fn: () => Promise<T>) => fn(),
}));

function makeMockResponse(overrides: Partial<{ temperature_2m: number; weather_code: number; wind_speed_10m: number }> = {}) {
  return {
    latitude: 35.18,
    longitude: 129.08,
    current_units: { time: 'iso8601', temperature_2m: '°C', weather_code: 'wmo code', wind_speed_10m: 'km/h' },
    current: {
      time: '2026-02-26T10:00',
      temperature_2m: overrides.temperature_2m ?? 4.2,
      weather_code: overrides.weather_code ?? 3,
      wind_speed_10m: overrides.wind_speed_10m ?? 12.5,
    },
  };
}

describe('fetchPortWeather', () => {
  afterEach(() => vi.restoreAllMocks());

  it('builds correct URL with all port coordinates', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MONITORED_PORTS.map(() => makeMockResponse())),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchPortWeather();

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('api.open-meteo.com');
    expect(url).toContain('latitude=');
    expect(url).toContain('longitude=');
    expect(url).toContain('current=temperature_2m,weather_code,wind_speed_10m');
    // Should have all port coordinates
    const latitudes = url.match(/latitude=([^&]+)/)?.[1].split(',');
    expect(latitudes).toHaveLength(MONITORED_PORTS.length);
  });

  it('parses Open-Meteo response into PortWeather[]', async () => {
    const mockData = MONITORED_PORTS.map(() => makeMockResponse());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    const result = await fetchPortWeather();

    expect(result).toHaveLength(MONITORED_PORTS.length);
    expect(result[0]).toMatchObject({
      port: expect.stringContaining('Incheon'),
      code: 'KR-ICN',
      temperature: 4,
      condition: 'Cloudy',
      status: 'Normal',
      type: 'port',
    });
  });

  it('handles network error gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    await expect(fetchPortWeather()).rejects.toThrow('Network error');
  });

  it('handles non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(fetchPortWeather()).rejects.toThrow('Open-Meteo API error: 500');
  });

  it('handles single-location response (non-array)', async () => {
    // When Open-Meteo returns a single object instead of array
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeMockResponse()),
    }));

    const result = await fetchPortWeather();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].temperature).toBe(4);
  });

  it('preserves port type (port vs airport) in response', async () => {
    const mockData = MONITORED_PORTS.map(() => makeMockResponse());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    const result = await fetchPortWeather();

    // First entry is Incheon port
    expect(result[0].type).toBe('port');
    // Third entry (index 2) is Incheon Airport
    const airportEntry = result.find(r => r.code === 'KR-ICN-AIR');
    expect(airportEntry).toBeDefined();
    expect(airportEntry!.type).toBe('airport');
  });

  it('maps weather code 0 to Clear/Normal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MONITORED_PORTS.map(() => makeMockResponse({ weather_code: 0 }))),
    }));

    const result = await fetchPortWeather();
    expect(result[0].condition).toBe('Clear');
    expect(result[0].status).toBe('Normal');
  });
});
