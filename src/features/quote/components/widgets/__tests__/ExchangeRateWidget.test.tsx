import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExchangeRateWidget } from '../ExchangeRateWidget';
import type { ExchangeRate } from '@/types/dashboard';

function makeRate(currency: string, overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    currency,
    code: 'TST',
    flag: '🏳️',
    rate: 1385.5,
    previousClose: 1380.0,
    change: 5.5,
    changePercent: 0.4,
    trend: 'up',
    ...overrides,
  };
}

const mockUseExchangeRates = vi.fn();
const mockUseFscRates = vi.fn();

vi.mock('@/features/dashboard/hooks/useExchangeRates', () => ({
  useExchangeRates: () => mockUseExchangeRates(),
}));

vi.mock('@/features/dashboard/hooks/useFscRates', () => ({
  useFscRates: () => mockUseFscRates(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

function mockHook(overrides: Record<string, unknown> = {}) {
  return {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null,
    isStale: false,
    retry: vi.fn(),
    ...overrides,
  };
}

function mockFscHook(overrides: Record<string, unknown> = {}) {
  return {
    data: null,
    loading: false,
    error: null,
    retry: vi.fn(),
    ...overrides,
  };
}

describe('ExchangeRateWidget', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders loading skeleton when loading', () => {
    mockUseExchangeRates.mockReturnValue(mockHook({ loading: true }));
    mockUseFscRates.mockReturnValue(mockFscHook({ loading: true }));
    render(<ExchangeRateWidget />);
    expect(screen.getByText('widget.exchange')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders exchange rate data with currency flags', async () => {
    const data = [
      makeRate('USD', { flag: '🇺🇸', rate: 1385.5, change: 5.5, trend: 'up' }),
      makeRate('EUR', { flag: '🇪🇺', rate: 1512.3, change: -3.2, trend: 'down' }),
    ];
    mockUseExchangeRates.mockReturnValue(mockHook({ data, lastUpdated: new Date() }));
    mockUseFscRates.mockReturnValue(mockFscHook());
    render(<ExchangeRateWidget />);

    await waitFor(() => {
      expect(screen.getByText('USD')).toBeInTheDocument();
      expect(screen.getByText('EUR')).toBeInTheDocument();
      expect(screen.getByText('1,385.50')).toBeInTheDocument();
      expect(screen.getByText('1,512.30')).toBeInTheDocument();
    });
  });

  it('shows trend up with + prefix and red color', async () => {
    const data = [makeRate('USD', { change: 12.5, trend: 'up' })];
    mockUseExchangeRates.mockReturnValue(mockHook({ data, lastUpdated: new Date() }));
    const { container } = render(<ExchangeRateWidget />);

    await waitFor(() => {
      expect(screen.getByText('+12.5')).toBeInTheDocument();
    });
    // Red badge for up trend (KRW perspective: higher = red)
    const badge = container.querySelector('.text-red-600');
    expect(badge).toBeInTheDocument();
  });

  it('shows trend down with blue color', async () => {
    const data = [makeRate('JPY', { change: -3.1, trend: 'down' })];
    mockUseExchangeRates.mockReturnValue(mockHook({ data, lastUpdated: new Date() }));
    const { container } = render(<ExchangeRateWidget />);

    await waitFor(() => {
      expect(screen.getByText('-3.1')).toBeInTheDocument();
    });
    const badge = container.querySelector('.text-blue-600');
    expect(badge).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseExchangeRates.mockReturnValue(mockHook({ error: 'API failed' }));
    render(<ExchangeRateWidget />);

    expect(screen.getByText('API failed')).toBeInTheDocument();
  });

  it('calls retry on refresh button click', async () => {
    const retryFn = vi.fn();
    mockUseExchangeRates.mockReturnValue(mockHook({ data: [makeRate('USD')], lastUpdated: new Date(), retry: retryFn }));
    const user = userEvent.setup();
    render(<ExchangeRateWidget />);

    await user.click(screen.getByLabelText('widget.exchange.refresh'));
    expect(retryFn).toHaveBeenCalledOnce();
  });

  it('shows column headers', () => {
    const data = [makeRate('USD')];
    mockUseExchangeRates.mockReturnValue(mockHook({ data, lastUpdated: new Date() }));
    render(<ExchangeRateWidget />);

    expect(screen.getByText('widget.exchange.currency')).toBeInTheDocument();
    expect(screen.getByText('widget.exchange.rate')).toBeInTheDocument();
    expect(screen.getByText('widget.exchange.change')).toBeInTheDocument();
  });

  it('shows last updated time in footer', () => {
    const now = new Date();
    const data = [makeRate('USD')];
    mockUseExchangeRates.mockReturnValue(mockHook({ data, lastUpdated: now }));
    render(<ExchangeRateWidget />);

    // Footer text
    expect(screen.getByText(/widget\.exchange\.desc/)).toBeInTheDocument();
  });

  it('shows live indicator (green) when data is fresh', () => {
    const data = [makeRate('USD')];
    mockUseExchangeRates.mockReturnValue(mockHook({ data, lastUpdated: new Date(), isStale: false }));
    const { container } = render(<ExchangeRateWidget />);

    const liveIndicator = container.querySelector('.bg-emerald-500');
    expect(liveIndicator).toBeInTheDocument();
  });

  it('shows stale indicator (gray) when data is stale', () => {
    const data = [makeRate('USD')];
    mockUseExchangeRates.mockReturnValue(mockHook({ data, lastUpdated: new Date(), isStale: true }));
    mockUseFscRates.mockReturnValue(mockFscHook());
    const { container } = render(<ExchangeRateWidget />);

    const staleIndicator = container.querySelector('.bg-gray-300');
    expect(staleIndicator).toBeInTheDocument();
  });

  it('renders FSC rates for UPS and DHL', async () => {
    const exchangeData = [makeRate('USD')];
    const fscData = {
      rates: {
        UPS: { international: 33.25, domestic: 12.0 },
        DHL: { international: 30.5, domestic: 10.0 },
      },
    };
    mockUseExchangeRates.mockReturnValue(mockHook({ data: exchangeData, lastUpdated: new Date() }));
    mockUseFscRates.mockReturnValue(mockFscHook({ data: fscData }));
    
    render(<ExchangeRateWidget />);

    expect(screen.getByText('widget.fsc.title')).toBeInTheDocument();
    expect(screen.getByText('33.25%')).toBeInTheDocument();
    expect(screen.getByText('30.5%')).toBeInTheDocument();
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('contains links to official FSC pages', () => {
    mockUseExchangeRates.mockReturnValue(mockHook({ data: [makeRate('USD')], lastUpdated: new Date() }));
    mockUseFscRates.mockReturnValue(mockFscHook());
    
    render(<ExchangeRateWidget />);

    const upsLink = screen.getByRole('link', { name: /UPS/i });
    const dhlLink = screen.getByRole('link', { name: /DHL/i });

    expect(upsLink).toHaveAttribute('href', expect.stringContaining('ups.com'));
    expect(dhlLink).toHaveAttribute('href', expect.stringContaining('express.dhl'));
  });
});
