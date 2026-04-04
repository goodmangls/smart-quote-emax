import { request } from './apiClient';

export interface SurchargeRule {
  id: number;
  code: string;
  name: string;
  nameKo: string | null;
  description: string | null;
  carrier: string | null;
  zone: string | null;
  countryCodes: string[];
  chargeType: 'fixed' | 'rate';
  amount: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  sourceUrl: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedSurcharge {
  id: number;
  code: string;
  name: string;
  name_ko: string | null;
  charge_type: 'fixed' | 'rate';
  amount: number;
  carrier: string | null;
  source_url: string | null;
  effective_from: string;
  effective_to: string | null;
}

// Admin CRUD
export const getSurcharges = async (): Promise<{ surcharges: SurchargeRule[] }> => {
  return request<{ surcharges: SurchargeRule[] }>('/api/v1/surcharges');
};

export const createSurcharge = async (data: Partial<SurchargeRule>): Promise<SurchargeRule> => {
  return request<SurchargeRule>('/api/v1/surcharges', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateSurcharge = async (id: number, data: Partial<SurchargeRule>): Promise<SurchargeRule> => {
  return request<SurchargeRule>(`/api/v1/surcharges/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteSurcharge = async (id: number): Promise<{ success: boolean }> => {
  return request<{ success: boolean }>(`/api/v1/surcharges/${id}`, {
    method: 'DELETE',
  });
};

// Resolve: get applicable surcharges for a carrier/country/zone
export const resolveSurcharges = async (
  carrier: string,
  country?: string,
  zone?: string
): Promise<{ surcharges: ResolvedSurcharge[] }> => {
  const params = new URLSearchParams({ carrier });
  if (country) params.set('country', country);
  if (zone) params.set('zone', zone);
  return request<{ surcharges: ResolvedSurcharge[] }>(`/api/v1/surcharges/resolve?${params}`);
};
