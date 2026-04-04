import { fetchWithRetry } from '@/lib/fetchWithRetry';

export interface JetFuelPrice {
  date: string; // YYYY-MM-DD
  price: number; // USD per gallon
}

export async function fetchJetFuelPrices(
  weeks: number = 12,
): Promise<JetFuelPrice[]> {
  const apiKey = import.meta.env.VITE_EIA_API_KEY;
  if (!apiKey) {
    console.warn('VITE_EIA_API_KEY not configured — Jet Fuel widget disabled');
    return [];
  }

  const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=weekly&data[0]=value&facets[product][]=EPJK&facets[duoarea][]=RGC&sort[0][column]=period&sort[0][direction]=desc&length=${weeks}`;

  return fetchWithRetry(async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`EIA API error: ${res.status}`);

    const json = await res.json();
    const data = json.response?.data;
    if (!Array.isArray(data)) return [];

    return data
      .map((d: Record<string, unknown>) => ({
        date: d.period as string,
        price: parseFloat(d.value as string),
      }))
      .filter((d: JetFuelPrice) => !isNaN(d.price))
      .reverse(); // chronological order
  });
}
