import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputSection } from '../InputSection';
import { QuoteInput, Incoterm, PackingType } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (key: string) => key }),
}));

vi.mock('@/features/dashboard/hooks/useExchangeRates', () => ({
  useExchangeRates: () => ({ data: [], loading: false, error: null, lastUpdated: null, isStale: false, retry: vi.fn() }),
}));

const mockInput: QuoteInput = {
  originCountry: 'KR',
  destinationCountry: 'US',
  destinationZip: '',
  shippingMode: 'Door-to-Door',
  incoterm: Incoterm.DAP,
  packingType: PackingType.NONE,
  items: [{ id: '1', width: 10, length: 10, height: 10, weight: 1, quantity: 1 }],
  marginPercent: 15,
  dutyTaxEstimate: 0,
  exchangeRate: 1400,
  fscPercent: 30,
  overseasCarrier: 'UPS',
};

const defaultProps = {
  input: mockInput,
  onChange: vi.fn(),
};

describe('InputSection', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders route section with origin country (South Korea)', () => {
    render(<InputSection {...defaultProps} />);

    expect(screen.getByText('calc.section.route')).toBeInTheDocument();
    expect(screen.getByText(/South Korea/)).toBeInTheDocument();
  });

  it('renders destination country select', () => {
    render(<InputSection {...defaultProps} />);

    expect(screen.getByText('calc.label.destination')).toBeInTheDocument();
    // The select should have US selected
    const selects = screen.getAllByRole('combobox');
    const destSelect = selects.find(
      (s) => (s as HTMLSelectElement).value === 'US',
    );
    expect(destSelect).toBeDefined();
  });

  it('renders cargo section with item inputs', () => {
    render(<InputSection {...defaultProps} />);

    expect(screen.getByText('calc.section.cargo')).toBeInTheDocument();
    expect(screen.getByText(/Box #1/)).toBeInTheDocument();
    expect(screen.getByText('Add Box')).toBeInTheDocument();
  });

  it('renders service section (collapsed by default)', () => {
    render(<InputSection {...defaultProps} />);

    expect(screen.getByText('calc.section.service')).toBeInTheDocument();
    // Service section is collapsed by default — inner content not visible
    expect(screen.queryByText('Special Packing')).not.toBeInTheDocument();
  });

  it('renders financial section', () => {
    render(<InputSection {...defaultProps} />);

    expect(screen.getByText('calc.section.financial')).toBeInTheDocument();
    expect(screen.getByText('Ex. Rate (KRW/USD)')).toBeInTheDocument();
    expect(screen.getByText('FSC %')).toBeInTheDocument();
  });

  it('calls onChange when destination country changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<InputSection {...defaultProps} onChange={onChange} />);

    // Reset zone filter to show all countries
    const selects = screen.getAllByRole('combobox');
    const zoneSelectEl = selects.find(
      (s) => Array.from((s as HTMLSelectElement).options).some(o => o.value === '' && o.text.includes('calc.label.zoneAll'))
    ) as HTMLSelectElement;
    if (zoneSelectEl) {
      await user.selectOptions(zoneSelectEl, '');
    }

    // Find the destination country select (has value 'US')
    const destSelect = screen.getAllByRole('combobox').find(
      (s) => (s as HTMLSelectElement).value === 'US',
    ) as HTMLSelectElement;

    await user.selectOptions(destSelect, 'CA');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ destinationCountry: 'CA' }),
    );
  });

  it('does not render Target Margin input when hideMargin=true', () => {
    render(<InputSection {...defaultProps} hideMargin={true} />);

    expect(screen.queryByText('Target Margin (%)')).not.toBeInTheDocument();
  });
});
