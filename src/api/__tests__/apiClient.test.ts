import { describe, it, expect, beforeEach, vi } from 'vitest';
import { request, API_URL, AUTH_EXPIRED_EVENT } from '../apiClient';
import { setAccessToken, clearAllTokens } from '@/lib/authStorage';

beforeEach(() => {
  localStorage.clear();
  clearAllTokens();
  vi.restoreAllMocks();
});

describe('apiClient refresh flow', () => {
  it('refreshes access token using HttpOnly refresh cookie credentials without sending refresh token in JSON', async () => {
    setAccessToken('expired-access');
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'new-access' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));

    const result = await request<{ ok: boolean }>('/api/v1/quotes');

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      `${API_URL}/api/v1/auth/refresh`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      `${API_URL}/api/v1/quotes`,
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ Authorization: 'Bearer new-access' }),
      }),
    );
  });

  it('dispatches auth expired when cookie-based refresh fails after a 401', async () => {
    setAccessToken('expired-access');
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'invalid refresh' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }));

    await expect(request('/api/v1/quotes')).rejects.toMatchObject({ status: 401 });
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });
});
