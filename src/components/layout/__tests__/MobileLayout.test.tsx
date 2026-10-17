import { render, act } from '@testing-library/react';
import { MobileLayout } from '../MobileLayout';
import { QuoteInput, QuoteResult } from '@/types';
// The desktop (admin) carrier badge is the source of truth for carrier colours.
import { carrierBadge } from '@/features/admin/components/surcharge/surchargeUtils';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (key: string) => key }),
}));

vi.mock('@/features/quote/components/InputSection', () => ({ InputSection: () => null }));
vi.mock('@/features/quote/components/ResultSection', () => ({ ResultSection: () => null }));
vi.mock('@/pages/components/AdminWidgets', () => ({ AdminWidgets: () => null }));

const makeResult = (carrier: string): QuoteResult =>
  ({
    carrier,
    billableWeight: 12.5,
    totalQuoteAmount: 1_000_000,
    totalQuoteAmountUSD: 700,
    appliedZone: 'Z1',
    transitTime: '3 days',
    warnings: [],
    breakdown: { intlBase: 0 },
  }) as unknown as QuoteResult;

const baseProps = (carrier: string, result: QuoteResult | null = makeResult(carrier)) => ({
  isDarkMode: false,
  setIsDarkMode: vi.fn(),
  isMobileView: true,
  setIsMobileView: vi.fn(),
  input: { overseasCarrier: carrier } as unknown as QuoteInput,
  setInput: vi.fn(),
  result,
  onDiscountChange: vi.fn(),
  onDownloadPdf: vi.fn(),
  onReset: vi.fn(),
  scrollToResults: vi.fn(),
  discountPercent: 0,
  onSwitchCarrier: vi.fn(),
});

// The carrier pill is the only bottom-bar span whose text is exactly the carrier code.
const carrierPill = (carrier: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent === carrier,
  ) as HTMLElement;

describe('MobileLayout carrier badge', () => {
  it.each(['UPS', 'DHL', 'FEDEX'])('%s badge carries the desktop badge colours', (carrier) => {
    render(<MobileLayout {...baseProps(carrier)} />);

    const pill = carrierPill(carrier);
    for (const token of carrierBadge(carrier).split(' ')) {
      expect(pill.className).toContain(token);
    }
  });

  it('FedEx is not shown in the blue fallback', () => {
    render(<MobileLayout {...baseProps('FEDEX')} />);

    expect(carrierPill('FEDEX').className).not.toContain('bg-blue-100');
  });
});

describe('MobileLayout auto-scroll after carrier change', () => {
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    scrollIntoView = vi.fn();
    const target = document.createElement('div');
    target.id = 'result-section';
    target.scrollIntoView = scrollIntoView as unknown as typeof target.scrollIntoView;
    document.body.appendChild(target);
  });

  afterEach(() => {
    document.getElementById('result-section')?.remove();
    vi.useRealTimers();
  });

  it('scrolls once when the carrier changes twice in quick succession', () => {
    const { rerender } = render(<MobileLayout {...baseProps('UPS')} />);

    rerender(<MobileLayout {...baseProps('DHL')} />);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender(<MobileLayout {...baseProps('FEDEX')} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending scroll when the screen unmounts', () => {
    const { rerender, unmount } = render(<MobileLayout {...baseProps('UPS')} />);

    rerender(<MobileLayout {...baseProps('DHL')} />);
    unmount();
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
