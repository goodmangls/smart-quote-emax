import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteHistoryTable } from '../QuoteHistoryTable';
import { QuoteSummary } from '@/types';

const mockQuote: QuoteSummary = {
  id: 1,
  referenceNo: 'SQ-2026-0001',
  destinationCountry: 'US',
  totalQuoteAmount: 1500000,
  totalQuoteAmountUSD: 1150.5,
  discountPercent: 20.0,
  billableWeight: 15.5,
  status: 'draft',
  validityDate: '2026-02-21',
  createdAt: '2026-02-14T00:00:00Z',
};

const defaultProps = {
  quotes: [mockQuote],
  isLoading: false,
  hasActiveFilters: false,
  onView: vi.fn(),
  onDelete: vi.fn(),
};

describe('QuoteHistoryTable', () => {
  it('renders table headers', () => {
    render(<QuoteHistoryTable {...defaultProps} />);

    expect(screen.getByText('Ref No')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Dest')).toBeInTheDocument();
    expect(screen.getByText('Amount (KRW)')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('Discount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders quote rows with formatted data', () => {
    render(<QuoteHistoryTable {...defaultProps} />);

    // Both mobile card and desktop table render — use getAllByText
    expect(screen.getAllByText('SQ-2026-0001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('US').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1,500,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$1,150.50').length).toBeGreaterThan(0);
    expect(screen.getAllByText('20.0%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('draft').length).toBeGreaterThan(0);
  });

  it('shows loading skeletons when isLoading is true', () => {
    const { container } = render(<QuoteHistoryTable {...defaultProps} quotes={[]} isLoading={true} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty message when no quotes and no filters', () => {
    render(
      <QuoteHistoryTable
        {...defaultProps}
        quotes={[]}
        hasActiveFilters={false}
      />,
    );

    // Rendered in both mobile and desktop views
    expect(
      screen.getAllByText('No quotes saved yet. Calculate a quote and save it!').length,
    ).toBeGreaterThan(0);
  });

  it('shows filter message when no quotes and hasActiveFilters', () => {
    render(
      <QuoteHistoryTable
        {...defaultProps}
        quotes={[]}
        hasActiveFilters={true}
      />,
    );

    expect(
      screen.getAllByText('No quotes match your filters.').length,
    ).toBeGreaterThan(0);
  });

  it('calls onView with correct id when view button clicked', async () => {
    const onView = vi.fn();
    render(<QuoteHistoryTable {...defaultProps} onView={onView} />);

    const viewButtons = screen.getAllByLabelText('View detail');
    await userEvent.click(viewButtons[0]);

    expect(onView).toHaveBeenCalledWith(1);
  });

  it('calls onDelete with correct id and refNo when delete button clicked', async () => {
    const onDelete = vi.fn();
    render(<QuoteHistoryTable {...defaultProps} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByLabelText('Delete');
    await userEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(1, 'SQ-2026-0001');
  });
});
