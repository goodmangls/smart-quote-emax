import { Incoterm } from "@/types";

// Master country list — union of all UPS & DHL zone countries
// Source: 2025 UPS Rate & Service Guide Korea / DHL Express Service & Rate Guide 2025 Korea
export const COUNTRY_OPTIONS = [
  // Asia-Pacific
  { code: 'CN', name: '🇨🇳 China' },
  { code: 'JP', name: '🇯🇵 Japan' },
  { code: 'VN', name: '🇻🇳 Vietnam' },
  { code: 'SG', name: '🇸🇬 Singapore' },
  { code: 'HK', name: '🇭🇰 Hong Kong' },
  { code: 'TW', name: '🇹🇼 Taiwan' },
  { code: 'MO', name: '🇲🇴 Macau' },
  { code: 'TH', name: '🇹🇭 Thailand' },
  { code: 'PH', name: '🇵🇭 Philippines' },
  { code: 'ID', name: '🇮🇩 Indonesia' },
  { code: 'MY', name: '🇲🇾 Malaysia' },
  { code: 'BN', name: '🇧🇳 Brunei' },
  { code: 'KH', name: '🇰🇭 Cambodia' },
  { code: 'LA', name: '🇱🇦 Laos' },
  { code: 'MM', name: '🇲🇲 Myanmar' },
  { code: 'BD', name: '🇧🇩 Bangladesh' },
  { code: 'LK', name: '🇱🇰 Sri Lanka' },
  { code: 'MV', name: '🇲🇻 Maldives' },
  { code: 'NP', name: '🇳🇵 Nepal' },
  { code: 'MN', name: '🇲🇳 Mongolia' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'NZ', name: '🇳🇿 New Zealand' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'PK', name: '🇵🇰 Pakistan' },
  { code: 'PG', name: '🇵🇬 Papua New Guinea' },
  { code: 'FJ', name: '🇫🇯 Fiji' },
  // Americas
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'MX', name: '🇲🇽 Mexico' },
  { code: 'BR', name: '🇧🇷 Brazil' },
  { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'CL', name: '🇨🇱 Chile' },
  { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'PE', name: '🇵🇪 Peru' },
  { code: 'EC', name: '🇪🇨 Ecuador' },
  { code: 'VE', name: '🇻🇪 Venezuela' },
  { code: 'UY', name: '🇺🇾 Uruguay' },
  { code: 'PY', name: '🇵🇾 Paraguay' },
  { code: 'BO', name: '🇧🇴 Bolivia' },
  { code: 'CR', name: '🇨🇷 Costa Rica' },
  { code: 'PA', name: '🇵🇦 Panama' },
  { code: 'GT', name: '🇬🇹 Guatemala' },
  { code: 'HN', name: '🇭🇳 Honduras' },
  { code: 'SV', name: '🇸🇻 El Salvador' },
  { code: 'NI', name: '🇳🇮 Nicaragua' },
  { code: 'BZ', name: '🇧🇿 Belize' },
  { code: 'DO', name: '🇩🇴 Dominican Republic' },
  { code: 'JM', name: '🇯🇲 Jamaica' },
  { code: 'TT', name: '🇹🇹 Trinidad & Tobago' },
  { code: 'HT', name: '🇭🇹 Haiti' },
  { code: 'BS', name: '🇧🇸 Bahamas' },
  { code: 'BB', name: '🇧🇧 Barbados' },
  { code: 'SR', name: '🇸🇷 Suriname' },
  { code: 'GY', name: '🇬🇾 Guyana' },
  { code: 'PR', name: '🇵🇷 Puerto Rico' },
  // Europe — Western & Northern
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'IT', name: '🇮🇹 Italy' },
  { code: 'ES', name: '🇪🇸 Spain' },
  { code: 'NL', name: '🇳🇱 Netherlands' },
  { code: 'DK', name: '🇩🇰 Denmark' },
  { code: 'NO', name: '🇳🇴 Norway' },
  { code: 'SE', name: '🇸🇪 Sweden' },
  { code: 'FI', name: '🇫🇮 Finland' },
  { code: 'BE', name: '🇧🇪 Belgium' },
  { code: 'IE', name: '🇮🇪 Ireland' },
  { code: 'CH', name: '🇨🇭 Switzerland' },
  { code: 'AT', name: '🇦🇹 Austria' },
  { code: 'PT', name: '🇵🇹 Portugal' },
  { code: 'LU', name: '🇱🇺 Luxembourg' },
  { code: 'MC', name: '🇲🇨 Monaco' },
  { code: 'LI', name: '🇱🇮 Liechtenstein' },
  { code: 'AD', name: '🇦🇩 Andorra' },
  { code: 'IS', name: '🇮🇸 Iceland' },
  { code: 'GR', name: '🇬🇷 Greece' },
  { code: 'MT', name: '🇲🇹 Malta' },
  { code: 'CY', name: '🇨🇾 Cyprus' },
  { code: 'VA', name: '🇻🇦 Vatican City' },
  { code: 'SM', name: '🇸🇲 San Marino' },
  { code: 'GI', name: '🇬🇮 Gibraltar' },
  // Europe — Central & Eastern
  { code: 'CZ', name: '🇨🇿 Czech Republic' },
  { code: 'PL', name: '🇵🇱 Poland' },
  { code: 'HU', name: '🇭🇺 Hungary' },
  { code: 'SK', name: '🇸🇰 Slovakia' },
  { code: 'SI', name: '🇸🇮 Slovenia' },
  { code: 'HR', name: '🇭🇷 Croatia' },
  { code: 'RO', name: '🇷🇴 Romania' },
  { code: 'BG', name: '🇧🇬 Bulgaria' },
  { code: 'RS', name: '🇷🇸 Serbia' },
  { code: 'BA', name: '🇧🇦 Bosnia & Herzegovina' },
  { code: 'ME', name: '🇲🇪 Montenegro' },
  { code: 'MK', name: '🇲🇰 North Macedonia' },
  { code: 'AL', name: '🇦🇱 Albania' },
  { code: 'XK', name: '🇽🇰 Kosovo' },
  { code: 'LV', name: '🇱🇻 Latvia' },
  { code: 'LT', name: '🇱🇹 Lithuania' },
  { code: 'EE', name: '🇪🇪 Estonia' },
  { code: 'MD', name: '🇲🇩 Moldova' },
  { code: 'UA', name: '🇺🇦 Ukraine' },
  { code: 'BY', name: '🇧🇾 Belarus' },
  { code: 'RU', name: '🇷🇺 Russia' },
  // Middle East
  { code: 'AE', name: '🇦🇪 UAE' },
  { code: 'SA', name: '🇸🇦 Saudi Arabia' },
  { code: 'TR', name: '🇹🇷 Turkey' },
  { code: 'IL', name: '🇮🇱 Israel' },
  { code: 'JO', name: '🇯🇴 Jordan' },
  { code: 'LB', name: '🇱🇧 Lebanon' },
  { code: 'BH', name: '🇧🇭 Bahrain' },
  { code: 'QA', name: '🇶🇦 Qatar' },
  { code: 'KW', name: '🇰🇼 Kuwait' },
  { code: 'OM', name: '🇴🇲 Oman' },
  { code: 'IQ', name: '🇮🇶 Iraq' },
  { code: 'YE', name: '🇾🇪 Yemen' },
  // CIS & Central Asia
  { code: 'GE', name: '🇬🇪 Georgia' },
  { code: 'AM', name: '🇦🇲 Armenia' },
  { code: 'AZ', name: '🇦🇿 Azerbaijan' },
  { code: 'KZ', name: '🇰🇿 Kazakhstan' },
  { code: 'UZ', name: '🇺🇿 Uzbekistan' },
  { code: 'KG', name: '🇰🇬 Kyrgyzstan' },
  { code: 'TM', name: '🇹🇲 Turkmenistan' },
  { code: 'TJ', name: '🇹🇯 Tajikistan' },
  // Africa
  { code: 'ZA', name: '🇿🇦 South Africa' },
  { code: 'EG', name: '🇪🇬 Egypt' },
  { code: 'NG', name: '🇳🇬 Nigeria' },
  { code: 'KE', name: '🇰🇪 Kenya' },
  { code: 'GH', name: '🇬🇭 Ghana' },
  { code: 'ET', name: '🇪🇹 Ethiopia' },
  { code: 'TZ', name: '🇹🇿 Tanzania' },
  { code: 'UG', name: '🇺🇬 Uganda' },
  { code: 'MA', name: '🇲🇦 Morocco' },
  { code: 'TN', name: '🇹🇳 Tunisia' },
  { code: 'DZ', name: '🇩🇿 Algeria' },
  { code: 'SN', name: '🇸🇳 Senegal' },
  { code: 'CI', name: '🇨🇮 Ivory Coast' },
  { code: 'CM', name: '🇨🇲 Cameroon' },
  { code: 'AO', name: '🇦🇴 Angola' },
  { code: 'MZ', name: '🇲🇿 Mozambique' },
  { code: 'ZM', name: '🇿🇲 Zambia' },
  { code: 'ZW', name: '🇿🇼 Zimbabwe' },
  { code: 'BW', name: '🇧🇼 Botswana' },
  { code: 'NA', name: '🇳🇦 Namibia' },
  { code: 'MU', name: '🇲🇺 Mauritius' },
  { code: 'MG', name: '🇲🇬 Madagascar' },
  { code: 'RW', name: '🇷🇼 Rwanda' },
  { code: 'CD', name: '🇨🇩 DR Congo' },
  { code: 'CG', name: '🇨🇬 Congo' },
  { code: 'GA', name: '🇬🇦 Gabon' },
  { code: 'ML', name: '🇲🇱 Mali' },
  { code: 'BF', name: '🇧🇫 Burkina Faso' },
  { code: 'NE', name: '🇳🇪 Niger' },
  { code: 'TD', name: '🇹🇩 Chad' },
  { code: 'GM', name: '🇬🇲 Gambia' },
  { code: 'GN', name: '🇬🇳 Guinea' },
  { code: 'SL', name: '🇸🇱 Sierra Leone' },
  { code: 'LR', name: '🇱🇷 Liberia' },
  { code: 'TG', name: '🇹🇬 Togo' },
  { code: 'BJ', name: '🇧🇯 Benin' },
  { code: 'ER', name: '🇪🇷 Eritrea' },
  { code: 'DJ', name: '🇩🇯 Djibouti' },
  { code: 'MW', name: '🇲🇼 Malawi' },
  { code: 'LS', name: '🇱🇸 Lesotho' },
  { code: 'SZ', name: '🇸🇿 Eswatini' },
  { code: 'SC', name: '🇸🇨 Seychelles' },
  { code: 'CV', name: '🇨🇻 Cape Verde' },
  { code: 'BI', name: '🇧🇮 Burundi' },
  { code: 'CF', name: '🇨🇫 Central African Republic' },
  { code: 'KM', name: '🇰🇲 Comoros' },
  { code: 'GW', name: '🇬🇼 Guinea-Bissau' },
  { code: 'MR', name: '🇲🇷 Mauritania' },
  // SO (Somalia) removed — UPS/DHL unshippable
  { code: 'SD', name: '🇸🇩 Sudan' },
  { code: 'SS', name: '🇸🇸 South Sudan' },
  { code: 'LY', name: '🇱🇾 Libya' },
  // Caribbean & Overseas Territories
  { code: 'AF', name: '🇦🇫 Afghanistan' },
  { code: 'AG', name: '🇦🇬 Antigua & Barbuda' },
  { code: 'AI', name: '🇦🇮 Anguilla' },
  { code: 'AW', name: '🇦🇼 Aruba' },
  { code: 'CW', name: '🇨🇼 Curacao' },
  { code: 'DM', name: '🇩🇲 Dominica' },
  { code: 'GD', name: '🇬🇩 Grenada' },
  { code: 'FO', name: '🇫🇴 Faroe Islands' },
  { code: 'GL', name: '🇬🇱 Greenland' },
  { code: 'GP', name: '🇬🇵 Guadeloupe' },
  { code: 'KN', name: '🇰🇳 St. Kitts & Nevis' },
  { code: 'MP', name: '🇲🇵 Northern Mariana Islands' },
  { code: 'MQ', name: '🇲🇶 Martinique' },
  { code: 'MS', name: '🇲🇸 Montserrat' },
  { code: 'NC', name: '🇳🇨 New Caledonia' },
  { code: 'SX', name: '🇸🇽 St. Maarten' },
  { code: 'TC', name: '🇹🇨 Turks & Caicos' },
  { code: 'VI', name: '🇻🇮 US Virgin Islands' },
];

