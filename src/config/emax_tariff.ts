// Ported from smart-quote-api/lib/constants/emax_tariff.rb
// EMAX per-kg rates (KRW) for CN/VN routes

export const EMAX_RATES: Record<string, number> = {
  'CN': 13500,
  'VN': 10000,
};

export const EMAX_HANDLING_CHARGE = 15000;

// EMAX FSC is per-kg KRW (no percentage), 15-day variable.
// Source of truth shared with calculationService.ts EMAX FSC branch.
export const EMAX_FSC_PER_KG: Record<string, number> = {
  'CN': 2000,
  'VN': 2100,
};
