// Ported from smart-quote-api/lib/constants/emax_tariff.rb
// EMAX exact rates (KRW) for CN/VN routes
// Note: VN defaults to Hanoi rates as per user request.

export const EMAX_EXACT_RATES: Record<string, Record<number, number>> = {
  CN: {
    1.0: 30000,
    1.5: 37500,
    2.0: 45000,
    2.5: 52500,
    3.0: 60000,
    3.5: 67500,
    4.0: 75000,
    4.5: 82500,
    5.0: 90000,
    5.5: 97500,
    6.0: 105000,
    6.5: 112500,
    7.0: 120000,
    7.5: 127500,
    8.0: 135000,
    8.5: 142500,
    9.0: 150000,
    9.5: 157500,
    10.0: 165000,
    10.5: 172500,
    11.0: 180000,
    11.5: 187500,
    12.0: 195000,
    12.5: 202500,
    13.0: 210000,
    13.5: 217500,
    14.0: 225000,
    14.5: 232500,
    15.0: 240000,
    15.5: 247500,
    16.0: 255000,
    16.5: 262500,
    17.0: 270000,
    17.5: 277500,
    18.0: 285000,
    18.5: 292500,
    19.0: 300000,
    19.5: 307500,
    20.0: 315000,
  },
  VN: {
    1.0: 30000,
    1.5: 35500,
    2.0: 41000,
    2.5: 46500,
    3.0: 52000,
    3.5: 57500,
    4.0: 63000,
    4.5: 68500,
    5.0: 74000,
    5.5: 79500,
    6.0: 85000,
    6.5: 90500,
    7.0: 96000,
    7.5: 101500,
    8.0: 107000,
    8.5: 112500,
    9.0: 118000,
    9.5: 123500,
    10.0: 129000,
    10.5: 134500,
    11.0: 140000,
    11.5: 145500,
    12.0: 151000,
    12.5: 156500,
    13.0: 162000,
    13.5: 167500,
    14.0: 173000,
    14.5: 178500,
    15.0: 184000,
    15.5: 189500,
    16.0: 195000,
    16.5: 200500,
    17.0: 206000,
    17.5: 211500,
    18.0: 217000,
    18.5: 222500,
    19.0: 228000,
    19.5: 233500,
    20.0: 239000,
  },
};

export const EMAX_RANGE_RATES = [
  {
    min: 20.5,
    max: 99999,
    rates: {
      CN: 15000,
      VN: 11000,
    },
  },
];

// Legacy handling charge has been baked into the rates above, but kept here if needed
export const EMAX_HANDLING_CHARGE = 15000;

// EMAX FSC is per-kg KRW (no percentage), 15-day variable.
// Source of truth shared with calculationService.ts EMAX FSC branch.
export const EMAX_FSC_PER_KG: Record<string, number> = {
  CN: 2060,
  VN: 2160,
};
