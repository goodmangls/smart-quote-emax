import { type SurchargeRule } from '@/api/surchargeApi';
import { formatKRW } from '@/lib/format';
import { carrierBadgeClass } from '@/config/carrier-badge';

export const CARRIER_LINKS: Record<string, { label: string; url: string }> = {
  UPS: {
    label: 'UPS Surcharges',
    url: 'https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page',
  },
  DHL: {
    label: 'DHL Surcharges',
    url: 'https://mydhl.express.dhl/kr/ko/ship/surcharges.html#/fuel_surcharge',
  },
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
  return carrierBadgeClass(carrier);
}
