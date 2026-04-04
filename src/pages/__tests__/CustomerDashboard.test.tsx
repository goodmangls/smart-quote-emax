import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CustomerDashboard from '../CustomerDashboard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@jways.co.kr', role: 'admin', name: 'Admin' },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (key: string) => key }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false, toggleDarkMode: vi.fn() }),
}));

vi.mock('@/features/dashboard/hooks/useExchangeRates', () => ({
  useExchangeRates: () => ({
    data: [
      { currency: 'USD', code: 'USD', flag: '🇺🇸', rate: 1400, previousClose: 1395, change: 5, changePercent: 0.36, trend: 'up' },
      { currency: 'EUR', code: 'EUR', flag: '🇪🇺', rate: 1500, previousClose: 1510, change: -10, changePercent: -0.66, trend: 'down' },
    ],
    loading: false,
    error: null,
    lastUpdated: new Date(),
    isStale: false,
    retry: vi.fn(),
  }),
}));

vi.mock('@/features/dashboard/hooks/usePortWeather', () => ({
  usePortWeather: () => ({
    data: [
      { port: 'Busan', code: 'KRPUS', latitude: 35.1, longitude: 129.03, temperature: 18, weatherCode: 0, windSpeed: 5, condition: 'Clear', status: 'good', type: 'port' },
    ],
    loading: false,
    error: null,
    retry: vi.fn(),
  }),
}));

vi.mock('@/features/dashboard/hooks/useLogisticsNews', () => ({
  useLogisticsNews: () => ({ data: [], loading: false, error: null, retry: vi.fn() }),
}));

const mockListQuotes = vi.fn();
vi.mock('@/api/quoteApi', () => ({
  listQuotes: (...args: unknown[]) => mockListQuotes(...args),
}));

vi.mock('@/lib/format', () => ({
  formatKRW: (val: number) => `${val.toLocaleString()}`,
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <CustomerDashboard />
    </MemoryRouter>,
  );
}

describe('CustomerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListQuotes.mockResolvedValue({
      quotes: [],
      pagination: { currentPage: 1, totalPages: 0, totalCount: 0, perPage: 5 },
    });
  });

  it('renders the page structure with header and footer', async () => {
    await act(async () => { renderDashboard(); });
    expect(screen.getByText('landing.footer')).toBeInTheDocument();
  });

  it('renders welcome banner with username derived from email', async () => {
    await act(async () => { renderDashboard(); });
    // "admin" appears in both welcome banner (username) and header (role badge)
    expect(screen.getAllByText('admin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('admin@jways.co.kr')).toBeInTheDocument();
  });

  it('renders New Quote button that navigates to /quote', async () => {
    const user = userEvent.setup();
    await act(async () => { renderDashboard(); });

    await user.click(screen.getByText('dashboard.newQuote'));
    expect(mockNavigate).toHaveBeenCalledWith('/quote');
  });

  it('renders recent quotes section header and View All link', async () => {
    await act(async () => { renderDashboard(); });
    expect(screen.getByText('dashboard.recentQuotes')).toBeInTheDocument();
    expect(screen.getByText('dashboard.viewAll')).toBeInTheDocument();
  });

  it('navigates to /quote when View All clicked', async () => {
    const user = userEvent.setup();
    await act(async () => { renderDashboard(); });

    await user.click(screen.getByText('dashboard.viewAll'));
    expect(mockNavigate).toHaveBeenCalledWith('/quote');
  });

  it('shows empty state when no quotes', async () => {
    await act(async () => { renderDashboard(); });
    await waitFor(() => {
      expect(screen.getByText('dashboard.noQuotes')).toBeInTheDocument();
    });
  });

  it('renders quote rows when quotes exist', async () => {
    mockListQuotes.mockResolvedValue({
      quotes: [
        { id: 1, referenceNo: 'SQ-2026-0001', destinationCountry: 'US', totalQuoteAmount: 1500000, status: 'draft' },
        { id: 2, referenceNo: 'SQ-2026-0002', destinationCountry: 'JP', totalQuoteAmount: 800000, status: 'sent' },
      ],
      pagination: { currentPage: 1, totalPages: 1, totalCount: 2, perPage: 5 },
    });

    await act(async () => { renderDashboard(); });
    await waitFor(() => {
      expect(screen.getByText('SQ-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('SQ-2026-0002')).toBeInTheDocument();
    });
    expect(screen.getByText('→ US')).toBeInTheDocument();
    expect(screen.getByText('→ JP')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('sent')).toBeInTheDocument();
  });

  it('renders all widget sections', async () => {
    await act(async () => { renderDashboard(); });
    expect(screen.getByText('widget.weather')).toBeInTheDocument();
    expect(screen.getByText('widget.exchange')).toBeInTheDocument();
    expect(screen.getByText('widget.calculator')).toBeInTheDocument();
  });

  it('renders exchange rate calculator with swap button', async () => {
    await act(async () => { renderDashboard(); });
    expect(screen.getByLabelText('Swap currencies')).toBeInTheDocument();
  });

  it('shows loading skeletons for quote history initially', async () => {
    // Make listQuotes hang
    mockListQuotes.mockReturnValue(new Promise(() => {}));
    const { container } = render(
      <MemoryRouter><CustomerDashboard /></MemoryRouter>,
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