// ─── UPS Zone-to-Country mappings (Z1-Z10) ──────────────────────────
// Source: 2025 UPS Rate & Service Guide — Korea (UPS Worldwide Express Saver Export)
// Source: Zone Guide 2026.xlsx (UPS sheet)
export const UPS_ZONE_COUNTRIES: Record<string, string[]> = {
  Z1: ['CN', 'MO', 'SG', 'TW'],
  Z2: ['JP', 'VN'],
  Z3: ['BN', 'ID', 'MY', 'PH', 'TH'],
  Z4: ['AU', 'IN', 'NF', 'NZ'],
  Z5: ['CA', 'MX', 'PR', 'US'],
  Z6: [
    'AD', 'BE', 'CH', 'CZ', 'DE', 'ES', 'FR', 'GB', 'IC', 'IT',
    'LI', 'LU', 'MC', 'NL', 'PL', 'SE', 'SK', 'SM', 'VA',
  ],
  Z7: ['AT', 'AX', 'DK', 'FI', 'GR', 'IE', 'NO', 'PT'],
  Z8: [
    'AE', 'AG', 'AI', 'AR', 'AW', 'AZ', 'BB', 'BD', 'BG', 'BH',
    'BL', 'BO', 'BR', 'BS', 'BZ', 'CL', 'CO', 'CR', 'CW',
    'CY', 'DM', 'DO', 'EC', 'EG', 'ER', 'GD', 'GI',
    'GP', 'GT', 'HN', 'HR', 'HT', 'HU', 'IS', 'JM',
    'KH', 'KN', 'KW', 'LA', 'LC', 'LK', 'LT', 'LV', 'MM',
    'MQ', 'MS', 'MT', 'MV', 'NI', 'OM', 'PA', 'PE', 'PK', 'PY',
    'QA', 'RO', 'RU', 'SA', 'SI', 'SR', 'SV', 'SX', 'TC', 'TR',
    'TT', 'UA', 'UY', 'VC', 'VE', 'VI', 'ZA',
  ],
  Z9: [
    'AF', 'AL', 'AM', 'AO', 'AS', 'BA', 'BF', 'BI', 'BJ', 'BM',
    'BW', 'BY', 'CD', 'CF', 'CG', 'CI', 'CM', 'CV', 'DJ', 'DZ',
    'EE', 'ET', 'FO', 'GA', 'GE', 'GH', 'GL', 'GM', 'GN', 'GQ',
    'GW', 'GY', 'IL', 'IQ', 'JO', 'KE', 'KG', 'KM', 'KZ', 'LB',
    'LR', 'LS', 'MA', 'MD', 'ME', 'MG', 'MK', 'ML', 'MN', 'MP',
    'MR', 'MU', 'MW', 'MZ', 'NA', 'NC', 'NE', 'NG', 'NP', 'RE',
    'RS', 'RW', 'SC', 'SL', 'SN', 'SZ', 'TD', 'TG', 'TM', 'TN',
    'TZ', 'UG', 'UZ', 'WS', 'YT', 'ZM', 'ZW',
    'BQ', 'VG', 'KY', 'GF', 'GU', 'GG', 'JE',
  ],
  Z10: ['HK'],
};

