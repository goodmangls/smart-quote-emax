import {
  addFscEntry,
  removeFscEntry,
  loadFscHistory,
  DEFAULT_FSC_HISTORY,
  FscHistoryData,
} from '../fsc-history';

describe('fsc-history', () => {
  afterEach(() => {
    localStorage.clear();
  });

  /* ───────── addFscEntry ───────── */

  describe('addFscEntry', () => {
    it('adds a new entry and sorts by date', () => {
      const data: FscHistoryData = { ups: [], dhl: [], fedex: [], ocs: [] };
      const r1 = addFscEntry(data, 'ups', { date: '2026-03-01', rate: 30 });
      const r2 = addFscEntry(r1, 'ups', { date: '2026-01-01', rate: 28 });

      expect(r2.ups).toHaveLength(2);
      expect(r2.ups[0].date).toBe('2026-01-01');
      expect(r2.ups[1].date).toBe('2026-03-01');
    });

    it('deduplicates by date (overwrites existing)', () => {
      const data: FscHistoryData = {
        ups: [{ date: '2026-01-01', rate: 28 }],
        dhl: [],
        fedex: [],
        ocs: [],
      };
      const result = addFscEntry(data, 'ups', { date: '2026-01-01', rate: 30 });

      expect(result.ups).toHaveLength(1);
      expect(result.ups[0].rate).toBe(30);
    });

    it('does not mutate original data', () => {
      const data: FscHistoryData = {
        ups: [{ date: '2026-01-01', rate: 28 }],
        dhl: [],
        fedex: [],
        ocs: [],
      };
      addFscEntry(data, 'ups', { date: '2026-02-01', rate: 30 });

      expect(data.ups).toHaveLength(1);
    });

    it('adds to the correct carrier', () => {
      const data: FscHistoryData = { ups: [], dhl: [], fedex: [], ocs: [] };
      const result = addFscEntry(data, 'dhl', { date: '2026-03', rate: 31 });

      expect(result.dhl).toHaveLength(1);
      expect(result.ups).toHaveLength(0);
    });

    it('adds an OCS entry without affecting other carriers', () => {
      const data: FscHistoryData = { ups: [], dhl: [], fedex: [], ocs: [] };
      const result = addFscEntry(data, 'ocs', { date: '2026-05-06', rate: 25 });

      expect(result.ocs).toHaveLength(1);
      expect(result.ocs[0].rate).toBe(25);
      expect(result.ups).toHaveLength(0);
      expect(result.dhl).toHaveLength(0);
      expect(result.fedex).toHaveLength(0);
    });
  });

  /* ───────── removeFscEntry ───────── */

  describe('removeFscEntry', () => {
    it('removes an entry by date', () => {
      const data: FscHistoryData = {
        ups: [
          { date: '2026-01-01', rate: 28 },
          { date: '2026-02-01', rate: 30 },
        ],
        dhl: [],
        fedex: [],
        ocs: [],
      };
      const result = removeFscEntry(data, 'ups', '2026-01-01');

      expect(result.ups).toHaveLength(1);
      expect(result.ups[0].date).toBe('2026-02-01');
    });

    it('does nothing when date not found', () => {
      const data: FscHistoryData = {
        ups: [{ date: '2026-01-01', rate: 28 }],
        dhl: [],
        fedex: [],
        ocs: [],
      };
      const result = removeFscEntry(data, 'ups', '2099-12-31');

      expect(result.ups).toHaveLength(1);
    });

    it('does not mutate original data', () => {
      const data: FscHistoryData = {
        ups: [{ date: '2026-01-01', rate: 28 }],
        dhl: [],
        fedex: [],
        ocs: [],
      };
      removeFscEntry(data, 'ups', '2026-01-01');

      expect(data.ups).toHaveLength(1);
    });
  });

  /* ───────── loadFscHistory ───────── */

  describe('loadFscHistory', () => {
    it('returns default data when localStorage is empty', () => {
      const result = loadFscHistory();

      expect(result.ups).toEqual(DEFAULT_FSC_HISTORY.ups);
      expect(result.dhl).toEqual(DEFAULT_FSC_HISTORY.dhl);
      expect(result.fedex).toEqual(DEFAULT_FSC_HISTORY.fedex);
    });

    it('loads valid data from localStorage', () => {
      const custom: FscHistoryData = {
        ups: [{ date: '2026-05-01', rate: 40 }],
        dhl: [{ date: '2026-05', rate: 35 }],
        fedex: [],
        ocs: [{ date: '2026-05-06', rate: 25 }],
      };
      localStorage.setItem('fsc_history', JSON.stringify(custom));

      const result = loadFscHistory();
      expect(result).toEqual(custom);
    });

    it('returns default data when localStorage contains corrupted JSON', () => {
      localStorage.setItem('fsc_history', '{not valid json!!!');

      const result = loadFscHistory();
      expect(result.ups).toEqual(DEFAULT_FSC_HISTORY.ups);
      expect(result.dhl).toEqual(DEFAULT_FSC_HISTORY.dhl);
    });

    it('returns default data when localStorage contains invalid structure', () => {
      localStorage.setItem('fsc_history', JSON.stringify({ ups: 'not-array', dhl: 123 }));

      const result = loadFscHistory();
      expect(result.ups).toEqual(DEFAULT_FSC_HISTORY.ups);
    });

    it('falls back to empty OCS array for legacy localStorage without ocs key', () => {
      const legacy = {
        ups: [{ date: '2026-05-01', rate: 40 }],
        dhl: [],
        fedex: [],
        // no `ocs` key — simulates pre-OCS-history schema
      };
      localStorage.setItem('fsc_history', JSON.stringify(legacy));

      const result = loadFscHistory();
      expect(result.ocs).toEqual([]);
      expect(result.ups).toEqual(legacy.ups);
    });
  });

  /* ───────── DEFAULT_FSC_HISTORY seed ───────── */

  describe('DEFAULT_FSC_HISTORY', () => {
    it('includes OCS seed entries', () => {
      expect(DEFAULT_FSC_HISTORY.ocs.length).toBeGreaterThan(0);
      expect(DEFAULT_FSC_HISTORY.ocs.every((e) => typeof e.rate === 'number')).toBe(true);
    });

    it('includes the 2026-07-06 FSC update for UPS, DHL, and FedEx', () => {
      expect(DEFAULT_FSC_HISTORY.ups.at(-1)).toEqual({ date: '2026-07-06', rate: 39.0 });
      expect(DEFAULT_FSC_HISTORY.dhl.at(-1)).toEqual({ date: '2026-07-06', rate: 40.75 });
      expect(DEFAULT_FSC_HISTORY.fedex.at(-1)).toEqual({ date: '2026-07-06', rate: 38.25 });
    });
  });
});
