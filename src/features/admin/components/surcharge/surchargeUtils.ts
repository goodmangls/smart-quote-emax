import { type SurchargeRule } from '@/api/surchargeApi';
import { formatKRW } from '@/lib/format';

export const CARRIER_LINKS: Record<string, { label: string; url: string }> = {
  UPS: { label: 'UPS Surcharges', url: 'https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page' },
  DHL: { label: 'DHL Surcharges', url: 'https://mydhl.express.dhl/kr/ko/ship/surcharges.html' },
};

export const EMPTY_FORM: Partial<SurchargeRule> = {
  code: '',
  name: '',
  nameKo: '',
  carrier: '',
  zone: '',
  countryCodes: [],
  chargeType: 'fixed',
  amount: 0,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: null,
  isActive: true,
  sourceUrl: '',
};

export function chargeTypeLabel(type: string, amount: number) {
  return type === 'rate' ? `${amount}%` : formatKRW(amount);
}

export function carrierBadge(carrier: string | null) {
  if (!carrier) return 'All';
  const colors: Record<string, string> = {
    UPS: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    DHL: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    EMAX: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  };
  return colors[carrier] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
}
