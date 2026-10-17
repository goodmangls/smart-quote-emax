import { useState } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { FinancialSection } from '../FinancialSection';
import { QuoteInput } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (key: string) => key }),
}));

vi.mock('@/features/dashboard/hooks/useFscRates', () => ({
  useFscRates: () => ({
    data: {
      rates: {
        UPS: { international: 47.5, domestic: 0 },
        DHL: { international: 45, domestic: 0 },
        FEDEX: { international: 46.25, domestic: 0 },
        OCS: { international: 25, domestic: 0 },
      },
      updatedAt: '2026-10-12',
    },
    loading: false,
    error: null,
    retry: vi.fn(),
  }),
}));

/** Parent that stores whatever the section pushes, like QuoteCalculator does. */
function Harness({
  initial,
  onPush,
}: {
  initial: Partial<QuoteInput>;
  onPush: (key: string, value: unknown) => void;
}) {
  const [input, setInput] = useState({ overseasCarrier: 'UPS', ...initial } as QuoteInput);
  return (
    <FinancialSection
      input={input}
      isMobileView={false}
      hideMargin
      showUSD={false}
      onFieldChange={(key, value) => {
        onPush(key, value);
        setInput((prev) => ({ ...prev, [key]: value }));
      }}
    />
  );
}

/** Parent that owns the quote input and can switch carrier from outside the FSC box. */
function CarrierSwitchHarness() {
  const [input, setInput] = useState({ overseasCarrier: 'UPS', fscPercent: 52.5 } as QuoteInput);
  return (
    <>
      <button
        type="button"
        onClick={() => setInput({ overseasCarrier: 'FEDEX', fscPercent: 47.5 } as QuoteInput)}
      >
        switch to FEDEX
      </button>
      <FinancialSection
        input={input}
        isMobileView={false}
        hideMargin
        showUSD={false}
        onFieldChange={(key, value) => setInput((prev) => ({ ...prev, [key]: value }))}
      />
    </>
  );
}

// The FSC input is the only numeric field stepping by 0.01 (Discount steps by 0.1).
const fscBox = () => document.querySelector<HTMLInputElement>('input[step="0.01"]')!;

describe('FinancialSection FSC box', () => {
  it('clearing the box applies the carrier’s DB default, never 0', () => {
    const onPush = vi.fn();
    render(<Harness initial={{ overseasCarrier: 'UPS', fscPercent: 52.5 }} onPush={onPush} />);

    fireEvent.change(fscBox(), { target: { value: '' } });

    expect(onPush).toHaveBeenLastCalledWith('fscPercent', 47.5);
    expect(fscBox()).toHaveValue(null);
  });

  it('keeps the box empty after clearing instead of refilling it with the default', () => {
    render(<Harness initial={{ overseasCarrier: 'UPS', fscPercent: 52.5 }} onPush={vi.fn()} />);

    fireEvent.change(fscBox(), { target: { value: '' } });

    expect(fscBox()).toHaveValue(null);
  });

  it('a typed 0 is a real 0% surcharge', () => {
    const onPush = vi.fn();
    render(<Harness initial={{ overseasCarrier: 'UPS', fscPercent: 52.5 }} onPush={onPush} />);

    fireEvent.change(fscBox(), { target: { value: '' } });
    fireEvent.change(fscBox(), { target: { value: '0' } });

    expect(onPush).toHaveBeenLastCalledWith('fscPercent', 0);
    expect(fscBox()).toHaveValue(0);
  });

  it('refreshes the draft on a carrier switch even when the new value equals the last pushed one', () => {
    render(<CarrierSwitchHarness />);

    // Clearing pushes the UPS default (47.5); the parent stores it.
    fireEvent.change(fscBox(), { target: { value: '' } });
    // The parent switches to a carrier whose default is also 47.5.
    fireEvent.click(screen.getByRole('button', { name: 'switch to FEDEX' }));

    expect(fscBox()).toHaveValue(47.5);
  });

  it('shows the new value when the carrier switches from outside the box', () => {
    const { rerender } = render(
      <FinancialSection
        input={{ overseasCarrier: 'UPS', fscPercent: 52.5 } as QuoteInput}
        isMobileView={false}
        hideMargin
        showUSD={false}
        onFieldChange={vi.fn()}
      />,
    );

    rerender(
      <FinancialSection
        input={{ overseasCarrier: 'DHL', fscPercent: 45 } as QuoteInput}
        isMobileView={false}
        hideMargin
        showUSD={false}
        onFieldChange={vi.fn()}
      />,
    );

    expect(fscBox()).toHaveValue(45);
  });
});