// Source: Zone Guide 2026.xlsx (DHL sheet)
export const DHL_ZONE_COUNTRIES: Record<string, string[]> = {
  Z1: ['CN', 'HK', 'MO', 'SG', 'TW'],
  Z2: ['JP'],
  Z3: ['BN', 'ID', 'KH', 'LA', 'MM', 'MY', 'PH', 'TH', 'VN'],
  Z4: ['AU', 'BD', 'IN', 'LK', 'NZ', 'PG', 'PK'],
  Z5: ['CA', 'MX', 'US'],
  Z6: [
    'AD', 'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE',
    'ES', 'FI', 'FR', 'GB', 'GG', 'GR', 'HR', 'HU', 'IE', 'IT',
    'JE', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL', 'NO', 'PL',
    'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'VA',
  ],
  Z7: [
    'AE', 'AL', 'BA', 'BH', 'GI', 'IC', 'IL', 'KV', 'KW', 'ME', 'MK', 'OM',
    'QA', 'RS', 'SA', 'TR',
  ],
  Z8: [
    'AF', 'AG', 'AI', 'AM', 'AO', 'AR', 'AS', 'AW', 'AZ', 'BB',
    'BF', 'BI', 'BJ', 'BM', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'XB',
    'BZ', 'CD', 'CF', 'CG', 'CI', 'CK', 'CL', 'CM', 'CO', 'CR',
    'CU', 'CV', 'DJ', 'DM', 'DO', 'DZ', 'EC', 'EG', 'ER', 'ET',
    'FJ', 'FK', 'FM', 'FO', 'GA', 'GD', 'GE', 'GF', 'GH', 'GL',
    'GM', 'GN', 'GP', 'GQ', 'GT', 'GU', 'GW', 'GY', 'HN', 'HT',
    'IQ', 'IR', 'IS', 'JM', 'JO', 'KE', 'KG', 'KI', 'KM', 'KN',
    'KP', 'KY', 'KZ', 'LB', 'LC', 'LR', 'LS', 'LY', 'MA', 'MD',
    'MG', 'MH', 'ML', 'MN', 'MP', 'MQ', 'MR', 'MS', 'MU', 'MV',
    'MW', 'MZ', 'NA', 'NC', 'NE', 'NG', 'NI', 'NP', 'NR', 'NU',
    'PA', 'PE', 'PF', 'PR', 'PW', 'PY', 'RE', 'RU', 'RW', 'SB',
    'SC', 'SD', 'SH', 'SL', 'SN', 'SR', 'SS', 'ST', 'SV',
    'SY', 'SZ', 'TC', 'TD', 'TG', 'TJ', 'TL', 'TM', 'TN', 'TO',
    'TT', 'TV', 'TZ', 'UA', 'UG', 'UY', 'UZ', 'VC', 'VE', 'VG',
    'VI', 'VU', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
  ],
};

