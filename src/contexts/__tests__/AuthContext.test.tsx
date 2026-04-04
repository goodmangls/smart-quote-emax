import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { API_URL } from '@/api/apiClient';

const REFRESH_KEY = 'smartQuoteRefresh';

// ── Test helpers ──

const mockUser = {
  id: 1,
  email: 'test@example.com',
  role: 'user' as const,
  company: 'TestCo',
  name: 'Test User',
};

/** Renders a consumer component that exposes AuthContext values for assertions. */
function AuthConsumer({ onRender }: { onRender: (ctx: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onRender(auth);
  return (
    <div>
      <span data-testid="email">{auth.user?.email ?? 'none'}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="loading">{String(auth.isLoading)}</span>
    </div>
  );
}

function renderWithAuth(onRender: (ctx: ReturnType<typeof useAuth>) => void = () => {}) {
  return render(
    <AuthProvider>
      <AuthConsumer onRender={onRender} />
    </AuthProvider>,
  );
}

// ── Setup & teardown ──

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ── Tests ──

describe('AuthContext', () => {
  describe('initial unauthenticated state', () => {
    it('provides null user, isAuthenticated=false, isLoading=false when no refresh token exists', () => {
      let captured: ReturnType<typeof useAuth> | null = null;

      renderWithAuth((ctx) => { captured = ctx; });

      expect(captured!.user).toBeNull();
      expect(captured!.isAuthenticated).toBe(false);
      expect(captured!.isLoading).toBe(false);
    });
  });

  describe('login()', () => {
    it('stores refresh token in localStorage, sets user, and returns success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'jwt-abc', refresh_token: 'refresh-abc', user: mockUser }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      let captured: ReturnType<typeof useAuth> | null = null;
      renderWithAuth((ctx) => { captured = ctx; });

      let result: { success: boolean; user?: unknown; error?: string };
      await act(async () => {
        result = await captured!.login('test@example.com', 'password123');
      });

      expect(result!.success).toBe(true);
      expect(result!.user).toEqual(mockUser);
      expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-abc');
      expect(captured!.user).toEqual(mockUser);
      expect(captured!.isAuthenticated).toBe(true);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/v1/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        }),
      );
    });

    it('returns error message on failed login (401)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Invalid credentials' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      let captured: ReturnType<typeof useAuth> | null = null;
      renderWithAuth((ctx) => { captured = ctx; });

      let result: { success: boolean; user?: unknown; error?: string };
      await act(async () => {
        result = await captured!.login('bad@example.com', 'wrong');
      });

      expect(result!.success).toBe(false);
      expect(result!.error).toBe('Invalid credentials');
      expect(captured!.user).toBeNull();
      expect(captured!.isAuthenticated).toBe(false);
      expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    });

    it('returns network error when fetch throws', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Failed to fetch'));

      let captured: ReturnType<typeof useAuth> | null = null;
      renderWithAuth((ctx) => { captured = ctx; });

      let result: { success: boolean; user?: unknown; error?: string };
      await act(async () => {
        result = await captured!.login('test@example.com', 'password123');
      });

      expect(result!.success).toBe(false);
      expect(result!.error).toBe('Network error');
    });
  });

  describe('logout()', () => {
    it('clears all tokens and resets user to null', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'jwt-abc', refresh_token: 'refresh-abc', user: mockUser }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      let captured: ReturnType<typeof useAuth> | null = null;
      renderWithAuth((ctx) => { captured = ctx; });

      await act(async () => {
        await captured!.login('test@example.com', 'password123');
      });
      expect(captured!.isAuthenticated).toBe(true);

      act(() => {
        captured!.logout();
      });

      expect(captured!.user).toBeNull();
      expect(captured!.isAuthenticated).toBe(false);
      expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    });
  });

  describe('session restore on mount (refresh token)', () => {
    it('restores session using refresh token on mount', async () => {
      localStorage.setItem(REFRESH_KEY, 'existing-refresh');

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'new-access', user: mockUser }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await act(async () => {
        renderWithAuth(() => {});
      });

      await waitFor(() => {
        expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/v1/auth/refresh`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'existing-refresh' }),
        }),
      );
    });
  });

  describe('expired/invalid refresh token handling', () => {
    it('clears tokens when refresh token is invalid', async () => {
      localStorage.setItem(REFRESH_KEY, 'expired-refresh');

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Invalid refresh token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await act(async () => {
        renderWithAuth(() => {});
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('email')).toHaveTextContent('none');
      });

      expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    });

    it('clears tokens when refresh fetch throws a network error', async () => {
      localStorage.setItem(REFRESH_KEY, 'some-refresh');

      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failure'));

      await act(async () => {
        renderWithAuth(() => {});
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });

      expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    });
  });

  describe('signup() (register)', () => {
    it('creates account, stores refresh token, and auto-logs in', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'jwt-new', refresh_token: 'refresh-new', user: mockUser }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      let captured: ReturnType<typeof useAuth> | null = null;
      renderWithAuth((ctx) => { captured = ctx; });

      let result: { success: boolean; user?: unknown; error?: string };
      await act(async () => {
        result = await captured!.signup('test@example.com', 'password123', 'TestCo', 'Test User', 'KR');
      });

      expect(result!.success).toBe(true);
      expect(result!.user).toEqual(mockUser);
      expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-new');
      expect(captured!.user).toEqual(mockUser);
      expect(captured!.isAuthenticated).toBe(true);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/v1/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            password_confirmation: 'password123',
            company: 'TestCo',
            name: 'Test User',
            nationality: 'KR',
          }),
        }),
      );
    });

    it('returns error on registration failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Email already taken' } }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      let captured: ReturnType<typeof useAuth> | null = null;
      renderWithAuth((ctx) => { captured = ctx; });

      let result: { success: boolean; user?: unknown; error?: string };
      await act(async () => {
        result = await captured!.signup('existing@example.com', 'password123');
      });

      expect(result!.success).toBe(false);
      expect(result!.error).toBe('Email already taken');
      expect(captured!.isAuthenticated).toBe(false);
    });
  });

  describe('isAuthenticated reflects login state', () => {
    it('transitions from false -> true on login, then true -> false on logout', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'jwt-abc', refresh_token: 'refresh-abc', user: mockUser }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      let captured: ReturnType<typeof useAuth> | null = null;
      renderWithAuth((ctx) => { captured = ctx; });

      expect(captured!.isAuthenticated).toBe(false);

      await act(async () => {
        await captured!.login('test@example.com', 'password123');
      });
      expect(captured!.isAuthenticated).toBe(true);

      act(() => {
        captured!.logout();
      });
      expect(captured!.isAuthenticated).toBe(false);
    });
  });

  describe('useAuth() outside provider', () => {
    it('throws an error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function Orphan() {
        useAuth();
        return null;
      }

      expect(() => render(<Orphan />)).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
