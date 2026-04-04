import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDiscountRules, createDiscountRule, updateDiscountRule, deleteDiscountRule, resolveDiscount } from '../discountRuleApi';

vi.mock('../apiClient', () => ({
  request: vi.fn(),
}));

import { request } from '../apiClient';
const mockRequest = vi.mocked(request);

describe('discountRuleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDiscountRules', () => {
    it('calls GET /api/v1/discount_rules', async () => {
      const mockResponse = { rules: [{ id: 1, name: 'Test' }] };
      mockRequest.mockResolvedValue(mockResponse);

      const result = await getDiscountRules();

      expect(mockRequest).toHaveBeenCalledWith('/api/v1/discount_rules');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createDiscountRule', () => {
    it('calls POST /api/v1/discount_rules with data', async () => {
      const data = { name: 'New Rule', discountPercent: 19 };
      const mockResponse = { id: 1, ...data };
      mockRequest.mockResolvedValue(mockResponse);

      const result = await createDiscountRule(data);

      expect(mockRequest).toHaveBeenCalledWith('/api/v1/discount_rules', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateDiscountRule', () => {
    it('calls PUT /api/v1/discount_rules/:id with data', async () => {
      const data = { name: 'Updated' };
      const mockResponse = { id: 5, ...data };
      mockRequest.mockResolvedValue(mockResponse);

      const result = await updateDiscountRule(5, data);

      expect(mockRequest).toHaveBeenCalledWith('/api/v1/discount_rules/5', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteDiscountRule', () => {
    it('calls DELETE /api/v1/discount_rules/:id', async () => {
      mockRequest.mockResolvedValue({ success: true });

      const result = await deleteDiscountRule(3);

      expect(mockRequest).toHaveBeenCalledWith('/api/v1/discount_rules/3', {
        method: 'DELETE',
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('resolveDiscount', () => {
    it('calls POST /api/v1/discount_rules/resolve with body', async () => {
      const mockResponse = { discountPercent: 19, matchedRule: { id: 1, name: 'Test' }, fallback: false };
      mockRequest.mockResolvedValue(mockResponse);

      const result = await resolveDiscount('user@test.com', 'KR', 25);

      expect(mockRequest).toHaveBeenCalledWith('/api/v1/discount_rules/resolve', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@test.com', nationality: 'KR', weight: 25 }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('sends email in body (not URL) to protect PII', async () => {
      mockRequest.mockResolvedValue({ discountPercent: 24, matchedRule: null, fallback: true });

      await resolveDiscount('a+b@test.com', 'Côte d\'Ivoire', 10.5);

      const [path, options] = mockRequest.mock.calls[0];
      expect(path).toBe('/api/v1/discount_rules/resolve');
      expect(path).not.toContain('email=');
      const body = JSON.parse((options as RequestInit).body as string);
      expect(body.email).toBe('a+b@test.com');
      expect(body.weight).toBe(10.5);
    });
  });
});
