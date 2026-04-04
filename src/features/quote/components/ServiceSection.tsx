import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { QuoteInput, PackingType, Incoterm } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { inputStyles } from './input-styles';
import { SurchargePanel } from './SurchargePanel';
import { DhlAddOnPanel } from './DhlAddOnPanel';
import { UpsAddOnPanel } from './UpsAddOnPanel';
import { PackingTypeInfo } from './PackingTypeInfo';
import { useSurcharges } from '@/features/dashboard/hooks/useSurcharges';
import { useAddonRates } from '@/features/dashboard/hooks/useAddonRates';
import { useSyncToInput } from '@/features/quote/hooks/useSyncToInput';
import { HelpCircle, X } from 'lucide-react';

interface Props {
  input: QuoteInput;
  onFieldChange: <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => void;
  isMobileView: boolean;
  intlBase?: number; // base carrier rate for rate-based surcharge calculation
  billableWeight?: number; // for DHL add-on fee calculations
  hideMargin?: boolean;
}

export const ServiceSection: React.FC<Props> = ({ input, onFieldChange, isMobileView, intlBase = 0, billableWeight = 0, hideMargin }) => {
  const { inputClass, labelClass, cardClass, sectionTitleClass, twoColGrid } = inputStyles;
  const ic = inputClass(isMobileView);
  const lc = labelClass(isMobileView);
  const grid = twoColGrid(isMobileView);
  const { t } = useLanguage();

  const carrier = input.overseasCarrier || 'UPS';
  const { surcharges, loading: scLoading, error: scError, lastUpdated: scUpdated, calculateApplied, totalAmount, retry: scRetry } = useSurcharges(carrier, input.destinationCountry);
  const appliedSurcharges = calculateApplied(intlBase);
  const systemTotal = totalAmount(intlBase);

  // DB-driven add-on rates (fallback to hardcoded in panels if API fails)
  const { rates: dbAddonRates } = useAddonRates(carrier as 'DHL' | 'UPS');

  // Generic field setter (cast to bypass generic constraint for useSyncToInput)
  const setField = onFieldChange as (key: string, value: unknown) => void;

  // Sync resolved surcharges into QuoteInput for calculateQuote()
  const transformSurcharges = useCallback(
    (src: typeof surcharges) => {
      const mapped = src.map(s => ({
        code: s.code,
        name: s.name,
        nameKo: s.name_ko,
        chargeType: s.charge_type,
        amount: s.amount,
        sourceUrl: s.source_url,
      }));
      return mapped.length > 0 ? mapped : undefined;
    },
    [],
  );
  useSyncToInput(surcharges, 'resolvedSurcharges', setField, { transform: transformSurcharges });

  // Sync resolved addon rates into QuoteInput for calculateQuote()
  const transformAddonRates = useCallback(
    (src: typeof dbAddonRates) =>
      src.map(r => ({
        code: r.code,
        carrier: r.carrier,
        nameEn: r.nameEn,
        nameKo: r.nameKo,
        chargeType: r.chargeType,
        unit: r.unit,
        amount: r.amount,
        perKgRate: r.perKgRate,
        ratePercent: r.ratePercent,
        minAmount: r.minAmount,
        fscApplicable: r.fscApplicable,
        autoDetect: r.autoDetect,
        selectable: r.selectable,
        condition: r.condition,
        detectRules: r.detectRules,
      })),
    [],
  );
  useSyncToInput(dbAddonRates, 'resolvedAddonRates', setField, {
    transform: transformAddonRates,
    skip: dbAddonRates.length === 0,
  });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cardClass}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`${sectionTitleClass} w-full justify-between cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors`}
      >
        <span>{t('calc.section.service')}</span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {isOpen && <div className={grid}>
        {!hideMargin && (
          <>
            <div>
              <label className={lc}>Special Packing</label>
              <div className="relative">
                  <select
                  value={input.packingType}
                  onChange={(e) => onFieldChange('packingType', e.target.value as PackingType)}
                  className={`${ic} appearance-none`}
                  >
                  {Object.values(PackingType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
              </div>
              <PackingTypeInfo packingType={input.packingType} items={input.items} isMobileView={isMobileView} />
            </div>

            <PackingCostOverrideField input={input} onFieldChange={onFieldChange} lc={lc} ic={ic} />
          </>
        )}

        <SurchargePanel
          carrier={carrier}
          surcharges={surcharges}
          appliedSurcharges={appliedSurcharges}
          systemTotal={systemTotal}
          manualSurgeCost={input.manualSurgeCost}
          onManualSurgeChange={(val) => onFieldChange('manualSurgeCost', val)}
          loading={scLoading}
          error={scError}
          lastUpdated={scUpdated}
          onRetry={scRetry}
          isMobileView={isMobileView}
        />

        {carrier === 'DHL' && (
          <DhlAddOnPanel
            selectedAddOns={input.dhlAddOns || []}
            onAddOnsChange={(codes) => onFieldChange('dhlAddOns', codes)}
            declaredValue={input.dhlDeclaredValue}
            onDeclaredValueChange={(val) => onFieldChange('dhlDeclaredValue', val)}
            items={input.items}
            packingType={input.packingType}
            billableWeight={billableWeight}
            fscPercent={input.fscPercent}
            isMobileView={isMobileView}
            dbRates={dbAddonRates.length > 0 ? dbAddonRates : undefined}
          />
        )}

        {carrier === 'UPS' && (
          <UpsAddOnPanel
            selectedAddOns={input.upsAddOns || []}
            onAddOnsChange={(codes) => onFieldChange('upsAddOns', codes)}
            items={input.items}
            packingType={input.packingType}
            billableWeight={billableWeight}
            fscPercent={input.fscPercent}
            isMobileView={isMobileView}
            incoterm={input.incoterm}
            dbRates={dbAddonRates.length > 0 ? dbAddonRates : undefined}
            destinationCountry={input.destinationCountry}
            destinationZip={input.destinationZip}
          />
        )}

        {input.incoterm === Incoterm.DDP && (
          <div>
             <label className={lc}>Estimated Duty & Tax (KRW)</label>
             <input
              type="number"
              step="any"
              value={input.dutyTaxEstimate}
              onChange={(e) => onFieldChange('dutyTaxEstimate', Number(e.target.value))}
              className={ic}
              inputMode="decimal"
              autoComplete="off"
             />
          </div>
        )}
      </div>}
    </div>
  );
};

