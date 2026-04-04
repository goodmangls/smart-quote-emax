export const FUMIGATION_FEE = 30000;
export const WAR_RISK_SURCHARGE_RATE = 0; // DEC-006: War risk surcharge removed (synced with backend rates.rb)
export const PACKING_MATERIAL_BASE_COST = 15000; // per m2
export const PACKING_LABOR_UNIT_COST = 50000; // per item

// Transit Time Constants
export const TRANSIT_TIMES = {
  UPS: '2-4 Business Days',
  DHL: '2-4 Business Days',
  EMAX: '5-10 Business Days (E-MAX)',
} as const;

// Market Defaults
export const DEFAULT_EXCHANGE_RATE = 1450; // Manual: 하나은행 월요일 09시 송금환율 (2026-03-24)
export const DEFAULT_FSC_PERCENT = 46.25; // UPS default, effective 2026-03-30
export const DEFAULT_FSC_PERCENT_DHL = 30.5; // DHL default, verified 2026-03 (39% from 2026-04-01)
export const UPS_FSC_URL = "https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page";
export const UPS_RATES_HUB_URL = "https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates";
export const DHL_FSC_URL = "https://mydhl.express.dhl/kr/ko/ship/surcharges.html#/fuel_surcharge";
