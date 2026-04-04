import * as Sentry from '@sentry/browser';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { API_URL } from '@/api/apiClient';
import type { ExchangeRate } from '@/types/dashboard';

const PREV_RATES_KEY = 'exchange_rates_prev';

const TARGET_CURRENCIES: Record<string, { flag: string; currency: string }> = {
  USD: { flag: '\u{1F1FA}\u{1F1F8}', currency: 'US Dollar' },
  EUR: { flag: '\u{1F1EA}\u{1F1FA}', currency: 'Euro' },
  JPY: { flag: '\u{1F1EF}\u{1F1F5}', currency: 'Japanese Yen' },
  CNY: { flag: '\u{1F1E8}\u{1F1F3}', currency: 'Chinese Yuan' },
  GBP: { flag: '\u{1F1EC}\u{1F1E7}', currency: 'British Pound' },
  SGD: { flag: '\u{1F1F8}\u{1F1EC}', currency: 'Singapore Dollar' },
};

/**
 * Build ExchangeRate[] from raw KRW-based API response.
 * Rate = "1 foreign unit = X KRW" (inverted from API's KRW→foreign).
 */
function buildRates(rawRates: Record<string, number>): ExchangeRate[] {
  const prevRaw = localStorage.getItem(PREV_RATES_KEY);
  const prev: Record<string, number> = prevRaw ? JSON.parse(prevRaw) : {};

  const rates: ExchangeRate[] = [];
  const newPrev: Record<string, number> = {};

  for (const [code, meta] of Object.entries(TARGET_CURRENCIES)) {
    const raw = rawRates[code];
    if (!raw || raw === 0) continue;

    const rate = Math.round((1 / raw) * 100) / 100; // 1 foreign = X KRW
    const previousClose = prev[code] || rate;
    const change = Math.round((rate - previousClose) * 100) / 100;
    const changePercent = previousClose ? Math.round((change / previousClose) * 10000) / 100 : 0;
    const trend: ExchangeRate['trend'] = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';

    newPrev[code] = rate;
    rates.push({
      currency: code,
      code,
      flag: meta.flag,
      rate,
      previousClose,
      change,
      changePercent,
      trend,
    });
  }

  localStorage.setItem(PREV_RATES_KEY, JSON.stringify(newPrev));
  return rates;
}

/**
 * Fetch exchange rates.
 * 1. Try Rails backend proxy (cached, preferred).
 * 2. Fallback: direct call to open.er-api.com free tier.
 */
export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  // Try backend proxy first
  try {
    const rates = await fetchWithRetry(async () => {
      const res = await fetch(`${API_URL}/api/v1/exchange_rates`);
      if (!res.ok) throw new Error(`Exchange rate proxy error: ${res.status}`);
      const data = await res.json();
      return data.rates as ExchangeRate[];
    }, 1);
    if (rates.length > 0) return rates;
  } catch (e) {
    // Backend proxy unavailable — fall through to direct API
    Sentry.captureException(e);
  }

  // Fallback: direct open.er-api.com call
  return fetchWithRetry(async () => {
    const res = await fetch('https://open.er-api.com/v6/latest/KRW');
    if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success' || !data.rates) {
      throw new Error('Invalid exchange rate response');
    }
    return buildRates(data.rates as Record<string, number>);
  });
}
