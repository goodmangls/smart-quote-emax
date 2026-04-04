import type { PortStatus } from '@/types/dashboard';

export interface WeatherMapping {
  condition: string;
  icon: 'Sun' | 'Cloud' | 'CloudFog' | 'CloudDrizzle' | 'CloudRain' | 'CloudSnow' | 'CloudLightning';
  status: PortStatus;
}

/**
 * Maps WMO weather interpretation codes (WMO 4677) to display values.
 * @see https://open-meteo.com/en/docs#weathervariables
 */
export function mapWeatherCode(code: number): WeatherMapping {
  if (code === 0)                    return { condition: 'Clear',   icon: 'Sun',            status: 'Normal' };
  if (code <= 3)                     return { condition: 'Cloudy',  icon: 'Cloud',          status: 'Normal' };
  if (code >= 45 && code <= 48)      return { condition: 'Fog',     icon: 'CloudFog',       status: 'Delay' };
  if (code >= 51 && code <= 57)      return { condition: 'Drizzle', icon: 'CloudDrizzle',   status: 'Normal' };
  if (code >= 61 && code <= 67)      return { condition: 'Rain',    icon: 'CloudRain',      status: 'Delay' };
  if (code >= 71 && code <= 77)      return { condition: 'Snow',    icon: 'CloudSnow',      status: 'Delay' };
  if (code >= 80 && code <= 82)      return { condition: 'Showers', icon: 'CloudRain',      status: 'Delay' };
  if (code >= 95 && code <= 99)      return { condition: 'Storm',   icon: 'CloudLightning', status: 'Warning' };
  return                               { condition: 'Unknown', icon: 'Cloud',          status: 'Normal' };
}
