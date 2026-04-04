import React from 'react';
import { QuoteInput } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEOUL_PICKUP_ZONES } from '@/config/options';
import { inputStyles } from './input-styles';

interface Props {
  input: QuoteInput;
  onFieldChange: <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => void;
  isMobileView: boolean;
  hideMargin?: boolean;
}

export const SeoulPickupSection: React.FC<Props> = ({ input, onFieldChange, isMobileView, hideMargin }) => {
  const { inputClass, cardClass, sectionTitleClass } = inputStyles;
  const ic = inputClass(isMobileView);
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  return (
    <div className={cardClass}>
      <h3 className={sectionTitleClass}>
        <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
        {hideMargin ? t('calc.service.pickup.label').replace('(KRW)', '(USD)') : t('calc.service.pickup.label')}
      </h3>
      <div>
        <div className="relative">
          <select
            value={input.pickupInSeoulCost ?? ''}
            onChange={(e) => onFieldChange('pickupInSeoulCost', e.target.value === '' ? undefined : Number(e.target.value))}
            className={`${ic} appearance-none`}
          >
            <option value="">— {t('calc.service.pickup.none')} —</option>
            {SEOUL_PICKUP_ZONES.map((zone, i) => (
              <option key={i} value={zone.cost}>
                {isEn
                  ? `${zone.districtsEn.join(', ')} — ${hideMargin ? `USD ${zone.costUsd}` : `${zone.cost.toLocaleString()} KRW`}`
                  : `${zone.districts.join(', ')} — ${zone.cost.toLocaleString()}원`
                }
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-gray-400">
          {t('calc.service.pickup.hint')}
        </p>
      </div>
    </div>
  );
};
