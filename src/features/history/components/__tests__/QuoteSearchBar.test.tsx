import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteSearchBar } from '../QuoteSearchBar';

const defaultProps = {
  searchInput: '',
  onSearchInputChange: vi.fn(),
  onSearch: vi.fn(),
  activeStatus: undefined as undefined,
  onStatusFilter: vi.fn(),
  showFilters: false,
  onToggleFilters: vi.fn(),
  hasActiveFilters: false,
  onClearFilters: vi.fn(),
};

describe('QuoteSearchBar', () => {
  it('renders search input with placeholder', () => {
    render(<QuoteSearchBar {...defaultProps} />);

    expect(
      screen.getByPlaceholderText('Search by reference no or destination...'),
    ).toBeInTheDocument();
  });

  it('calls onSearchInputChange when typing', () => {
    const onSearchInputChange = vi.fn();
    render(
      <QuoteSearchBar
        {...defaultProps}
        onSearchInputChange={onSearchInputChange}
      />,
    );

    const input = screen.getByPlaceholderText(
      'Search by reference no or destination...',
    );
    fireEvent.change(input, { target: { value: 'a' } });

    expect(onSearchInputChange).toHaveBeenCalledWith('a');
  });

  it('calls onSearch on form submit', async () => {
    const onSearch = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<QuoteSearchBar {...defaultProps} onSearch={onSearch} />);

    const searchButton = screen.getByRole('button', { name: 'Search' });
    await userEvent.click(searchButton);

    expect(onSearch).toHaveBeenCalled();
  });

  it('shows status filter buttons when showFilters is true', () => {
    render(<QuoteSearchBar {...defaultProps} showFilters={true} />);

    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('sent')).toBeInTheDocument();
    expect(screen.getByText('accepted')).toBeInTheDocument();
    expect(screen.getByText('rejected')).toBeInTheDocument();
  });

  it('calls onStatusFilter when status button clicked', async () => {
    const onStatusFilter = vi.fn();
    render(
      <QuoteSearchBar
        {...defaultProps}
        showFilters={true}
        onStatusFilter={onStatusFilter}
      />,
    );

    await userEvent.click(screen.getByText('draft'));

    expect(onStatusFilter).toHaveBeenCalledWith('draft');
  });

  it('shows Clear all button when hasActiveFilters is true', () => {
    render(
      <QuoteSearchBar
        {...defaultProps}
        showFilters={true}
        hasActiveFilters={true}
      />,
    );

    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('calls onClearFilters when Clear all clicked', async () => {
    const onClearFilters = vi.fn();
    render(
      <QuoteSearchBar
        {...defaultProps}
        showFilters={true}
        hasActiveFilters={true}
        onClearFilters={onClearFilters}
      />,
    );

    await userEvent.click(screen.getByText('Clear all'));

    expect(onClearFilters).toHaveBeenCalled();
  });
});
