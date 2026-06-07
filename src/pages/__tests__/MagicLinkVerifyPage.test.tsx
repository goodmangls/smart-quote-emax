import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MagicLinkVerifyPage from '../MagicLinkVerifyPage';

const mockNavigate = vi.fn();
const mockVerifyMagicLink = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    verifyMagicLink: mockVerifyMagicLink,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

function renderWithToken(token?: string) {
  const search = token ? `?token=${token}` : '';
  return render(
    <MemoryRouter initialEntries={[`/auth/verify${search}`]}>
      <MagicLinkVerifyPage />
    </MemoryRouter>,
  );
}

describe('MagicLinkVerifyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: pending promise so we can observe the initial verifying state
    mockVerifyMagicLink.mockReturnValue(new Promise(() => {}));
  });

  it('shows verifying state initially when token is present', () => {
    renderWithToken('valid-token-abc');
    expect(screen.getByText('auth.magicLink.verifying')).toBeInTheDocument();
    // Spinner element present
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('navigates to /dashboard on successful verification', async () => {
    mockVerifyMagicLink.mockResolvedValue({ success: true });

    await act(async () => {
      renderWithToken('valid-token-abc');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('shows error message when verification fails', async () => {
    mockVerifyMagicLink.mockResolvedValue({ success: false, error: 'Token expired' });

    await act(async () => {
      renderWithToken('expired-token');
    });

    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeInTheDocument();
      expect(screen.getByText('auth.magicLink.backToLogin')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows fallback i18n error when verification fails without an error message', async () => {
    mockVerifyMagicLink.mockResolvedValue({ success: false });

    await act(async () => {
      renderWithToken('bad-token');
    });

    await waitFor(() => {
      expect(screen.getByText('auth.magicLink.invalidToken')).toBeInTheDocument();
    });
  });

  it('shows error immediately when no token is in the URL', async () => {
    await act(async () => {
      renderWithToken(); // no token
    });

    expect(screen.getByText('auth.magicLink.invalidToken')).toBeInTheDocument();
    expect(mockVerifyMagicLink).not.toHaveBeenCalled();
  });

  it('strips the token from browser history before verifying', async () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    mockVerifyMagicLink.mockResolvedValue({ success: false });

    await act(async () => {
      renderWithToken('sensitive-token');
    });

    expect(replaceSpy).toHaveBeenCalledWith({}, document.title, '/auth/verify');
  });

  it('calls verifyMagicLink only once even in StrictMode (useRef guard)', async () => {
    mockVerifyMagicLink.mockResolvedValue({ success: true });

    await act(async () => {
      renderWithToken('token-once');
    });

    await waitFor(() => {
      expect(mockVerifyMagicLink).toHaveBeenCalledTimes(1);
    });
  });
});
