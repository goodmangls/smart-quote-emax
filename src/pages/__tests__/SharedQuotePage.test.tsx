import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SharedQuotePage from '../SharedQuotePage';
import { getSharedQuote, SharedQuoteData } from '@/api/shareApi';
// Same key set the backend share spec asserts (spec/requests/api/v1/quote_shares_spec.rb).
import contract from '../../../shared/test-fixtures/shared-quote-contract.json';

vi.mock('@/api/shareApi', () => ({
  getSharedQuote: vi.fn(),
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/q/tok']}>
      <Routes>
        <Route path='/q/:token' element={<SharedQuotePage />} />
      </Routes>
    </MemoryRouter>,
  );

const withPayload = (overrides: Partial<SharedQuoteData> = {}) => {
  vi.mocked(getSharedQuote).mockResolvedValue({ ...(contract as SharedQuoteData), ...overrides });
};

describe('SharedQuotePage', () => {
  beforeEach(() => {
    vi.mocked(getSharedQuote).mockReset();
  });

  it('shows the USD total the backend sends under totalQuoteAmountUSD', async () => {
    withPayload();
    renderPage();

    expect(await screen.findByText(/Approx\. \$1,071\.43/)).toBeInTheDocument();
    expect(screen.getByText('KRW 1,500,000')).toBeInTheDocument();
  });

  // Origins live in ORIGIN_COUNTRY_OPTIONS; Korea is never a destination.
  it('names the origin country instead of printing its code', async () => {
    withPayload();
    renderPage();

    expect(await screen.findByText('South Korea')).toBeInTheDocument();
    expect(screen.queryByText('KR')).not.toBeInTheDocument();
  });

  it('shows the carrier the customer chose', async () => {
    withPayload({ overseasCarrier: 'DHL' });
    renderPage();

    expect(await screen.findByText('DHL')).toBeInTheDocument();
  });

  it('shows the stored transit time', async () => {
    withPayload();
    renderPage();

    expect(await screen.findByText('3-5 days')).toBeInTheDocument();
  });

  it('hides the transit field when no transit time was stored', async () => {
    withPayload({ transitTime: null });
    renderPage();

    expect(await screen.findByText(/Approx\./)).toBeInTheDocument();
    expect(screen.queryByText('Transit')).not.toBeInTheDocument();
  });
});
