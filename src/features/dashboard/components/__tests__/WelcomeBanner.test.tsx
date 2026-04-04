import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WelcomeBanner } from '../WelcomeBanner';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (key: string) => key }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderBanner() {
  return render(
    <MemoryRouter><WelcomeBanner /></MemoryRouter>,
  );
}

describe('WelcomeBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'john@company.com', role: 'user' },
      isAuthenticated: true,
    });
  });

  it('displays username from email prefix', () => {
    renderBanner();
    // "john" appears in h1 (username) and p (full email)
    expect(screen.getAllByText(/john/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('john@company.com')).toBeInTheDocument();
  });

  it('shows Guest when no user email', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    renderBanner();
    expect(screen.getByText(/Guest/)).toBeInTheDocument();
  });

  it('renders welcome heading', () => {
    renderBanner();
    expect(screen.getByText(/dashboard.welcome/)).toBeInTheDocument();
  });

  it('renders New Quote button', () => {
    renderBanner();
    expect(screen.getByText('dashboard.newQuote')).toBeInTheDocument();
  });

  it('navigates to /quote when New Quote clicked', async () => {
    const user = userEvent.setup();
    renderBanner();
    await user.click(screen.getByText('dashboard.newQuote'));
    expect(mockNavigate).toHaveBeenCalledWith('/quote');
  });
});
