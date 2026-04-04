import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExchangeRateCalculatorWidget } from '../ExchangeRateCalculatorWidget';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (key: string) => key }),
}));

const mockUseExchangeRates = vi.fn();
vi.mock('@/features/dashboard/hooks/useExchangeRates', () => ({
  useExchangeRates: () => mockUseExchangeRates(),
}));

const rateData = [
  { currency: 'USD', code: 'USD', flag: '\u{1F1FA}\u{1F1F8}', rate: 1400 },
  { currency: 'EUR', code: 'EUR', flag: '\u{1F1EA}\u{1F1FA}', rate: 1500 },
  { currency: 'JPY', code: 'JPY', flag: '\u{1F1EF}\u{1F1F5}', rate: 9.3 },
];

describe('ExchangeRateCalculatorWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseExchangeRates.mockReturnValue({ data: rateData, loading: false });
  });

  it('renders widget title', () => {
    render(<ExchangeRateCalculatorWidget />);
    expect(screen.getByText('widget.calculator')).toBeInTheDocument();
  });

  it('renders amount input, from/to selects, and swap button', () => {
    render(<ExchangeRateCalculatorWidget />);
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText('common.from')).toBeInTheDocument();
    expect(screen.getByText('common.to')).toBeInTheDocument();
    expect(screen.getByLabelText('Swap currencies')).toBeInTheDocument();
  });

  it('displays conversion result for default 1 USD → KRW', () => {
    render(<ExchangeRateCalculatorWidget />);
    // 1 USD = 1400 KRW
    expect(screen.getByText('1,400 KRW')).toBeInTheDocument();
  });

  it('updates result when amount changes', async () => {
    const user = userEvent.setup();
    render(<ExchangeRateCalculatorWidget />);

    const input = screen.getByPlaceholderText('0.00');
    await user.clear(input);
    await user.type(input, '10');
    // 10 USD = 14,000 KRW
    expect(screen.getByText('14,000 KRW')).toBeInTheDocument();
  });

  it('swaps currencies when swap button clicked', async () => {
    const user = userEvent.setup();
    render(<ExchangeRateCalculatorWidget />);

    // Default: 1 USD → KRW shows 1,400
    expect(screen.getByText('1,400 KRW')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Swap currencies'));
    // After swap: result shows "X USD" (the bold result text)
    expect(screen.getByText(/0\.00 USD/)).toBeInTheDocument();
  });

  it('shows loading state when exchange rates loading', () => {
    mockUseExchangeRates.mockReturnValue({ data: [], loading: true });
    const { container } = render(<ExchangeRateCalculatorWidget />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows 0 result for empty amount', async () => {
    const user = userEvent.setup();
    render(<ExchangeRateCalculatorWidget />);
    const input = screen.getByPlaceholderText('0.00');
    await user.clear(input);
    // Empty amount → "0 KRW" or similar
    expect(screen.getByText(/0.*KRW/)).toBeInTheDocument();
  });
});
