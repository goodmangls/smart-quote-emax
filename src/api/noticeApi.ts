import * as Sentry from '@sentry/browser';
import { request } from './apiClient';
import type { LogisticsNews } from '@/types/dashboard';

export async function fetchLogisticsNews(): Promise<LogisticsNews[]> {
  try {
    return await request<LogisticsNews[]>('/api/v1/notices/news');
  } catch (e) {
    // RSS feeds may timeout or backend may be deploying — return empty gracefully
    Sentry.captureException(e);
    return [];
  }
}