// ─── Nationality options for signup / admin ─────────────────────────
// Top 7 pinned (frequent B2B partners), rest alphabetical from COUNTRY_OPTIONS
const PINNED_NATIONALITY_CODES = ['KR', 'US', 'CN', 'JP', 'VN', 'TW', 'SG'];

export const NATIONALITY_OPTIONS: { code: string; name: string }[] = (() => {
  const pinned = PINNED_NATIONALITY_CODES.map(code => {
    if (code === 'KR') return { code: 'KR', name: '🇰🇷 South Korea' };
    return COUNTRY_OPTIONS.find(c => c.code === code)!;
  });
  const rest = COUNTRY_OPTIONS
    .filter(c => !PINNED_NATIONALITY_CODES.includes(c.code))
    .sort((a, b) => {
      const nameA = a.name.replace(/^[^\w]+/, '');
      const nameB = b.name.replace(/^[^\w]+/, '');
      return nameA.localeCompare(nameB);
    });
  return [...pinned, ...rest];
})();

/** Look up display name (with flag) from country code */
export function getCountryDisplayName(code: string): string {
  if (!code) return '-';
  const found = NATIONALITY_OPTIONS.find(c => c.code === code);
  return found ? found.name : code;
}

export const ORIGIN_COUNTRY_OPTIONS = [
    { code: 'KR', name: '🇰🇷 South Korea' },
    { code: 'CN', name: '🇨🇳 China' },
    { code: 'VN', name: '🇻🇳 Vietnam' },
    { code: 'US', name: '🇺🇸 United States' },
];

