/**
 * Carrier badge colours. Every carrier pill reads this table (admin surcharge
 * table, mobile result bar) so a carrier never shows two colours. Add a carrier
 * here, not inside a component. Classes are written out in full so Tailwind can
 * find them.
 */
const CARRIER_BADGE_CLASS = new Map<string, string>([
  ['UPS', 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'],
  ['DHL', 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'],
  ['FEDEX', 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'],
  ['EMAX', 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'],
]);

const NEUTRAL_BADGE_CLASS = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';

export function carrierBadgeClass(carrier: string): string {
  return CARRIER_BADGE_CLASS.get(carrier) ?? NEUTRAL_BADGE_CLASS;
}
