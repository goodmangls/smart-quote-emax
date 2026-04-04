import { QuoteInput, QuoteResult, QuoteDetail, QuoteListResponse, QuoteListParams, CostBreakdown, QuoteStatus } from "@/types";
import { request, ApiError, API_URL, AUTH_EXPIRED_EVENT } from "./apiClient";
import { clearAllTokens, getAccessToken } from "@/lib/authStorage";

export { ApiError as QuoteApiError };

// Maps backend breakdown fields (upsBase) to frontend generic names (intlBase).
// Handles both old saved quotes and future field names.
interface RawBreakdown {
  packingMaterial?: number;
  packingLabor?: number;
  packingFumigation?: number;
  handlingFees?: number;
  pickupInSeoul?: number;
  intlBase?: number;
  upsBase?: number;
  intlFsc?: number;
  upsFsc?: number;
  intlWarRisk?: number;
  upsWarRisk?: number;
  intlSurge?: number;
  upsSurge?: number;
  destDuty?: number;
  totalCost?: number;
}

export function mapBreakdown(raw: RawBreakdown): CostBreakdown {
  return {
    packingMaterial: raw.packingMaterial ?? 0,
    packingLabor: raw.packingLabor ?? 0,
    packingFumigation: raw.packingFumigation ?? 0,
    handlingFees: raw.handlingFees ?? 0,
    pickupInSeoul: raw.pickupInSeoul ?? 0,
    intlBase: raw.intlBase ?? raw.upsBase ?? 0,
    intlFsc: raw.intlFsc ?? raw.upsFsc ?? 0,
    intlWarRisk: raw.intlWarRisk ?? raw.upsWarRisk ?? 0,
    intlSurge: raw.intlSurge ?? raw.upsSurge ?? 0,
    destDuty: raw.destDuty ?? 0,
    totalCost: raw.totalCost ?? 0,
  };
}

// ── Existing: stateless calculation ──

export const fetchQuote = async (input: QuoteInput): Promise<QuoteResult> => {
  const raw = await request<QuoteResult & { breakdown: RawBreakdown }>('/api/v1/quotes/calculate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return { ...raw, breakdown: mapBreakdown(raw.breakdown) };
};

// ── Quote History CRUD ──

export const saveQuote = async (
  input: QuoteInput,
  notes?: string,
): Promise<QuoteDetail> => {
  // Send only input fields — backend recalculates result via QuoteCalculator
  return request<QuoteDetail>('/api/v1/quotes', {
    method: 'POST',
    body: JSON.stringify({ ...input, notes }),
  });
};

export const listQuotes = async (
  params: QuoteListParams = {}
): Promise<QuoteListResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.perPage != null) searchParams.set('per_page', String(params.perPage));
  if (params.q) searchParams.set('q', params.q);
  if (params.destinationCountry) searchParams.set('destination_country', params.destinationCountry);
  if (params.dateFrom) searchParams.set('date_from', params.dateFrom);
  if (params.dateTo) searchParams.set('date_to', params.dateTo);
  if (params.status) searchParams.set('status', params.status);

  const qs = searchParams.toString();
  return request<QuoteListResponse>(`/api/v1/quotes${qs ? `?${qs}` : ''}`);
};

export const getQuote = async (id: number): Promise<QuoteDetail> => {
  const raw = await request<QuoteDetail & { breakdown: RawBreakdown }>(`/api/v1/quotes/${id}`);
  return { ...raw, breakdown: mapBreakdown(raw.breakdown) };
};

export const updateQuoteStatus = async (
  id: number,
  status: QuoteStatus,
  notes?: string
): Promise<QuoteDetail> => {
  const raw = await request<QuoteDetail & { breakdown: RawBreakdown }>(`/api/v1/quotes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(notes !== undefined ? { notes } : {}) }),
  });
  return { ...raw, breakdown: mapBreakdown(raw.breakdown) };
};

export const sendQuoteEmail = async (
  id: number,
  recipientEmail: string,
  recipientName?: string,
  message?: string
): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/api/v1/quotes/${id}/send_email`, {
    method: 'POST',
    body: JSON.stringify({ recipientEmail, recipientName, message }),
  });
};

export const deleteQuote = async (id: number): Promise<void> => {
  return request<void>(`/api/v1/quotes/${id}`, { method: 'DELETE' });
};

export const exportQuotesCsv = async (
  params: QuoteListParams = {}
): Promise<void> => {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.destinationCountry) searchParams.set('destination_country', params.destinationCountry);
  if (params.dateFrom) searchParams.set('date_from', params.dateFrom);
  if (params.dateTo) searchParams.set('date_to', params.dateTo);
  if (params.status) searchParams.set('status', params.status);

  const qs = searchParams.toString();
  const token = getAccessToken();
  const headers: HeadersInit = { Accept: 'text/csv' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(
    `${API_URL}/api/v1/quotes/export${qs ? `?${qs}` : ''}`,
    { headers }
  );

  if (!response.ok) {
    if (response.status === 401) {
      clearAllTokens();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
      throw new ApiError(response.status, 'Session expired');
    }
    if (response.status === 403) {
      throw new ApiError(response.status, 'Access denied');
    }
    if (response.status >= 500) {
      throw new ApiError(response.status, 'Server error');
    }
    throw new ApiError(response.status, 'Failed to export CSV');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
};
