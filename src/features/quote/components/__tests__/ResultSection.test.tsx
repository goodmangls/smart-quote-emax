import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultSection } from '../ResultSection';
import { QuoteInput, QuoteResult, Incoterm, PackingType } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'ko',
    setLanguage: vi.fn(),
    t: (key: string) =>
      ({
        'quote.carrierComparison': '운송사 견적 비교',
        'quote.lowest': '최저가',
        'quote.selected': '선택됨',
        'quote.switch': '변경',
        'quote.totalQuote': '총 견적',
        'quote.zone': '배송 구역',
        'quote.transit': '배송 소요',
        'quote.actualWeight': '실중량',
        'quote.billableWeight': '과금 중량',
        'quote.discount': '할인',
        'quote.toggleCurrency': '통화 전환',
      })[key] ?? key,
  }),
}));

vi.mock('@/features/dashboard/hooks/useExchangeRates', () => ({
  useExchangeRates: () => ({
    data: [],
    loading: false,
    error: null,
    lastUpdated: null,
    isStale: false,
    retry: vi.fn(),
  }),
}));

vi.mock('@/features/dashboard/hooks/usePortWeather', () => ({
  usePortWeather: () => ({ data: [], loading: false, error: null }),
}));

const mockCalculateQuote = vi.fn<() => QuoteResult | null>(() => null);
vi.mock('@/features/quote/services/calculationService', () => ({
  calculateQuote: () => mockCalculateQuote(),
}));

vi.mock('@/lib/pdfService', () => ({
  generateComparisonPDF: vi.fn(),
}));

const mockResult: QuoteResult = {
  totalQuoteAmount: 1500000,
  totalQuoteAmountUSD: 1071.43,
  totalCostAmount: 1200000,
  discountAmount: 300000,
  discountPercent: 20.0,
  currency: 'KRW',
  fscPercent: 30,
  billableWeight: 15.5,
  totalActualWeight: 10.0,
  totalVolumetricWeight: 12.0,
  appliedZone: 'Z5',
  carrier: 'UPS',
  transitTime: '3-5 days',
  warnings: [],
  breakdown: {
    packingMaterial: 5000,
    packingLabor: 3000,
    packingFumigation: 0,
    handlingFees: 10000,
    pickupInSeoul: 0,
    intlBase: 80000,
    intlFsc: 24000,
    intlWarRisk: 0,
    intlSurge: 0,
    destDuty: 0,
    totalCost: 122000,
  },
};

const mockInput: QuoteInput = {
  originCountry: 'KR',
  destinationCountry: 'US',
  destinationZip: '10001',
  incoterm: Incoterm.DAP,
  packingType: PackingType.NONE,
  items: [{ id: '1', width: 10, length: 10, height: 10, weight: 1, quantity: 1 }],
  discountPercent: 15,
  dutyTaxEstimate: 0,
  exchangeRate: 1400,
  fscPercent: 30,
  overseasCarrier: 'UPS',
};

const defaultProps = {
  result: mockResult,
  onDiscountChange: vi.fn(),
  onDownloadPdf: vi.fn(),
  discountPercent: 15,
};

describe('ResultSection', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders quote summary card with amount', () => {
    render(<ResultSection {...defaultProps} />);

    // QuoteSummaryCard shows the formatted total amount
    expect(screen.getByText('calc.totalEstimate')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('renders key metrics (실중량, 과금 중량, 할인)', () => {
    render(<ResultSection {...defaultProps} />);

    expect(screen.getByText('실중량')).toBeInTheDocument();
    expect(screen.getByText('과금 중량')).toBeInTheDocument();
    expect(screen.getAllByText('할인').length).toBeGreaterThan(0);
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('hides margin metric when hideMargin=true', () => {
    render(<ResultSection {...defaultProps} hideMargin={true} />);

    expect(screen.getByText('실중량')).toBeInTheDocument();
    expect(screen.getByText('과금 중량')).toBeInTheDocument();
    expect(screen.queryByText('할인')).not.toBeInTheDocument();
  });

  it('renders warning alerts when warnings present', () => {
    const resultWithWarnings = {
      ...mockResult,
      warnings: ['Low margin detected', 'Heavy package surcharge'],
    };
    render(<ResultSection {...defaultProps} result={resultWithWarnings} />);

    expect(screen.getByText('Attention Needed')).toBeInTheDocument();
    expect(screen.getByText('Low margin detected')).toBeInTheDocument();
    expect(screen.getByText('Heavy package surcharge')).toBeInTheDocument();
  });

  it('does not render warnings when empty', () => {
    render(<ResultSection {...defaultProps} />);

    expect(screen.queryByText('Attention Needed')).not.toBeInTheDocument();
  });

  it('calls onDownloadPdf when PDF button clicked', async () => {
    const onDownloadPdf = vi.fn();
    const user = userEvent.setup();
    render(<ResultSection {...defaultProps} onDownloadPdf={onDownloadPdf} />);

    await user.click(screen.getByText('PDF'));
    expect(onDownloadPdf).toHaveBeenCalledOnce();
  });

  it('renders carrier comparison when input and onSwitchCarrier provided', () => {
    mockCalculateQuote.mockReturnValue({
      ...mockResult,
      carrier: 'DHL',
      totalQuoteAmount: 1600000,
      totalQuoteAmountUSD: 1142.86,
    });

    render(<ResultSection {...defaultProps} input={mockInput} onSwitchCarrier={vi.fn()} />);

    expect(screen.getByText('운송사 견적 비교')).toBeInTheDocument();
  });

  it('renders carrier comparison even when hideMargin is true', () => {
    mockCalculateQuote.mockReturnValue({
      ...mockResult,
      carrier: 'DHL',
      totalQuoteAmount: 1600000,
      totalQuoteAmountUSD: 1142.86,
    });

    render(
      <ResultSection
        {...defaultProps}
        input={mockInput}
        onSwitchCarrier={vi.fn()}
        hideMargin={true}
      />,
    );

    expect(screen.getByText('운송사 견적 비교')).toBeInTheDocument();
  });
});
