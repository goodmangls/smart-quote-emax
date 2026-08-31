import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FscRateWidget } from '../FscRateWidget';

/**
 * These rates are deliberately values that appear NOWHERE in `src/config/rates.ts`.
 *
 * The bug this widget was fixed for is exactly "displays the constants while quotes
 * charge the DB", so asserting on the real weekly rates would pass whether the widget
 * read the DB or the constants — and would also break every week that /fsc-update runs.
 */
const DB_RATES = {
  UPS: 11.11,
  DHL: 22.22,
  FEDEX: 33.33,
  OCS: 44.44,
} as const;

const mockUseFscRates = vi.fn();
const mockUpdateFscRate = vi.fn();
const mockRetry = vi.fn();

vi.mock('@/features/dashboard/hooks/useFscRates', () => ({
  useFscRates: () => mockUseFscRates(),
}));

vi.mock('@/api/fscApi', () => ({
  updateFscRate: (...args: unknown[]) => mockUpdateFscRate(...args),
}));

function hookResult(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      rates: Object.fromEntries(
        Object.entries(DB_RATES).map(([carrier, rate]) => [
          carrier,
          { international: rate, domestic: rate },
        ]),
      ),
      updatedAt: '2026-08-31T00:00:00.000Z',
    },
    loading: false,
    error: null,
    retry: mockRetry,
    ...overrides,
  };
}

describe('FscRateWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseFscRates.mockReturnValue(hookResult());
    mockUpdateFscRate.mockResolvedValue({ success: true });
  });

  describe('rate source', () => {
    it('renders the DB rates, not the rates.ts constants', () => {
      render(<FscRateWidget />);

      expect(screen.getByText('11.11%')).toBeInTheDocument();
      expect(screen.getByText('22.22%')).toBeInTheDocument();
      expect(screen.getByText('33.33%')).toBeInTheDocument();
      expect(screen.getByText('44.44%')).toBeInTheDocument();
    });

    it('labels the source as DB with a rates.ts fallback', () => {
      render(<FscRateWidget />);

      expect(screen.getByText('Source: DB / rates.ts fallback')).toBeInTheDocument();
    });

    it('shows a spinner rather than a failure while the first read is in flight', () => {
      mockUseFscRates.mockReturnValue(hookResult({ data: null, loading: true }));

      render(<FscRateWidget />);

      expect(screen.queryByText('Failed to load rates')).not.toBeInTheDocument();
    });

    it('reports failure when the read resolves with no data', () => {
      mockUseFscRates.mockReturnValue(hookResult({ data: null, loading: false }));

      render(<FscRateWidget />);

      expect(screen.getByText('Failed to load rates')).toBeInTheDocument();
    });
  });

  describe('editing', () => {
    it('seeds the inputs from the DB values when editing starts', async () => {
      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));

      expect(screen.getByLabelText('UPS FSC 요율 (%)')).toHaveValue(11.11);
      expect(screen.getByLabelText('OCS FSC 요율 (%)')).toHaveValue(44.44);
    });

    it('writes every percentage carrier — including OCS — on save', async () => {
      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 저장'));

      await waitFor(() => expect(mockUpdateFscRate).toHaveBeenCalledTimes(4));

      const carriersWritten = mockUpdateFscRate.mock.calls.map((call) => call[0]);
      expect(carriersWritten).toEqual(['UPS', 'DHL', 'FEDEX', 'OCS']);
    });

    it('never writes an EMAX row — EMAX fuel is per-kg, not a percentage', async () => {
      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 저장'));

      await waitFor(() => expect(mockUpdateFscRate).toHaveBeenCalled());

      const carriersWritten = mockUpdateFscRate.mock.calls.map((call) => call[0]);
      expect(carriersWritten).not.toContain('EMAX');
    });

    it('sends the edited value for both international and domestic', async () => {
      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.clear(screen.getByLabelText('DHL FSC 요율 (%)'));
      await user.type(screen.getByLabelText('DHL FSC 요율 (%)'), '43.25');
      await user.click(screen.getByLabelText('FSC 요율 저장'));

      await waitFor(() => expect(mockUpdateFscRate).toHaveBeenCalledWith('DHL', 43.25, 43.25));
    });

    it('re-reads the rates after a successful save', async () => {
      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 저장'));

      await waitFor(() => expect(mockRetry).toHaveBeenCalled());
    });

    it('names which carriers landed when a save fails part-way through', async () => {
      // UPS and DHL commit, FEDEX blows up. `fsc_rates` is now half-written:
      // two carriers charge the new rate, two charge the old one. Reporting only
      // "저장 실패" would leave the admin unable to tell which state it is in.
      mockUpdateFscRate
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('500 Internal Server Error'));

      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 저장'));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('일부만 저장됐습니다');
      expect(alert).toHaveTextContent('UPS·DHL 는 새 요율');
      expect(alert).toHaveTextContent('FEDEX·OCS 는 이전 요율');
    });

    it('says nothing landed when the very first carrier fails', async () => {
      mockUpdateFscRate.mockRejectedValue(new Error('network down'));

      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 저장'));

      expect(await screen.findByRole('alert')).toHaveTextContent('변경된 캐리어는 없습니다');
    });

    it('keeps the editor open on failure so the partial write can be re-submitted', async () => {
      mockUpdateFscRate.mockRejectedValue(new Error('network down'));

      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 저장'));

      await screen.findByRole('alert');
      expect(screen.getByLabelText('FSC 요율 저장')).toBeInTheDocument();
      expect(screen.getByLabelText('UPS FSC 요율 (%)')).toBeInTheDocument();
    });

    it('re-reads the table after a failed save so the display matches reality', async () => {
      mockUpdateFscRate.mockRejectedValue(new Error('network down'));

      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 저장'));

      await waitFor(() => expect(mockRetry).toHaveBeenCalled());
    });

    it('raises no alert on a successful save', async () => {
      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 저장'));

      await waitFor(() => expect(mockRetry).toHaveBeenCalled());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('clears a previous failure when the editor is reopened', async () => {
      mockUpdateFscRate.mockRejectedValue(new Error('network down'));

      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 저장'));
      await screen.findByRole('alert');

      await user.click(screen.getByLabelText('FSC 요율 편집 취소'));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('writes nothing when the edit is cancelled', async () => {
      const user = userEvent.setup();
      render(<FscRateWidget />);

      await user.click(screen.getByLabelText('FSC 요율 편집'));
      await user.click(screen.getByLabelText('FSC 요율 편집 취소'));

      expect(mockUpdateFscRate).not.toHaveBeenCalled();
      expect(screen.getByText('11.11%')).toBeInTheDocument();
    });
  });

  describe('readOnly', () => {
    it('offers no edit control to a member', () => {
      render(<FscRateWidget readOnly />);

      expect(screen.queryByLabelText('FSC 요율 편집')).not.toBeInTheDocument();
    });
  });
});
