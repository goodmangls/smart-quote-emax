import { FEDEX_ZONE_MAP, determineFedexZone } from '../fedex_zones';

/**
 * Regression guard for the FedEx country→zone table.
 *
 * The zone letter selects the rate table, so a wrong letter silently changes the
 * quoted price. Fixtures come from the official source ("FDX 국가별 ZONE.pdf",
 * 수출 columns) and must be updated together with fedex_zones.ts whenever FedEx
 * publishes a new table.
 */
describe('FEDEX_ZONE_MAP', () => {
  // Countries whose zone was wrong before the 2026-08 sync. Asserted by value so
  // the old grouping cannot creep back in.
  const CORRECTED: ReadonlyArray<readonly [string, string]> = [
    ['BE', 'ZM'], // was ZG
    ['NL', 'ZM'], // was ZG
    ['CH', 'ZG'], // was ZM
    ['FI', 'ZG'], // was ZM
    ['IE', 'ZG'], // was ZM
    ['MC', 'ZG'], // was ZM
    ['NO', 'ZG'], // was ZM
    ['PT', 'ZG'], // was ZM
    ['SE', 'ZG'], // was ZM
    ['SK', 'ZG'], // was ZH — was over-quoting by 14.8% at 20kg
    ['IL', 'ZH'], // was ZG — was under-quoting by 17.4% at 20kg
    ['MP', 'ZI'], // was ZD — was under-quoting by 74.2% at 20kg
    ['NZ', 'ZU'], // was ZF
  ];

  it.each(CORRECTED)('maps %s to %s (corrected against the official table)', (iso, zone) => {
    expect(FEDEX_ZONE_MAP[iso]).toBe(zone);
  });

  // One representative per zone, so a bulk regeneration that shifts a whole group
  // is caught rather than only single-country edits.
  const PER_ZONE: ReadonlyArray<readonly [string, string]> = [
    ['MO', 'ZA'],
    ['GU', 'ZD'],
    ['US', 'ZF'],
    ['AT', 'ZG'],
    ['TR', 'ZH'],
    ['BR', 'ZI'],
    ['EG', 'ZJ'],
    ['CN-S', 'ZK'],
    ['GB', 'ZM'],
    ['VN', 'ZN'],
    ['IN', 'ZO'],
    ['JP', 'ZP'],
    ['MY', 'ZQ'],
    ['TH', 'ZR'],
    ['PH', 'ZS'],
    ['ID', 'ZT'],
    ['AU', 'ZU'],
    ['HK', 'ZV'],
    ['CN', 'ZW'],
    ['TW', 'ZX'],
    ['SG', 'ZY'],
  ];

  it.each(PER_ZONE)('maps %s to %s', (iso, zone) => {
    expect(FEDEX_ZONE_MAP[iso]).toBe(zone);
  });

  it('covers every country listed in the official table', () => {
    expect(Object.keys(FEDEX_ZONE_MAP)).toHaveLength(205);
  });

  it('uses only rate keys that exist in the FedEx tariff', () => {
    const VALID = new Set('ADEFGHIJKMNOPQRSTUVWXY'.split('').map((l) => `Z${l}`));
    const bad = Object.entries(FEDEX_ZONE_MAP).filter(([, v]) => !VALID.has(v));
    expect(bad).toEqual([]);
  });
});

describe('determineFedexZone fallback', () => {
  it('falls back to ZJ, the most expensive common zone', () => {
    expect(determineFedexZone('ZZ')).toEqual({ rateKey: 'ZJ', label: 'Rest of World' });
  });

  it('does not fall back for countries that are mapped', () => {
    expect(determineFedexZone('SG')).toEqual({ rateKey: 'ZY', label: 'Singapore' });
  });

  it('returns a label for every mapped country', () => {
    const unlabelled = Object.keys(FEDEX_ZONE_MAP).filter((c) => !determineFedexZone(c).label);
    expect(unlabelled).toEqual([]);
  });

  // Countries FedEx does not list. They must stay unmapped so the safe fallback
  // applies; a guessed zone would be worse than no data.
  it.each(['MM', 'SD', 'SS', 'SL', 'CF', 'KM', 'GW', 'TM', 'TJ', 'XK', 'SM', 'VA'])(
    '%s is absent from the official table and uses the fallback',
    (iso) => {
      expect(FEDEX_ZONE_MAP[iso]).toBeUndefined();
      expect(determineFedexZone(iso).rateKey).toBe('ZJ');
    },
  );
});
