import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoticeWidget } from '../NoticeWidget';

const mockNews = [
  { title: 'US West Coast congestion easing', link: 'https://example.com/1', pubDate: '2026-02-26T08:00:00Z', source: 'FreightWaves' },
  { title: 'Fuel surcharge update Q1', link: 'https://example.com/2', pubDate: '2026-02-25T10:00:00Z', source: 'The Loadstar' },
  { title: 'New shipping lane opens', link: 'https://example.com/3', pubDate: '2026-02-24T12:00:00Z', source: 'gCaptain' },
];

const mockManyNews = Array.from({ length: 8 }, (_, i) => ({
  title: `News item ${i + 1}`,
  link: `https://example.com/${i + 1}`,
  pubDate: new Date(2026, 1, 26 - i).toISOString(),
  source: `Source ${i + 1}`,
}));

const mockUseLogisticsNews = vi.fn();

vi.mock('@/features/dashboard/hooks/useLogisticsNews', () => ({
  useLogisticsNews: () => mockUseLogisticsNews(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

describe('NoticeWidget', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders loading skeleton initially', () => {
    mockUseLogisticsNews.mockReturnValue({ data: [], loading: true, error: null, retry: vi.fn() });
    render(<NoticeWidget />);
    expect(screen.getByText('widget.notice')).toBeInTheDocument();
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders news items with title, date, and source', async () => {
    mockUseLogisticsNews.mockReturnValue({ data: mockNews, loading: false, error: null, retry: vi.fn() });
    render(<NoticeWidget />);

    await waitFor(() => {
      expect(screen.getByText('US West Coast congestion easing')).toBeInTheDocument();
      expect(screen.getByText('Fuel surcharge update Q1')).toBeInTheDocument();
      expect(screen.getByText('New shipping lane opens')).toBeInTheDocument();
    });

    // Source names appear
    expect(screen.getByText(/FreightWaves/)).toBeInTheDocument();
    expect(screen.getByText(/The Loadstar/)).toBeInTheDocument();
  });

  it('renders error state on API failure', () => {
    mockUseLogisticsNews.mockReturnValue({ data: [], loading: false, error: 'Failed to load', retry: vi.fn() });
    render(<NoticeWidget />);

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.getByText('widget.common.retry')).toBeInTheDocument();
  });

  it('shows pagination controls when items exceed page size', () => {
    mockUseLogisticsNews.mockReturnValue({ data: mockManyNews, loading: false, error: null, retry: vi.fn() });
    render(<NoticeWidget />);

    // Page indicator: "1 / 2"
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    // Prev/Next buttons
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    // First 5 items visible, 6th not
    expect(screen.getByText('News item 1')).toBeInTheDocument();
    expect(screen.getByText('News item 5')).toBeInTheDocument();
    expect(screen.queryByText('News item 6')).not.toBeInTheDocument();
  });

  it('hides pagination when items fit in one page', () => {
    mockUseLogisticsNews.mockReturnValue({ data: mockNews, loading: false, error: null, retry: vi.fn() });
    render(<NoticeWidget />);

    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
  });

  it('auto-rotates pages after 6 seconds', () => {
    vi.useFakeTimers();
    mockUseLogisticsNews.mockReturnValue({ data: mockManyNews, loading: false, error: null, retry: vi.fn() });
    render(<NoticeWidget />);

    // Page 1 initially
    expect(screen.getByText('News item 1')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    // Advance timer to trigger auto-rotate (6000ms)
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Now on page 2
    expect(screen.getByText('News item 6')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.queryByText('News item 1')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('navigates to next page via button click', async () => {
    const user = userEvent.setup();
    mockUseLogisticsNews.mockReturnValue({ data: mockManyNews, loading: false, error: null, retry: vi.fn() });
    render(<NoticeWidget />);

    expect(screen.getByText('News item 1')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Next page'));

    await waitFor(() => {
      expect(screen.getByText('News item 6')).toBeInTheDocument();
    });
    expect(screen.queryByText('News item 1')).not.toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('navigates to previous page via button click', async () => {
    const user = userEvent.setup();
    mockUseLogisticsNews.mockReturnValue({ data: mockManyNews, loading: false, error: null, retry: vi.fn() });
    render(<NoticeWidget />);

    // Go to page 2 first
    await user.click(screen.getByLabelText('Next page'));
    await waitFor(() => {
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    // Go back to page 1
    await user.click(screen.getByLabelText('Previous page'));
    await waitFor(() => {
      expect(screen.getByText('News item 1')).toBeInTheDocument();
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });
  });

  it('navigates via dot button click', async () => {
    const user = userEvent.setup();
    mockUseLogisticsNews.mockReturnValue({ data: mockManyNews, loading: false, error: null, retry: vi.fn() });
    render(<NoticeWidget />);

    // Click dot for page 2
    await user.click(screen.getByLabelText('Page 2'));

    await waitFor(() => {
      expect(screen.getByText('News item 6')).toBeInTheDocument();
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    // Click dot for page 1
    await user.click(screen.getByLabelText('Page 1'));

    await waitFor(() => {
      expect(screen.getByText('News item 1')).toBeInTheDocument();
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });
  });
});
