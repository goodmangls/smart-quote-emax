import { MONITORED_PORTS } from '@/config/ports';
import { mapWeatherCode } from '@/config/weatherCodes';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import type { PortWeather, OpenMeteoResult } from '@/types/dashboard';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export async function fetchPortWeather(): Promise<PortWeather[]> {
  const latitudes = MONITORED_PORTS.map(p => p.latitude.toFixed(2)).join(',');
  const longitudes = MONITORED_PORTS.map(p => p.longitude.toFixed(2)).join(',');

  const url = `${OPEN_METEO_URL}?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;

  const data: OpenMeteoResult[] = await fetchWithRetry(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    return response.json();
  });

  // Open-Meteo returns a single object for 1 location, array for multiple
  const results = Array.isArray(data) ? data : [data];

  return results.map((result, index) => {
    const port = MONITORED_PORTS[index];
    const mapping = mapWeatherCode(result.current.weather_code);

    return {
      port: `${port.name} (${port.country})`,
      code: port.code,
      latitude: port.latitude,
      longitude: port.longitude,
      temperature: Math.round(result.current.temperature_2m),
      weatherCode: result.current.weather_code,
      windSpeed: Math.round(result.current.wind_speed_10m),
      condition: mapping.condition,
      status: mapping.status,
      type: port.type,
    };
  });
}
