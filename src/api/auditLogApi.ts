import { request } from './apiClient';

export interface AuditLogEntry {
  id: number;
  action: string;
  resourceType: string;
  resourceId: number;
  resourceRef: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userName: string | null;
  userId: number | null;
  createdAt: string;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
  };
}

export interface AuditLogFilters {
  page?: number;
  perPage?: number;
  actionType?: string;
  userId?: number;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));
  if (filters.actionType) params.set('action_type', filters.actionType);
  if (filters.userId) params.set('user_id', String(filters.userId));
  if (filters.q) params.set('q', filters.q);
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);

  const qs = params.toString();
  return request<AuditLogResponse>(`/api/v1/audit_logs${qs ? `?${qs}` : ''}`);
}
