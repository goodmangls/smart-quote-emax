import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const mockUseJetFuelPrices = vi.fn();

vi.mock('@/features/dashboard/hooks/useJetFuelPrices', () => ({
  useJetFuelPrices: () => mockUseJetFuelPrices(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

import { JetFuelWidget } from '../JetFuelWidget';

describe('JetFuelWidget', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockUseJetFuelPrices.mockReset();
  });

  it('renders loading skeleton when loading with no data', () => {
    mockUseJetFuelPrices.mockReturnValue({
      data: [],
      loading: true,
      error: null,
      retry: vi.fn(),
    });

    render(<JetFuelWidget />);

    // Header should always render
    expect(screen.getByText('dashboard.jetFuel.title')).toBeInTheDocument();
    // WidgetSkeleton renders animated placeholder divs
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it('renders error state when error and no data', () => {
    mockUseJetFuelPrices.mockReturnValue({
      data: [],
      loading: false,
      error: 'API unavailable',
      retry: vi.fn(),
    });

    render(<JetFuelWidget />);

    expect(screen.getByText('API unavailable')).toBeInTheDocument();
  });

  it('renders price data with chart', () => {
    mockUseJetFuelPrices.mockReturnValue({
      data: [
        { date: '2026-03-07', price: 2.1 },
        { date: '2026-03-14', price: 2.15 },
      ],
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<JetFuelWidget />);

    // Current price should be displayed
    expect(screen.getByText('$2.150')).toBeInTheDocument();
    // Week change label
    expect(screen.getByText('dashboard.jetFuel.weekChange')).toBeInTheDocument();
    // Source link
    expect(screen.getByText('dashboard.jetFuel.source')).toBeInTheDocument();
  });

  it('renders week change with trend indicator', () => {
    mockUseJetFuelPrices.mockReturnValue({
      data: [
        { date: '2026-03-07', price: 2.1 },
        { date: '2026-03-14', price: 2.15 },
      ],
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<JetFuelWidget />);

    // Change is +0.050
    expect(screen.getByText('+0.050')).toBeInTheDocument();
  });

  it('renders FSC correlation note', () => {
    mockUseJetFuelPrices.mockReturnValue({
      data: [{ date: '2026-03-14', price: 2.15 }],
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<JetFuelWidget />);

    expect(screen.getByText('dashboard.jetFuel.fscNote')).toBeInTheDocument();
  });
});
