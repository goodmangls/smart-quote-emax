import { clearAllTokens, getAccessToken, getRefreshToken, setAccessToken } from '@/lib/authStorage';

export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** Fired when the API returns 401 — AuthContext listens for this. */
export const AUTH_EXPIRED_EVENT = 'auth:expired';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function normalizeApiError(status: number): string {
  if (status === 401) return 'Session expired';
  if (status === 403) return 'Access denied';
  if (status === 404) return 'Not found';
  if (status >= 500) return 'Server error';
  return 'Request failed';
}

async function getErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return normalizeApiError(response.status);
  }

  const body = await response.json().catch(() => ({}));
  const message =
    body?.error?.message ||
    body?.error ||
    body?.message;

  if (typeof message === 'string' && message.trim() && response.status < 500) {
    return message;
  }

  return normalizeApiError(response.status);
}

// Refresh token dedup: prevent multiple concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.token);
    return true;
  } catch {
    return false;
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${path}`, {
    headers: { ...headers, ...(options?.headers || {}) },
    ...options,
  });

  // 401 → try refresh once, then retry the original request
  if (response.status === 401 && getRefreshToken()) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const refreshed = await refreshPromise;
    refreshPromise = null;

    if (refreshed) {
      const newToken = getAccessToken();
      const retryHeaders: HeadersInit = {
        ...headers,
        ...(options?.headers || {}),
        'Authorization': `Bearer ${newToken}`,
      };
      response = await fetch(`${API_URL}${path}`, { ...options, headers: retryHeaders });
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAllTokens();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, await getErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