/** Packing & Docs Cost Override with expandable calculation basis info */
const PackingCostOverrideField: React.FC<{
  input: QuoteInput;
  onFieldChange: <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => void;
  lc: string;
  ic: string;
}> = ({ input, onFieldChange, lc, ic }) => {
  const { t } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div>
      <label className={lc}>Packing & Docs Cost Override (KRW)</label>
      <div className="relative">
        <input
          type="number"
          step="any"
          value={input.manualPackingCost ?? ''}
          onChange={(e) => onFieldChange('manualPackingCost', e.target.value === '' ? undefined : Number(e.target.value))}
          className={ic}
          placeholder="Auto-calculated if empty"
          inputMode="decimal"
          autoComplete="off"
        />
      </div>
      <div className="mt-1.5 flex items-start gap-1">
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-jways-500 transition-colors"
        >
          <HelpCircle className="w-3 h-3 flex-shrink-0" />
          <span>참고: 아래 항목들을 합산하여 자유롭게 입력할 수 있습니다. (예시 금액이며 필수 아님)</span>
        </button>
      </div>
      {showInfo && (
        <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-600 relative animate-in fade-in slide-in-from-top-1 duration-200">
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-3 h-3" />
          </button>
          <p className="font-bold mb-2 text-jways-700 dark:text-jways-300">{t('calc.costBasis.title')}</p>
          <ul className="space-y-1 list-disc pl-4 marker:text-gray-300">
            <li>{t('calc.costBasis.material')}</li>
            <li>{t('calc.costBasis.labor')}</li>
            <li>{t('calc.costBasis.fumigation')}</li>
            <li>{t('calc.costBasis.handling')}</li>
          </ul>
        </div>
      )}
    </div>
  );
};