export const INCOTERM_OPTIONS = Object.values(Incoterm);

export const SEOUL_PICKUP_ZONES: { districts: string[]; districtsEn: string[]; cost: number; costUsd: number }[] = [
  { districts: ['강서', '양천', '마포'],                           districtsEn: ['Gangseo', 'Yangcheon', 'Mapo'],                       cost: 30000, costUsd: 30 },
  { districts: ['구로', '금천', '관악', '동작', '영등포'],         districtsEn: ['Guro', 'Geumcheon', 'Gwanak', 'Dongjak', 'Yeongdeungpo'], cost: 35000, costUsd: 35 },
  { districts: ['은평', '서대문', '종로', '중구', '용산'],         districtsEn: ['Eunpyeong', 'Seodaemun', 'Jongno', 'Jung-gu', 'Yongsan'], cost: 40000, costUsd: 40 },
  { districts: ['강남', '서초', '송파'],                           districtsEn: ['Gangnam', 'Seocho', 'Songpa'],                        cost: 45000, costUsd: 45 },
  { districts: ['동대문', '성동', '광진', '강동'],                 districtsEn: ['Dongdaemun', 'Seongdong', 'Gwangjin', 'Gangdong'],    cost: 45000, costUsd: 45 },
  { districts: ['강북', '도봉', '노원', '중랑'],                   districtsEn: ['Gangbuk', 'Dobong', 'Nowon', 'Jungnang'],             cost: 55000, costUsd: 55 },
];
