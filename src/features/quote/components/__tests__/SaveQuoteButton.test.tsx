import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveQuoteButton } from '../SaveQuoteButton';
import { QuoteInput, QuoteResult, Incoterm, PackingType } from '@/types';

vi.mock('@/api/quoteApi', () => ({
  saveQuote: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'test@company.com',
      role: 'member',
      company: 'Test Corp',
      name: 'Test User',
    },
    isAuthenticated: true,
  }),
}));

import { saveQuote } from '@/api/quoteApi';

const mockInput: QuoteInput = {
  originCountry: 'KR',
  destinationCountry: 'US',
  destinationZip: '10001',
  incoterm: Incoterm.FOB,
  packingType: PackingType.NONE,
  items: [{ id: '1', width: 10, length: 10, height: 10, weight: 1, quantity: 1 }],
  discountPercent: 15,
  dutyTaxEstimate: 0,
  exchangeRate: 1300,
  fscPercent: 27.5,
};

const mockResult: QuoteResult = {
  totalQuoteAmount: 185000,
  totalQuoteAmountUSD: 142.31,
  totalCostAmount: 135000,
  discountAmount: 50000,
  discountPercent: 27.0,
  currency: 'KRW',
  fscPercent: 27.5,
  totalActualWeight: 1,
  totalVolumetricWeight: 0.2,
  billableWeight: 1,
  appliedZone: '8',
  transitTime: '3-5 days',
  carrier: 'UPS',
  warnings: [],
  breakdown: {
    packingMaterial: 0,
    packingLabor: 0,
    packingFumigation: 0,
    handlingFees: 0,
    pickupInSeoul: 0,
    intlBase: 50000,
    intlFsc: 5000,
    intlWarRisk: 2500,
    intlSurge: 0,
    destDuty: 0,
    totalCost: 57500,
  },
};

describe('SaveQuoteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows Save Quote button initially', () => {
    render(<SaveQuoteButton input={mockInput} result={mockResult} />);

    expect(screen.getByText('Save Quote')).toBeInTheDocument();
  });

  it('disables Save button when result is null', () => {
    render(<SaveQuoteButton input={mockInput} result={null} />);

    const button = screen.getByText('Save Quote').closest('button')!;
    expect(button).toBeDisabled();
  });

  it('disables Save button when items are empty', () => {
    const emptyInput = { ...mockInput, items: [] };
    render(<SaveQuoteButton input={emptyInput} result={mockResult} />);

    const button = screen.getByText('Save Quote').closest('button')!;
    expect(button).toBeDisabled();
  });

  it('shows notes input after clicking Save Quote', async () => {
    vi.useRealTimers();
    render(<SaveQuoteButton input={mockInput} result={mockResult} />);

    await userEvent.click(screen.getByText('Save Quote'));

    expect(screen.getByPlaceholderText('Add notes (optional)')).toBeInTheDocument();
  });

  it('calls saveQuote API on confirm', async () => {
    vi.useRealTimers();
    vi.mocked(saveQuote).mockResolvedValue({ referenceNo: 'SQ-2026-0001' } as ReturnType<
      typeof saveQuote
    > extends Promise<infer T>
      ? T
      : never);

    render(<SaveQuoteButton input={mockInput} result={mockResult} />);

    await userEvent.click(screen.getByText('Save Quote'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(saveQuote).toHaveBeenCalledWith(mockInput, undefined);
  });

  it('shows Saved! with reference number after successful save', async () => {
    vi.useRealTimers();
    vi.mocked(saveQuote).mockResolvedValue({ referenceNo: 'SQ-2026-0042' } as ReturnType<
      typeof saveQuote
    > extends Promise<infer T>
      ? T
      : never);

    render(<SaveQuoteButton input={mockInput} result={mockResult} />);

    await userEvent.click(screen.getByText('Save Quote'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/Saved!/)).toBeInTheDocument();
      expect(screen.getByText(/SQ-2026-0042/)).toBeInTheDocument();
    });
  });

  it('shows View button after save when onSaved is provided', async () => {
    vi.useRealTimers();
    const onSaved = vi.fn();
    vi.mocked(saveQuote).mockResolvedValue({ referenceNo: 'SQ-2026-0042' } as ReturnType<
      typeof saveQuote
    > extends Promise<infer T>
      ? T
      : never);

    render(<SaveQuoteButton input={mockInput} result={mockResult} onSaved={onSaved} />);

    await userEvent.click(screen.getByText('Save Quote'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('View'));
    expect(onSaved).toHaveBeenCalledWith('SQ-2026-0042');
  });

  it('shows Failed to save on error', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(saveQuote).mockRejectedValue(new Error('Network error'));

    render(<SaveQuoteButton input={mockInput} result={mockResult} />);

    await user.click(screen.getByText('Save Quote'));
    await user.click(screen.getByRole('button', { name: /save/i }));

    await vi.advanceTimersByTimeAsync(100);

    await waitFor(() => {
      expect(screen.getByText('Failed to save')).toBeInTheDocument();
    });
  });

  it('cancel button hides notes input', async () => {
    vi.useRealTimers();
    render(<SaveQuoteButton input={mockInput} result={mockResult} />);

    await userEvent.click(screen.getByText('Save Quote'));
    expect(screen.getByPlaceholderText('Add notes (optional)')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.getByText('Save Quote')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add notes (optional)')).not.toBeInTheDocument();
  });

  it('pressing Enter in notes input triggers save', async () => {
    vi.useRealTimers();
    vi.mocked(saveQuote).mockResolvedValue({ referenceNo: 'SQ-2026-0099' } as ReturnType<
      typeof saveQuote
    > extends Promise<infer T>
      ? T
      : never);

    render(<SaveQuoteButton input={mockInput} result={mockResult} />);

    await userEvent.click(screen.getByText('Save Quote'));
    const notesInput = screen.getByPlaceholderText('Add notes (optional)');
    await userEvent.type(notesInput, 'rush order');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(saveQuote).toHaveBeenCalledWith(mockInput, 'rush order');
    });
  });

  it('pressing Escape in notes input closes notes and clears input', async () => {
    vi.useRealTimers();
    render(<SaveQuoteButton input={mockInput} result={mockResult} />);

    await userEvent.click(screen.getByText('Save Quote'));
    const notesInput = screen.getByPlaceholderText('Add notes (optional)');
    await userEvent.type(notesInput, 'some note');
    await userEvent.keyboard('{Escape}');

    expect(screen.getByText('Save Quote')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add notes (optional)')).not.toBeInTheDocument();
  });

  it('shows duplicate confirm dialog when saving same input twice', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(saveQuote).mockResolvedValue({ referenceNo: 'SQ-2026-0050' } as ReturnType<
      typeof saveQuote
    > extends Promise<infer T>
      ? T
      : never);

    render(<SaveQuoteButton input={mockInput} result={mockResult} />);

    // First save
    await userEvent.click(screen.getByText('Save Quote'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/Saved!/)).toBeInTheDocument();
    });

    // Advance past the 4s idle reset timer
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText('Save Quote')).toBeInTheDocument();
    });

    // Second save with same input -> should show duplicate dialog
    await userEvent.click(screen.getByText('Save Quote'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Duplicate Quote')).toBeInTheDocument();
      expect(screen.getByText('This quote was already saved. Save again?')).toBeInTheDocument();
      expect(screen.getByText('Save Again')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
