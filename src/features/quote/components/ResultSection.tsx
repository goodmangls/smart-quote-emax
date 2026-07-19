import React from 'react';
import { QuoteInput, QuoteResult } from '@/types';
import { QuoteSummaryCard } from './QuoteSummaryCard';
import { WarningAlerts } from './WarningAlerts';
import { KeyMetricsGrid } from './KeyMetricsGrid';
import { CostBreakdownCard } from './CostBreakdownCard';
import { CarrierComparisonCard } from './CarrierComparisonCard';

interface Props {
  result: QuoteResult;
  input?: QuoteInput;
  onDiscountChange: (newDiscount: number) => void;
  onDownloadPdf: () => void;
  discountPercent: number;
  onSwitchCarrier?: (carrier: 'UPS' | 'DHL' | 'FEDEX', discountPercent: number) => void;
  hideMargin?: boolean;
  isKorean?: boolean;
  showUSD?: boolean;
}

export const ResultSection: React.FC<Props> = ({
  result,
  input,
  onDiscountChange,
  onDownloadPdf,
  onSwitchCarrier,
  discountPercent,
  hideMargin,
  isKorean = false,
  showUSD = true,
}) => {
  return (
    <div className='space-y-6 sticky top-6'>
      <QuoteSummaryCard
        result={result}
        onDownloadPdf={onDownloadPdf}
        isKorean={isKorean}
        hideMargin={hideMargin}
        showUSD={showUSD}
      />
      <WarningAlerts warnings={result.warnings} />
      <KeyMetricsGrid result={result} hideMargin={hideMargin} />

      {input && onSwitchCarrier && (
        <CarrierComparisonCard
          input={input}
          currentResult={result}
          isKorean={isKorean}
          onSwitchCarrier={onSwitchCarrier}
          onDiscountChange={onDiscountChange}
          hideMargin={hideMargin}
          showUSD={showUSD}
        />
      )}

      <CostBreakdownCard
        result={result}
        onDiscountChange={onDiscountChange}
        discountPercent={discountPercent}
        hideMargin={hideMargin}
        isKorean={isKorean}
        showUSD={showUSD}
      />
    </div>
  );
};
