import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeatherWidget } from '../WeatherWidget';
import type { PortWeather } from '@/types/dashboard';

function makePort(name: string, code: string, country: string, overrides: Partial<PortWeather> = {}): PortWeather {
  return {
    port: `${name} (${country})`,
    code,
    latitude: 35.18,
    longitude: 129.08,
    temperature: 10,
    weatherCode: 3,
    windSpeed: 12,
    condition: 'Cloudy',
    status: 'Normal',
    type: 'port',
    ...overrides,
  };
}

const mockData6: PortWeather[] = [
  makePort('Incheon', 'KR-ICN', 'KR', { temperature: 2 }),
  makePort('Busan', 'KR-PUS', 'KR', { temperature: 4 }),
  makePort('Shanghai', 'CN-SHA', 'CN', { temperature: 8 }),
  makePort('Tokyo', 'JP-TYO', 'JP', { temperature: 6 }),
  makePort('Ho Chi Minh', 'VN-SGN', 'VN', { temperature: 30 }),
  makePort('Singapore', 'SG-SIN', 'SG', { temperature: 28, condition: 'Clear', status: 'Normal' }),
];

const mockData12: PortWeather[] = [
  ...mockData6,
  makePort('Hong Kong', 'HK-HKG', 'HK', { temperature: 18 }),
  makePort('Kaohsiung', 'TW-KHH', 'TW', { temperature: 20 }),
  makePort('Los Angeles', 'US-LAX', 'US', { temperature: 18, condition: 'Clear' }),
  makePort('Hamburg', 'DE-HAM', 'DE', { temperature: 1, condition: 'Snow', status: 'Delay' }),
  makePort('Rotterdam', 'NL-RTM', 'NL', { temperature: 2, condition: 'Rain', status: 'Delay' }),
  makePort('Jebel Ali', 'AE-JEA', 'AE', { temperature: 32, condition: 'Clear' }),
];

const mockUsePortWeather = vi.fn();

vi.mock('@/features/dashboard/hooks/usePortWeather', () => ({
  usePortWeather: () => mockUsePortWeather(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

describe('WeatherWidget', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders loading skeleton initially', () => {
    mockUsePortWeather.mockReturnValue({ data: [], loading: true, error: null, retry: vi.fn() });
    render(<WeatherWidget />);
    expect(screen.getByText('widget.weather')).toBeInTheDocument();
    const container = document.querySelector('.animate-pulse');
    expect(container).toBeInTheDocument();
  });

  it('renders 6 port cards without pagination when <=6 ports', async () => {
    mockUsePortWeather.mockReturnValue({ data: mockData6, loading: false, error: null, retry: vi.fn() });
    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByText('Incheon (KR)')).toBeInTheDocument();
      expect(screen.getByText('Busan (KR)')).toBeInTheDocument();
      expect(screen.getByText('Singapore (SG)')).toBeInTheDocument();
    });

    // No pagination controls when <=6
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
  });

  it('shows pagination controls when >6 ports', async () => {
    mockUsePortWeather.mockReturnValue({ data: mockData12, loading: false, error: null, retry: vi.fn() });
    render(<WeatherWidget />);

    await waitFor(() => {
      // Page 1 shows first 6 ports
      expect(screen.getByText('Incheon (KR)')).toBeInTheDocument();
      expect(screen.getByText('Singapore (SG)')).toBeInTheDocument();
    });

    // Page 2 ports should NOT be visible on first page
    expect(screen.queryByText('Hong Kong (HK)')).not.toBeInTheDocument();

    // Pagination controls visible
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    // Dot indicators: 2 pages
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument();
  });

  it('navigates to next page via button click', async () => {
    const user = userEvent.setup();
    mockUsePortWeather.mockReturnValue({ data: mockData12, loading: false, error: null, retry: vi.fn() });
    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByText('Incheon (KR)')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Next page'));

    await waitFor(() => {
      expect(screen.getByText('Hong Kong (HK)')).toBeInTheDocument();
      expect(screen.getByText('Jebel Ali (AE)')).toBeInTheDocument();
    });
    expect(screen.queryByText('Incheon (KR)')).not.toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('auto-rotates pages', () => {
    vi.useFakeTimers();
    mockUsePortWeather.mockReturnValue({ data: mockData12, loading: false, error: null, retry: vi.fn() });
    render(<WeatherWidget />);

    // Page 1 initially
    expect(screen.getByText('Incheon (KR)')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    // Advance timer to trigger auto-rotate
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Now on page 2
    expect(screen.getByText('Hong Kong (HK)')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders error state on API failure', () => {
    mockUsePortWeather.mockReturnValue({ data: [], loading: false, error: 'Network error', retry: vi.fn() });
    render(<WeatherWidget />);

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('widget.common.retry')).toBeInTheDocument();
  });

  it('respects language context for labels', () => {
    mockUsePortWeather.mockReturnValue({ data: mockData6, loading: false, error: null, retry: vi.fn() });
    render(<WeatherWidget />);

    expect(screen.getByText('widget.weather')).toBeInTheDocument();
    expect(screen.getByText(/widget\.weather\.desc/)).toBeInTheDocument();
  });

  it('renders Ship icon for ports and Plane icon for airports', () => {
    const mixedData: PortWeather[] = [
      makePort('Busan', 'KR-PUS', 'KR', { type: 'port' }),
      makePort('Incheon (ICN)', 'KR-ICN-AIR', 'KR', { type: 'airport' }),
    ];
    mockUsePortWeather.mockReturnValue({ data: mixedData, loading: false, error: null, retry: vi.fn() });
    const { container } = render(<WeatherWidget />);

    // Ship icon for port (lucide Ship has a specific SVG structure)
    const shipIcons = container.querySelectorAll('.text-blue-500.w-5.h-5');
    expect(shipIcons.length).toBeGreaterThanOrEqual(1);

    // Plane icon for airport
    const planeIcons = container.querySelectorAll('.text-sky-500.w-5.h-5');
    expect(planeIcons.length).toBeGreaterThanOrEqual(1);
  });
});
