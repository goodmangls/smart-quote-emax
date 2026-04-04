export interface PortConfig {
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  country: string;
  type: 'port' | 'airport';
}

/** Items per page in the weather widget */
export const PORTS_PER_PAGE = 6;

export const MONITORED_PORTS: PortConfig[] = [
  // ── Korea (Origin) ──
  { name: 'Incheon',      code: 'KR-ICN', latitude: 37.4563, longitude: 126.7052, country: 'KR', type: 'port' },
  { name: 'Busan',        code: 'KR-PUS', latitude: 35.1796, longitude: 129.0756, country: 'KR', type: 'port' },
  { name: 'Incheon (ICN)',  code: 'KR-ICN-AIR', latitude: 37.4602, longitude: 126.4407, country: 'KR', type: 'airport' },

  // ── Asia-Pacific ──
  { name: 'Shanghai',     code: 'CN-SHA', latitude: 31.2304, longitude: 121.4737, country: 'CN', type: 'port' },
  { name: 'Pudong (PVG)',   code: 'CN-PVG-AIR', latitude: 31.1434, longitude: 121.8083, country: 'CN', type: 'airport' },
  { name: 'Tokyo',        code: 'JP-TYO', latitude: 35.4437, longitude: 139.6380, country: 'JP', type: 'port' },
  { name: 'Narita (NRT)',   code: 'JP-NRT-AIR', latitude: 35.7647, longitude: 140.3864, country: 'JP', type: 'airport' },
  { name: 'Ho Chi Minh',  code: 'VN-SGN', latitude: 10.8231, longitude: 106.6297, country: 'VN', type: 'port' },
  { name: 'Tan Son Nhat (SGN)', code: 'VN-SGN-AIR', latitude: 10.8188, longitude: 106.6520, country: 'VN', type: 'airport' },
  { name: 'Singapore',    code: 'SG-SIN', latitude: 1.2644,  longitude: 103.8223, country: 'SG', type: 'port' },
  { name: 'Changi (SIN)',   code: 'SG-SIN-AIR', latitude: 1.3644,  longitude: 103.9915, country: 'SG', type: 'airport' },
  { name: 'Hong Kong',    code: 'HK-HKG', latitude: 22.3193, longitude: 114.1694, country: 'HK', type: 'port' },
  { name: 'Hong Kong (HKG)', code: 'HK-HKG-AIR', latitude: 22.3080, longitude: 113.9185, country: 'HK', type: 'airport' },
  { name: 'Kaohsiung',    code: 'TW-KHH', latitude: 22.6163, longitude: 120.3133, country: 'TW', type: 'port' },
  { name: 'Taoyuan (TPE)',  code: 'TW-TPE-AIR', latitude: 25.0797, longitude: 121.2342, country: 'TW', type: 'airport' },
  { name: 'Laem Chabang', code: 'TH-LCB', latitude: 13.0827, longitude: 100.8841, country: 'TH', type: 'port' },
  { name: 'Suvarnabhumi (BKK)', code: 'TH-BKK-AIR', latitude: 13.6900, longitude: 100.7501, country: 'TH', type: 'airport' },
  { name: 'Manila',       code: 'PH-MNL', latitude: 14.5995, longitude: 120.9842, country: 'PH', type: 'port' },
  { name: 'Ninoy Aquino (MNL)', code: 'PH-MNL-AIR', latitude: 14.5086, longitude: 121.0197, country: 'PH', type: 'airport' },
  { name: 'Sydney',       code: 'AU-SYD', latitude: -33.8688, longitude: 151.2093, country: 'AU', type: 'port' },
  { name: 'Sydney (SYD)',   code: 'AU-SYD-AIR', latitude: -33.9461, longitude: 151.1772, country: 'AU', type: 'airport' },
  { name: 'Mumbai',       code: 'IN-BOM', latitude: 19.0760, longitude: 72.8777, country: 'IN', type: 'port' },
  { name: 'Mumbai (BOM)',   code: 'IN-BOM-AIR', latitude: 19.0896, longitude: 72.8656, country: 'IN', type: 'airport' },

  // ── Americas ──
  { name: 'Los Angeles',  code: 'US-LAX', latitude: 33.7501, longitude: -118.2500, country: 'US', type: 'port' },
  { name: 'JFK (JFK)',      code: 'US-JFK-AIR', latitude: 40.6413, longitude: -73.7781, country: 'US', type: 'airport' },
  { name: 'Vancouver',    code: 'CA-YVR', latitude: 49.2827, longitude: -123.1207, country: 'CA', type: 'port' },
  { name: 'Vancouver (YVR)', code: 'CA-YVR-AIR', latitude: 49.1967, longitude: -123.1815, country: 'CA', type: 'airport' },
  { name: 'Santos',       code: 'BR-SSZ', latitude: -23.9608, longitude: -46.3336, country: 'BR', type: 'port' },
  { name: 'Guarulhos (GRU)', code: 'BR-GRU-AIR', latitude: -23.4356, longitude: -46.4731, country: 'BR', type: 'airport' },

  // ── Europe ──
  { name: 'Hamburg',      code: 'DE-HAM', latitude: 53.5511, longitude: 9.9937,   country: 'DE', type: 'port' },
  { name: 'Frankfurt (FRA)', code: 'DE-FRA-AIR', latitude: 50.0379, longitude: 8.5622,   country: 'DE', type: 'airport' },
  { name: 'Felixstowe',   code: 'GB-FXT', latitude: 51.9611, longitude: 1.3511,   country: 'GB', type: 'port' },
  { name: 'Heathrow (LHR)', code: 'GB-LHR-AIR', latitude: 51.4700, longitude: -0.4543,  country: 'GB', type: 'airport' },
  { name: 'Le Havre',     code: 'FR-LEH', latitude: 49.4944, longitude: 0.1079,   country: 'FR', type: 'port' },
  { name: 'Charles de Gaulle (CDG)', code: 'FR-CDG-AIR', latitude: 49.0097, longitude: 2.5479, country: 'FR', type: 'airport' },
  { name: 'Genoa',        code: 'IT-GOA', latitude: 44.4056, longitude: 8.9463,   country: 'IT', type: 'port' },
  { name: 'Malpensa (MXP)', code: 'IT-MXP-AIR', latitude: 45.6306, longitude: 8.7281,   country: 'IT', type: 'airport' },
  { name: 'Barcelona',    code: 'ES-BCN', latitude: 41.3851, longitude: 2.1734,   country: 'ES', type: 'port' },
  { name: 'Madrid (MAD)',   code: 'ES-MAD-AIR', latitude: 40.4983, longitude: -3.5676,  country: 'ES', type: 'airport' },
  { name: 'Rotterdam',    code: 'NL-RTM', latitude: 51.9225, longitude: 4.4792,   country: 'NL', type: 'port' },
  { name: 'Schiphol (AMS)', code: 'NL-AMS-AIR', latitude: 52.3105, longitude: 4.7683,   country: 'NL', type: 'airport' },

  // ── Middle East ──
  { name: 'Jebel Ali',    code: 'AE-JEA', latitude: 25.0657, longitude: 55.1713, country: 'AE', type: 'port' },
  { name: 'Dubai (DXB)',    code: 'AE-DXB-AIR', latitude: 25.2532, longitude: 55.3657, country: 'AE', type: 'airport' },
  { name: 'Jeddah',       code: 'SA-JED', latitude: 21.5433, longitude: 39.1728, country: 'SA', type: 'port' },
  { name: 'Jeddah (JED)',   code: 'SA-JED-AIR', latitude: 21.6796, longitude: 39.1565, country: 'SA', type: 'airport' },
  { name: 'Istanbul',     code: 'TR-IST', latitude: 41.0082, longitude: 28.9784, country: 'TR', type: 'port' },
  { name: 'Istanbul (IST)', code: 'TR-IST-AIR', latitude: 41.2753, longitude: 28.7519, country: 'TR', type: 'airport' },
];
