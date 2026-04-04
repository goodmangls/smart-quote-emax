// Ported from smart-quote-api/lib/constants/emax_tariff.rb
// EMAX per-kg rates (KRW) for CN/VN routes

export const EMAX_RATES: Record<string, number> = {
  'CN': 13500,
  'VN': 10000,
};

export const EMAX_HANDLING_CHARGE = 15000;
