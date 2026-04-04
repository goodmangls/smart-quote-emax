import React, { useMemo, useState } from 'react';
import { QuoteInput } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { COUNTRY_OPTIONS, UPS_ZONE_COUNTRIES, DHL_ZONE_COUNTRIES } from '@/config/options';
import { inputStyles } from './input-styles';

interface Props {
  input: QuoteInput;
  onFieldChange: <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => void;
  isMobileView: boolean;
}

const ZIP_HINTS: Record<string, { placeholder: string; pattern?: string }> = {
  US: { placeholder: 'e.g. 90001', pattern: '[0-9]{5}' },
  CN: { placeholder: 'e.g. 100000', pattern: '[0-9]{6}' },
  JP: { placeholder: 'e.g. 100-0001', pattern: '[0-9]{3}-?[0-9]{4}' },
  VN: { placeholder: 'e.g. 700000', pattern: '[0-9]{6}' },
  SG: { placeholder: 'e.g. 018956', pattern: '[0-9]{6}' },
  DE: { placeholder: 'e.g. 10115', pattern: '[0-9]{5}' },
  GB: { placeholder: 'e.g. SW1A 1AA', pattern: '[A-Za-z0-9 ]{5,8}' },
};

const selectChevron = (
  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
  </div>
);

export const RouteSection: React.FC<Props> = ({ input, onFieldChange, isMobileView }) => {
  const { inputClass, labelClass, cardClass, sectionTitleClass, twoColGrid } = inputStyles;
  const ic = inputClass(isMobileView);
  const lc = labelClass(isMobileView);
  const grid = twoColGrid(isMobileView);
  const { t } = useLanguage();

  const carrier = input.overseasCarrier || 'UPS';
  const zoneMap = carrier === 'DHL' ? DHL_ZONE_COUNTRIES : UPS_ZONE_COUNTRIES;
  const zoneKeys = Object.keys(zoneMap);

  // Extract country name without emoji flag for proper alphabetical sorting
  const getNameWithoutFlag = (name: string): string => name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '');

  // Zone override: null means auto-detect from destination country
  const [zoneOverride, setZoneOverride] = useState<string | null>(null);

  // Find zone for a given country code based on current carrier
  const findZoneForCountry = (countryCode: string): string => {
    for (const [zone, countries] of Object.entries(zoneMap)) {
      if (countries.includes(countryCode)) return zone;
    }
    return '';
  };

  // Zone selection: null = show all countries (no filter), string = specific zone
  const selectedZone = (() => {
    if (zoneOverride !== null && zoneMap[zoneOverride]) return zoneOverride;
    if (zoneOverride === '') return ''; // explicitly set to "All"
    return ''; // default: show all countries
  })();

  const filteredCountries = useMemo(() => {
    const base = (!selectedZone || !zoneMap[selectedZone])
      ? COUNTRY_OPTIONS
      : COUNTRY_OPTIONS.filter(c => new Set(zoneMap[selectedZone]).has(c.code));
    return [...base].sort((a, b) => getNameWithoutFlag(a.name).localeCompare(getNameWithoutFlag(b.name), 'en'));
  }, [selectedZone, zoneMap]);

  const zipHint = ZIP_HINTS[input.destinationCountry] || { placeholder: 'Zip / Postal Code' };

  return (
    <div className={cardClass}>
        <h3 className={sectionTitleClass}>
            <span className="w-2 h-2 bg-jways-500 rounded-full mr-2"></span>
            {t('calc.section.route')}
        </h3>
        <div className={grid}>

          {/* Row 1: Origin + Destination */}
          <div>
            <label className={lc}>{t('calc.label.origin')}</label>
            <div className={`${ic} bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-200 cursor-default flex items-center`}>
                <span className="mr-1.5">🇰🇷</span> South Korea
            </div>
          </div>

          <div>
            <label className={lc}>{t('calc.label.destination')}</label>
            <div className="relative">
                <select
                value={input.destinationCountry}
                onChange={(e) => {
                  const country = e.target.value;
                  onFieldChange('destinationCountry', country);
                  setZoneOverride(findZoneForCountry(country) || null);
                }}
                className={`${ic} appearance-none`}
                >
                {filteredCountries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                {selectChevron}
            </div>
          </div>

          {/* Row 2: Zone + Zip */}
          <div>
            <label className={lc}>{t('calc.label.zone')}</label>
            <div className="relative">
                <select
                value={selectedZone}
                onChange={(e) => {
                  const zone = e.target.value;
                  setZoneOverride(zone || null);
                  if (zone && zoneMap[zone]?.length) {
                    onFieldChange('destinationCountry', zoneMap[zone][0]);
                  }
                }}
                className={`${ic} appearance-none`}
                >
                  <option value="">{t('calc.label.zoneAll')}</option>
                  {zoneKeys.map(z => (
                    <option key={z} value={z}>{z} ({zoneMap[z].length} {t('calc.label.zoneCountries')})</option>
                  ))}
                </select>
                {selectChevron}
            </div>
          </div>

          <div>
            <label className={lc}>{t('calc.label.zip')}</label>
            <input
              type="text"
              value={input.destinationZip}
              onChange={(e) => onFieldChange('destinationZip', e.target.value)}
              className={ic}
              placeholder={zipHint.placeholder}
              pattern={zipHint.pattern}
              inputMode="text"
              autoComplete="postal-code"
            />
          </div>

          {/* Row 3: Carrier + Mode (fixed) */}
          <div>
            <label className={lc}>{t('calc.label.carrier')}</label>
            <div className="relative">
                <select
                value={input.overseasCarrier || 'UPS'}
                onChange={(e) => {
                  onFieldChange('overseasCarrier', e.target.value as QuoteInput['overseasCarrier']);
                  setZoneOverride(null);
                }}
                className={`${ic} appearance-none`}
                >
                  <option value="UPS">UPS</option>
                  <option value="DHL">DHL</option>
                </select>
                {selectChevron}
            </div>
          </div>

          <div>
            <label className={lc}>{t('calc.label.mode')}</label>
            <div className={`${ic} bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-200 cursor-default flex items-center`}>
                Door-to-Door
            </div>
          </div>


        </div>
    </div>
  );
};
