/**
 * FedEx zone mapping: country code -> { rateKey, label }
 *
 * Source of truth: "FDX 국가별 ZONE.pdf" (FedEx official country/territory zone table,
 * 수출 columns IPE/BOX · IP/BOX · IE · IPF · IEF — all five agree per row).
 * Generated from that table; do not hand-edit individual entries.
 *
 * rateKey is the tariff key in fedex_tariff.ts ("Z" + zone letter).
 *
 * Countries absent from the FedEx table (MM, SD, SS, SL, CF, KM, GW, TM, TJ, XK,
 * SM, VA) are intentionally unmapped and fall through to FEDEX_DEFAULT_ZONE.
 *
 * Synced with Calculators::FedexZone (smart-quote-api).
 */

type ZoneInfo = { rateKey: string; label: string };

const ZONE_LABELS: Record<string, string> = {
  ZA: 'Macau',
  ZD: 'GU/LA/MN/BN',
  ZE: 'US West',
  ZF: 'US/CA/MX',
  ZG: 'Europe II',
  ZH: 'Eastern Europe/C.Asia',
  ZI: 'LatAm/Caribbean',
  ZJ: 'Africa/Middle East',
  ZK: 'China South',
  ZM: 'Western Europe',
  ZN: 'Vietnam',
  ZO: 'India',
  ZP: 'Japan',
  ZQ: 'Malaysia',
  ZR: 'Thailand',
  ZS: 'Philippines',
  ZT: 'Indonesia',
  ZU: 'Australia/NZ',
  ZV: 'Hong Kong',
  ZW: 'China',
  ZX: 'Taiwan',
  ZY: 'Singapore',
};

export const FEDEX_ZONE_MAP: Record<string, string> = {
  // A (1)
  MO: 'ZA',
  // D (5)
  BN: 'ZD', GU: 'ZD', KH: 'ZD', LA: 'ZD', MN: 'ZD',
  // F (4)
  CA: 'ZF', MX: 'ZF', PR: 'ZF', US: 'ZF',
  // G (18)
  AT: 'ZG', CH: 'ZG', CZ: 'ZG', DK: 'ZG', FI: 'ZG', FO: 'ZG', GL: 'ZG', GR: 'ZG', HU: 'ZG', IE: 'ZG',
  LI: 'ZG', LU: 'ZG', MC: 'ZG', NO: 'ZG', PL: 'ZG', PT: 'ZG', SE: 'ZG', SK: 'ZG',
  // H (29)
  AD: 'ZH', AL: 'ZH', AM: 'ZH', AZ: 'ZH', BA: 'ZH', BG: 'ZH', BY: 'ZH', CY: 'ZH', EE: 'ZH', GE: 'ZH',
  GI: 'ZH', HR: 'ZH', IL: 'ZH', IS: 'ZH', KG: 'ZH', KZ: 'ZH', LT: 'ZH', LV: 'ZH', MD: 'ZH', ME: 'ZH',
  MK: 'ZH', MT: 'ZH', RO: 'ZH', RS: 'ZH', RU: 'ZH', SI: 'ZH', TR: 'ZH', UA: 'ZH', UZ: 'ZH',
  // I (62)
  AG: 'ZI', AI: 'ZI', AN: 'ZI', AR: 'ZI', AS: 'ZI', AW: 'ZI', BB: 'ZI', BM: 'ZI', BO: 'ZI', BQ: 'ZI',
  BR: 'ZI', BS: 'ZI', BZ: 'ZI', CK: 'ZI', CL: 'ZI', CO: 'ZI', CR: 'ZI', CW: 'ZI', DM: 'ZI', DO: 'ZI',
  EC: 'ZI', FJ: 'ZI', FM: 'ZI', GD: 'ZI', GF: 'ZI', GP: 'ZI', GT: 'ZI', GY: 'ZI', HN: 'ZI', HT: 'ZI',
  JM: 'ZI', KN: 'ZI', KY: 'ZI', LC: 'ZI', MF: 'ZI', MH: 'ZI', MP: 'ZI', MQ: 'ZI', MS: 'ZI', NC: 'ZI',
  NI: 'ZI', PA: 'ZI', PE: 'ZI', PF: 'ZI', PG: 'ZI', PW: 'ZI', PY: 'ZI', SR: 'ZI', SV: 'ZI', SX: 'ZI',
  TC: 'ZI', TL: 'ZI', TO: 'ZI', TT: 'ZI', UY: 'ZI', VC: 'ZI', VE: 'ZI', VG: 'ZI', VI: 'ZI', VU: 'ZI',
  WF: 'ZI', WS: 'ZI',
  // J (65)
  AE: 'ZJ', AF: 'ZJ', AO: 'ZJ', BD: 'ZJ', BF: 'ZJ', BH: 'ZJ', BI: 'ZJ', BJ: 'ZJ', BT: 'ZJ', BW: 'ZJ',
  CD: 'ZJ', CG: 'ZJ', CI: 'ZJ', CM: 'ZJ', CV: 'ZJ', DJ: 'ZJ', DZ: 'ZJ', EG: 'ZJ', ER: 'ZJ', ET: 'ZJ',
  GA: 'ZJ', GH: 'ZJ', GM: 'ZJ', GN: 'ZJ', IQ: 'ZJ', JO: 'ZJ', KE: 'ZJ', KW: 'ZJ', LB: 'ZJ', LK: 'ZJ',
  LR: 'ZJ', LS: 'ZJ', LY: 'ZJ', MA: 'ZJ', MG: 'ZJ', ML: 'ZJ', MR: 'ZJ', MU: 'ZJ', MV: 'ZJ', MW: 'ZJ',
  MZ: 'ZJ', NA: 'ZJ', NE: 'ZJ', NG: 'ZJ', NP: 'ZJ', OM: 'ZJ', PK: 'ZJ', PS: 'ZJ', QA: 'ZJ', RE: 'ZJ',
  RW: 'ZJ', SA: 'ZJ', SC: 'ZJ', SN: 'ZJ', SY: 'ZJ', SZ: 'ZJ', TD: 'ZJ', TG: 'ZJ', TN: 'ZJ', TZ: 'ZJ',
  UG: 'ZJ', YE: 'ZJ', ZA: 'ZJ', ZM: 'ZJ', ZW: 'ZJ',
  // K (1)
  'CN-S': 'ZK',
  // M (7)
  BE: 'ZM', DE: 'ZM', ES: 'ZM', FR: 'ZM', GB: 'ZM', IT: 'ZM', NL: 'ZM',
  // N (1)
  VN: 'ZN',
  // O (1)
  IN: 'ZO',
  // P (1)
  JP: 'ZP',
  // Q (1)
  MY: 'ZQ',
  // R (1)
  TH: 'ZR',
  // S (1)
  PH: 'ZS',
  // T (1)
  ID: 'ZT',
  // U (2)
  AU: 'ZU', NZ: 'ZU',
  // V (1)
  HK: 'ZV',
  // W (1)
  CN: 'ZW',
  // X (1)
  TW: 'ZX',
  // Y (1)
  SG: 'ZY',
};

/**
 * Fallback for countries the FedEx table does not list. ZJ is the most expensive
 * common zone, so an unknown destination is never quoted below cost.
 */
const FEDEX_DEFAULT_ZONE = 'ZJ';

export const determineFedexZone = (country: string): ZoneInfo => {
  const rateKey = FEDEX_ZONE_MAP[country];
  if (rateKey) return { rateKey, label: ZONE_LABELS[rateKey] };
  return { rateKey: FEDEX_DEFAULT_ZONE, label: 'Rest of World' };
};
