import { render, screen, waitFor } from '@testing-library/react';
import { QuoteHistoryCompact } from '../QuoteHistoryCompact';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (key: string) => key }),
}));

vi.mock('@/lib/format', () => ({
  formatKRW: (val: number) => `${val.toLocaleString()}`,
}));

const mockListQuotes = vi.fn();
vi.mock('@/api/quoteApi', () => ({
  listQuotes: (...args: unknown[]) => mockListQuotes(...args),
}));

describe('QuoteHistoryCompact', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading skeletons initially', () => {
    mockListQuotes.mockReturnValue(new Promise(() => {}));
    const { container } = render(<QuoteHistoryCompact />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows empty state when no quotes returned', async () => {
    mockListQuotes.mockResolvedValue({
      quotes: [],
      pagination: { currentPage: 1, totalPages: 0, totalCount: 0, perPage: 5 },
    });

    render(<QuoteHistoryCompact />);
    await waitFor(() => {
      expect(screen.getByText('dashboard.noQuotes')).toBeInTheDocument();
    });
  });

  it('renders quote rows with ref, destination, status, and amount', async () => {
    mockListQuotes.mockResolvedValue({
      quotes: [
        { id: 1, referenceNo: 'SQ-2026-0001', destinationCountry: 'US', totalQuoteAmount: 1500000, status: 'draft' },
        { id: 2, referenceNo: 'SQ-2026-0002', destinationCountry: 'DE', totalQuoteAmount: 2000000, status: 'accepted' },
      ],
      pagination: { currentPage: 1, totalPages: 1, totalCount: 2, perPage: 5 },
    });

    render(<QuoteHistoryCompact />);
    await waitFor(() => {
      expect(screen.getByText('SQ-2026-0001')).toBeInTheDocument();
    });
    expect(screen.getByText('SQ-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('→ US')).toBeInTheDocument();
    expect(screen.getByText('→ DE')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('accepted')).toBeInTheDocument();
    expect(screen.getByText('1,500,000')).toBeInTheDocument();
    expect(screen.getByText('2,000,000')).toBeInTheDocument();
  });

  it('limits display to 5 quotes', async () => {
    const quotes = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      referenceNo: `SQ-2026-${String(i + 1).padStart(4, '0')}`,
      destinationCountry: 'US',
      totalQuoteAmount: 100000 * (i + 1),
      status: 'draft',
    }));
    mockListQuotes.mockResolvedValue({
      quotes,
      pagination: { currentPage: 1, totalPages: 1, totalCount: 7, perPage: 5 },
    });

    render(<QuoteHistoryCompact />);
    await waitFor(() => {
      expect(screen.getByText('SQ-2026-0001')).toBeInTheDocument();
    });
    expect(screen.getByText('SQ-2026-0005')).toBeInTheDocument();
    expect(screen.queryByText('SQ-2026-0006')).not.toBeInTheDocument();
  });

  it('calls listQuotes with page 1 and perPage 5', async () => {
    mockListQuotes.mockResolvedValue({
      quotes: [],
      pagination: { currentPage: 1, totalPages: 0, totalCount: 0, perPage: 5 },
    });

    render(<QuoteHistoryCompact />);
    await waitFor(() => {
      expect(mockListQuotes).toHaveBeenCalledWith({ page: 1, perPage: 5 });
    });
  });

  it('shows empty state on API error', async () => {
    mockListQuotes.mockRejectedValue(new Error('Network error'));
    render(<QuoteHistoryCompact />);
    await waitFor(() => {
      expect(screen.getByText('dashboard.noQuotes')).toBeInTheDocument();
    });
  });
});
