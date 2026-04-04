import React from 'react';
import { QuoteInput, CargoItem } from '@/types';
import { RouteSection } from './RouteSection';
import { FinancialSection } from './FinancialSection';
import { CargoSection } from './CargoSection';
import { ServiceSection } from './ServiceSection';
import { SeoulPickupSection } from './SeoulPickupSection';
import { FscRateWidget } from '@/features/admin/components/FscRateWidget';
import type { ResolvedDiscount } from '@/api/discountRuleApi';

interface Props {
  input: QuoteInput;
  onChange: (newInput: QuoteInput) => void;
  isMobileView?: boolean;
  effectiveDiscountPercent?: number;
  hideMargin?: boolean;
  intlBase?: number;
  billableWeight?: number;
  resolvedDiscount?: ResolvedDiscount | null;
  onDiscountChange?: (val: number) => void;
}

export const InputSection: React.FC<Props> = ({ input, onChange, isMobileView = false, effectiveDiscountPercent, hideMargin, intlBase, billableWeight, resolvedDiscount, onDiscountChange }) => {

  const updateField = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    onChange({ ...input, [key]: value });
  };

  const handleCargoChange = (newItems: CargoItem[]) => {
      updateField('items', newItems);
  };

  return (
    <div className="space-y-8">
      <RouteSection input={input} onFieldChange={updateField} isMobileView={isMobileView} />
      <CargoSection items={input.items} onChange={handleCargoChange} isMobileView={isMobileView} />
      <FscRateWidget readOnly={hideMargin} />
      {!hideMargin && (
        <FinancialSection 
          input={input} 
          onFieldChange={updateField} 
          onDiscountChange={onDiscountChange}
          isMobileView={isMobileView} 
          effectiveDiscountPercent={effectiveDiscountPercent} 
          hideMargin={hideMargin} 
          resolvedDiscount={resolvedDiscount} 
        />
      )}
      <SeoulPickupSection input={input} onFieldChange={updateField} isMobileView={isMobileView} hideMargin={hideMargin} />
      <ServiceSection input={input} onFieldChange={updateField} isMobileView={isMobileView} intlBase={intlBase} billableWeight={billableWeight} hideMargin={hideMargin} />
    </div>
  );
};