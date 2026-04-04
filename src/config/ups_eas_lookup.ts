/**
 * UPS Extended/Remote Area Surcharge (EAS/RAS) Lookup
 * Effective: December 21, 2025
 * Source: UPS Korea ea-surcharge-kr-ko.xlsx (86 countries, 39,876 zip ranges)
 *
 * Data format: { [countryCode]: [[zipLow, zipHigh, type], ...] }
 * type: 'EAS' = Extended Area, 'RAS' = Remote Area, 'DAS' = Delivery Area
 *
 * Lazy-loaded from /data/ups_eas_data.json to avoid bloating the bundle.
 * Uses binary search for O(log n) lookups on sorted zip ranges.
 */

export type EasSurchargeType = 'EAS' | 'RAS' | 'DAS' | null;

type EasData = Record<string, [string, string, string][]>;

let cachedData: EasData | null = null;
let loadPromise: Promise<EasData> | null = null;

const loadEasData = async (): Promise<EasData> => {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/data/ups_eas_data.json')
    .then(res => {
      if (!res.ok) throw new Error(`EAS data load failed: ${res.status}`);
      return res.json();
    })
    .then((data: EasData) => {
      cachedData = data;
      return data;
    })
    .catch(() => {
      loadPromise = null;
      return {} as EasData;
    });

  return loadPromise;
};

/** Binary search for sorted zip ranges — O(log n) instead of O(n) */
const binarySearchZip = (ranges: [string, string, string][], zip: string): string | null => {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const [low, high, type] = ranges[mid];
    const hiVal = high || low;
    if (zip < low) {
      hi = mid - 1;
    } else if (zip > hiVal) {
      lo = mid + 1;
    } else {
      return type;
    }
  }
  return null;
};

/**
 * Look up EAS/RAS/DAS surcharge for a destination postal code.
 * Returns the surcharge type or null if no surcharge applies.
 */
export const lookupEasSurcharge = async (
  countryCode: string,
  postalCode: string
): Promise<EasSurchargeType> => {
  if (!countryCode || !postalCode) return null;

  const data = await loadEasData();
  const ranges = data[countryCode.toUpperCase()];
  if (!ranges) return null;

  const zip = postalCode.replace(/[\s-]/g, '').toUpperCase();
  return binarySearchZip(ranges, zip) as EasSurchargeType;
};

/**
 * Synchronous check if EAS data is loaded (for UI display without await).
 * Call loadEasData() first to warm the cache.
 */
export const lookupEasSurchargeSync = (
  countryCode: string,
  postalCode: string
): EasSurchargeType => {
  if (!cachedData || !countryCode || !postalCode) return null;

  const ranges = cachedData[countryCode.toUpperCase()];
  if (!ranges) return null;

  const zip = postalCode.replace(/[\s-]/g, '').toUpperCase();
  return binarySearchZip(ranges, zip) as EasSurchargeType;
};

/** Pre-load EAS data (call early to warm cache) */
export const preloadEasData = (): void => {
  loadEasData();
};
