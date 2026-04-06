import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { API_URL } from './apiClient';

export interface JetFuelPrice {
  date: string; // YYYY-MM-DD
  price: number; // USD per gallon
}

export async function fetchJetFuelPrices(
  weeks: number = 12,
): Promise<JetFuelPrice[]> {
  const url = `${API_URL}/api/v1/jet_fuel?weeks=${weeks}`;

  return fetchWithRetry(async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jet Fuel API error: ${res.status}`);

    const json = await res.json();
    const data = json.data;
    if (!Array.isArray(data)) return [];

    return data.filter((d: JetFuelPrice) => !isNaN(d.price));
  });
}
