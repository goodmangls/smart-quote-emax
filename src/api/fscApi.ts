import { request } from './apiClient';

export interface FscRates {
  rates: {
    UPS: { international: number; domestic: number };
    DHL: { international: number; domestic: number };
  };
  updatedAt: string;
}

export const getFscRates = async (): Promise<FscRates> => {
  return request<FscRates>('/api/v1/fsc/rates');
};

export const updateFscRate = async (
  carrier: 'UPS' | 'DHL',
  international: number,
  domestic: number
): Promise<{ success: boolean }> => {
  return request<{ success: boolean }>('/api/v1/fsc/update', {
    method: 'POST',
    body: JSON.stringify({ carrier, international, domestic }),
  });
};
