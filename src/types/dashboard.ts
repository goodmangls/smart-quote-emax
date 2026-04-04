export type PortStatus = 'Normal' | 'Delay' | 'Warning';

export interface PortWeather {
  port: string;
  code: string;
  latitude: number;
  longitude: number;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  condition: string;
  status: PortStatus;
  type: 'port' | 'airport';
}

export interface LogisticsNews {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export interface OpenMeteoCurrentUnits {
  time: string;
  temperature_2m: string;
  weather_code: string;
  wind_speed_10m: string;
}

export interface OpenMeteoCurrent {
  time: string;
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
}

export interface OpenMeteoResult {
  latitude: number;
  longitude: number;
  current_units: OpenMeteoCurrentUnits;
  current: OpenMeteoCurrent;
}

export interface LogisticsNewsResponse {
  items: LogisticsNews[];
  fetchedAt: string;
}

// Exchange Rate types
export interface ExchangeRate {
  currency: string;
  code: string;
  flag: string;
  rate: number;
  previousClose: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
}

export interface ExchangeRateResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

// Account Manager types
export interface AccountManager {
  name: string;
  nameKo: string;
  role: string;
  department: string;
  phone: string;
  mobile: string;
  email: string;
  available: boolean;
  workingHours: string;
}
