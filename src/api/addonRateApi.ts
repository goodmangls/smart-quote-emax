import { request } from '@/api/apiClient';

export interface AddonRate {
  id: number;
  code: string;
  carrier: 'DHL' | 'UPS';
  nameEn: string;
  nameKo: string;
  description: string | null;
  chargeType: 'fixed' | 'per_piece' | 'per_carton' | 'calculated';
  unit: 'shipment' | 'piece' | 'carton';
  amount: number;
  perKgRate: number | null;
  ratePercent: number | null;
  minAmount: number | null;
  fscApplicable: boolean;
  autoDetect: boolean;
  selectable: boolean;
  condition: string | null;
  detectRules: Record<string, number | string[]> | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceUrl: string | null;
  sortOrder: number;
}

export async function resolveAddonRates(carrier: 'DHL' | 'UPS'): Promise<AddonRate[]> {
  const data = await request<{ addonRates: AddonRate[] }>(
    `/api/v1/addon_rates/resolve?carrier=${carrier}`
  );
  return data.addonRates;
}
