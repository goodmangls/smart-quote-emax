/**
 * FSC (Fuel Surcharge) historical rate data with localStorage persistence.
 *
 * UPS: weekly updates (every Monday)
 * DHL: monthly updates (1st of each month)
 */

export interface FscHistoryEntry {
  date: string; // YYYY-MM-DD for UPS (weekly), YYYY-MM for DHL (monthly)
  rate: number; // percentage value, e.g. 38.5 means 38.5%
}

export interface FscHistoryData {
  ups: FscHistoryEntry[];
  dhl: FscHistoryEntry[];
}

const STORAGE_KEY = 'fsc_history';

/** Default seed data from UPS / DHL official pages */
export const DEFAULT_FSC_HISTORY: FscHistoryData = {
  ups: [
    { date: '2026-01-05', rate: 29.0 },
    { date: '2026-01-12', rate: 28.5 },
    { date: '2026-01-19', rate: 28.25 },
    { date: '2026-01-26', rate: 28.25 },
    { date: '2026-02-02', rate: 30.25 },
    { date: '2026-02-09', rate: 30.75 },
    { date: '2026-02-16', rate: 30.25 },
    { date: '2026-02-23', rate: 30.25 },
    { date: '2026-03-02', rate: 32.0 },
    { date: '2026-03-09', rate: 33.25 },
    { date: '2026-03-16', rate: 38.5 },
    { date: '2026-03-23', rate: 41.75 },
  ],
  dhl: [
    { date: '2026-01', rate: 30.0 },
    { date: '2026-02', rate: 28.75 },
    { date: '2026-03', rate: 30.5 },
    { date: '2026-04', rate: 39.0 },
  ],
};

function isValidEntry(e: unknown): e is FscHistoryEntry {
  if (typeof e !== 'object' || e === null) return false;
  const entry = e as Record<string, unknown>;
  return typeof entry.date === 'string'
    && entry.date.length > 0
    && typeof entry.rate === 'number'
    && isFinite(entry.rate)
    && entry.rate >= 0;
}

/** Load FSC history from localStorage, falling back to default seed data. */
export function loadFscHistory(): FscHistoryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FscHistoryData;
      if (Array.isArray(parsed.ups) && Array.isArray(parsed.dhl)) {
        return {
          ups: parsed.ups.filter(isValidEntry),
          dhl: parsed.dhl.filter(isValidEntry),
        };
      }
    }
  } catch {
    // corrupted data — fall through to default
  }
  return structuredClone(DEFAULT_FSC_HISTORY);
}

/** Persist FSC history to localStorage. */
export function saveFscHistory(data: FscHistoryData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Add a new entry to the given carrier's history (sorted by date). */
export function addFscEntry(
  data: FscHistoryData,
  carrier: 'ups' | 'dhl',
  entry: FscHistoryEntry,
): FscHistoryData {
  const updated = structuredClone(data);
  // Remove duplicate date if exists
  updated[carrier] = updated[carrier].filter((e) => e.date !== entry.date);
  updated[carrier].push(entry);
  updated[carrier].sort((a, b) => a.date.localeCompare(b.date));
  return updated;
}

/** Remove an entry by date from the given carrier's history. */
export function removeFscEntry(
  data: FscHistoryData,
  carrier: 'ups' | 'dhl',
  date: string,
): FscHistoryData {
  const updated = structuredClone(data);
  updated[carrier] = updated[carrier].filter((e) => e.date !== date);
  return updated;
}
