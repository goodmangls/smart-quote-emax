import { request, API_URL } from './apiClient';

export interface ShareResponse {
  shareUrl: string;
  token: string;
  expiresAt: string;
}

export interface SharedQuoteData {
  referenceNo: string;
  originCountry: string;
  destinationCountry: string;
  destinationZip?: string;
  overseasCarrier: string;
  totalQuoteAmount: number;
  totalQuoteAmountUsd: number;
  appliedZone: string;
  transitTime: string;
  incoterm: string;
  billableWeight: number;
  createdAt: string;
  validityDate?: string;
  shared: boolean;
}

export const createShareLink = async (quoteId: number): Promise<ShareResponse> =>
  request<ShareResponse>(`/api/v1/quotes/${quoteId}/share`, { method: 'POST' });

export const getSharedQuote = async (token: string): Promise<SharedQuoteData> => {
  const res = await fetch(`${API_URL}/api/v1/shared/${token}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || (res.status === 410 ? 'This share link has expired' : 'Invalid share link'));
  }
  return res.json();
};
