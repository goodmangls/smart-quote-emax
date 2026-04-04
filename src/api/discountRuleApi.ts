import { request } from './apiClient';

export interface DiscountRule {
  id: number;
  name: string;
  ruleType: 'flat' | 'weight_based';
  priority: number;
  matchEmail: string | null;
  matchNationality: string | null;
  weightMin: number | null;
  weightMax: number | null;
  discountPercent: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedDiscount {
  discountPercent: number;
  matchedRule: { id: number; name: string } | null;
  fallback: boolean;
}

export const getDiscountRules = (): Promise<{ rules: DiscountRule[] }> =>
  request('/api/v1/discount_rules');

export const createDiscountRule = (data: Partial<DiscountRule>): Promise<DiscountRule> =>
  request('/api/v1/discount_rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateDiscountRule = (id: number, data: Partial<DiscountRule>): Promise<DiscountRule> =>
  request(`/api/v1/discount_rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteDiscountRule = (id: number): Promise<{ success: boolean }> =>
  request(`/api/v1/discount_rules/${id}`, { method: 'DELETE' });

export const resolveDiscount = (
  email: string,
  nationality: string,
  weight: number
): Promise<ResolvedDiscount> =>
  request('/api/v1/discount_rules/resolve', {
    method: 'POST',
    body: JSON.stringify({ email, nationality, weight }),
  });
