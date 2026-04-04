import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePDF, generateComparisonPDF } from './pdfService';
import { QuoteInput, QuoteResult, Incoterm, PackingType } from '@/types';

// Mock jsPDF
const mockSave = vi.fn();
const mockText = vi.fn();
const mockRect = vi.fn();
const mockRoundedRect = vi.fn();
const mockLine = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockSetFont = vi.fn();
const mockAddImage = vi.fn();
const mockAddFileToVFS = vi.fn();
const mockAddFont = vi.fn();

vi.mock('jspdf', () => {
  return {
    jsPDF: class {
      save = mockSave;
      text = mockText;
      rect = mockRect;
      roundedRect = mockRoundedRect;
      line = mockLine;
      setFontSize = mockSetFontSize;
      setTextColor = mockSetTextColor;
      setFillColor = mockSetFillColor;
      setDrawColor = mockSetDrawColor;
      setLineWidth = mockSetLineWidth;
      setFont = mockSetFont;
      addImage = mockAddImage;
      addFileToVFS = mockAddFileToVFS;
      addFont = mockAddFont;
      internal = {
        pageSize: { height: 297, width: 210 }
      };
      getCurrentPageInfo = () => ({ pageNumber: 1 });
    }
  };
});

vi.mock('jspdf-autotable', () => ({
  default: vi.fn((doc: Record<string, unknown>) => {
    doc.lastAutoTable = { finalY: 150 };
  }),
}));

vi.mock('@/assets/fonts/NotoSansKR-Regular-base64', () => ({
  default: 'FAKE_BASE64_FONT_DATA',
}));

vi.mock('@/assets/logo-base64', () => ({
  default: 'data:image/png;base64,FAKE_LOGO',
}));

// Reset font cache before each test
vi.mock('./pdfFontLoader', () => ({
  loadKoreanFont: vi.fn(),
}));

const mockInput: QuoteInput = {
  originCountry: 'KR',
  destinationCountry: 'US',
  destinationZip: '12345',
  incoterm: Incoterm.DAP,
  packingType: PackingType.NONE,
  items: [{ id: '1', width: 40, length: 50, height: 40, weight: 15, quantity: 1 }],
  discountPercent: 15,
  dutyTaxEstimate: 0,
  exchangeRate: 1400,
  fscPercent: 15,
  overseasCarrier: 'UPS',
};

const mockResult: QuoteResult = {
  totalQuoteAmount: 100000,
  totalQuoteAmountUSD: 70,
  totalCostAmount: 80000,
  discountAmount: 20000,
  discountPercent: 15,
  currency: 'KRW',
  totalActualWeight: 15,
  totalVolumetricWeight: 19.2,
  billableWeight: 19.2,
  appliedZone: 'Z5',
  transitTime: '3-5 Days',
  carrier: 'UPS',
  warnings: [],
  breakdown: {
    packingMaterial: 5000,
    packingLabor: 5000,
    packingFumigation: 0,
    handlingFees: 0,
    pickupInSeoul: 0,
    intlBase: 50000,
    intlFsc: 10000,
    intlWarRisk: 0,
    intlSurge: 0,
    destDuty: 0,
    totalCost: 80000,
  },
};

describe('pdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePDF', () => {
    it('saves PDF with DRAFT filename when no referenceNo', async () => {
      await generatePDF(mockInput, mockResult);

      expect(mockSave).toHaveBeenCalledTimes(1);
      const filename = mockSave.mock.calls[0][0] as string;
      expect(filename).toMatch(/^EMAX_Quote_DRAFT_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('saves PDF with referenceNo in filename', async () => {
      await generatePDF(mockInput, mockResult, 'SQ-2026-0042');

      const filename = mockSave.mock.calls[0][0] as string;
      expect(filename).toMatch(/^EMAX_Quote_SQ-2026-0042_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('calls loadKoreanFont', async () => {
      const { loadKoreanFont } = await import('./pdfFontLoader');
      await generatePDF(mockInput, mockResult);
      expect(loadKoreanFont).toHaveBeenCalled();
    });

    it('renders text content', async () => {
      await generatePDF(mockInput, mockResult);
      expect(mockText).toHaveBeenCalled();
    });
  });

  describe('generateComparisonPDF', () => {
    const dhlResult: QuoteResult = {
      ...mockResult,
      carrier: 'DHL',
      appliedZone: 'Z4',
      totalQuoteAmount: 120000,
      totalQuoteAmountUSD: 85,
    };

    it('saves comparison PDF', async () => {
      await generateComparisonPDF(mockInput, mockResult, dhlResult);

      expect(mockSave).toHaveBeenCalledTimes(1);
      const filename = mockSave.mock.calls[0][0] as string;
      expect(filename).toMatch(/^EMAX_Comparison_DRAFT_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('supports optional 3rd carrier (EMAX)', async () => {
      const emaxResult: QuoteResult = {
        ...mockResult,
        carrier: 'EMAX',
        totalQuoteAmount: 90000,
        totalQuoteAmountUSD: 64,
      };

      await generateComparisonPDF(mockInput, mockResult, dhlResult, emaxResult);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });
});
