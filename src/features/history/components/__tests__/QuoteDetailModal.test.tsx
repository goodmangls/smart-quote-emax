import { render, screen } from '@testing-library/react';
import { QuoteDetailModal } from '../QuoteDetailModal';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/components/ui/Toast';
import { QuoteDetail } from '@/types';

const quote: QuoteDetail = {
  id: 7,
  referenceNo: 'SQ-2026-0007',
  status: 'draft',
  notes: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  originCountry: 'KR',
  destinationCountry: 'US',
  destinationZip: '10001',
  domesticRegionCode: '',
  isJejuPickup: false,
  incoterm: 'DAP',
  packingType: 'NONE',
  dutyTaxEstimate: 0,
  exchangeRate: 1300,
  fscPercent: 52.5,
  manualDomesticCost: null,
  manualPackingCost: null,
  items: [],
  totalQuoteAmount: 185000,
  totalQuoteAmountUSD: 142.31,
  totalCostAmount: 135000,
  discountAmount: 50000,
  discountPercent: 27,
  billableWeight: 1,
  appliedZone: '8',
  warnings: [],
  validityDate: null,
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

const renderModal = () =>
  render(
    <LanguageProvider>
      <ToastProvider>
        <QuoteDetailModal quote={quote} onClose={() => {}} />
      </ToastProvider>
    </LanguageProvider>,
  );

const setLanguage = (lang: 'en' | 'ko') => localStorage.setItem('smartQuoteLanguage', lang);

describe('QuoteDetailModal cost total label', () => {
  it('labels the undiscounted published-rate total in English', () => {
    setLanguage('en');
    renderModal();

    expect(screen.getByText('Published Rate Total')).toBeInTheDocument();
    expect(screen.queryByText('Total Cost')).not.toBeInTheDocument();
  });

  it('labels the undiscounted published-rate total in Korean', () => {
    setLanguage('ko');
    renderModal();

    expect(screen.getByText('공시 요율 합계')).toBeInTheDocument();
    expect(screen.queryByText('Published Rate Total')).not.toBeInTheDocument();
  });
});
