import React from 'react';
import { CargoItem, PackingType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Info, Package } from 'lucide-react';
import { normalizeFedexRates, calcAddonFee } from '@/config/addon-utils';
import type { AddonRate } from '@/api/addonRateApi';
import {
  FEDEX_MIN_CHARGEABLE_WEIGHT_KG,
  isFedexAhsDimension,
  isFedexAhsPackaging,
  isFedexAhsWeight,
  isFedexOversize,
  isFedexUnauthorized,
  calculateFedexDeclaredValueFee,
} from '@/config/fedex_addons';
import { applyPackingDimensions } from '@/lib/packing-utils';

interface Props {
  selectedAddOns: string[];
  onAddOnsChange: (codes: string[]) => void;
  declaredValue: number;
  onDeclaredValueChange: (value: number) => void;
  items: CargoItem[];
  packingType: PackingType;
  billableWeight: number;
  isMobileView: boolean;
  dbRates?: AddonRate[];
  destinationCountry?: string;
}

/** FedEx add-on UI — rates exclusively from normalizeFedexRates / fedex_addons. */
export const FedExAddOnPanel: React.FC<Props> = ({
  selectedAddOns,
  onAddOnsChange,
  declaredValue,
  onDeclaredValueChange,
  items,
  packingType,
  billableWeight,
  isMobileView,
  dbRates,
  destinationCountry,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const rates = React.useMemo(() => normalizeFedexRates(dbRates), [dbRates]);
  const rateOf = React.useCallback((code: string) => rates.find((r) => r.code === code), [rates]);

  /**
   * Auto-detected 비표준화물, resolved exactly as the calculator does: per package,
   * highest fee only. Listing every matched criterion would imply they stack.
   */
  const detected = React.useMemo(() => {
    const winners = new Map<string, number>();
    items.forEach((item) => {
      const { l, w, h, weight } = applyPackingDimensions(
        item.length,
        item.width,
        item.height,
        item.weight,
        packingType,
      );
      const codes: string[] = [];
      if (isFedexAhsDimension(l, w, h)) codes.push('AHD');
      if (isFedexAhsWeight(weight)) codes.push('AHW');
      if (isFedexAhsPackaging(packingType)) codes.push('AHP');
      if (isFedexOversize(l, w, h, weight)) codes.push('OVR');
      if (isFedexUnauthorized(l, w, h, weight)) codes.push('UNA');
      if (codes.length === 0) return;

      const winner = codes.reduce((a, b) =>
        (rateOf(b)?.amount ?? 0) > (rateOf(a)?.amount ?? 0) ? b : a,
      );
      winners.set(winner, (winners.get(winner) ?? 0) + item.quantity);
    });
    return [...winners.entries()].map(([code, count]) => ({ code, count, rate: rateOf(code) }));
  }, [items, packingType, rateOf]);

  const minChargeableApplies = React.useMemo(
    () =>
      items.some((item) => {
        const { l, w, h } = applyPackingDimensions(
          item.length,
          item.width,
          item.height,
          item.weight,
          packingType,
        );
        return isFedexAhsDimension(l, w, h);
      }),
    [items, packingType],
  );

  const selectableAddOns = rates.filter((r) => r.selectable);

  const toggleAddOn = (code: string) => {
    onAddOnsChange(
      selectedAddOns.includes(code)
        ? selectedAddOns.filter((c) => c !== code)
        : [...selectedAddOns, code],
    );
  };

  const declaredValueFee = calculateFedexDeclaredValueFee(declaredValue);

  const totalSelected = React.useMemo(() => {
    const sum = selectedAddOns.reduce((acc, code) => {
      const rate = rateOf(code);
      if (!rate) return acc;
      if (code === 'DIC' && selectedAddOns.some((c) => c === 'DGA' || c === 'DGI')) return acc;
      return acc + calcAddonFee(rate, billableWeight, 0);
    }, 0);
    return sum + declaredValueFee;
  }, [selectedAddOns, billableWeight, declaredValueFee, rateOf]);

  return (
    <div className="col-span-full">
      <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span
            className={`font-semibold text-purple-700 dark:text-purple-300 ${isMobileView ? 'text-base' : 'text-sm'}`}
          >
            FedEx {isEn ? 'Add-on Services' : '부가서비스'}
          </span>
          {dbRates && dbRates.length > 0 && (
            <span className="text-[9px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
              DB
            </span>
          )}
          {totalSelected > 0 && (
            <span className="ml-auto text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
              +{totalSelected.toLocaleString()} KRW
            </span>
          )}
        </div>

        {detected.length > 0 && (
          <div className="mb-3 rounded-lg bg-purple-100/70 dark:bg-purple-900/20 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-purple-800 dark:text-purple-200 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {isEn ? 'Non-standard handling (auto-detected)' : '비표준화물 (자동 감지)'}
            </div>
            <ul className="space-y-0.5 text-purple-900/90 dark:text-purple-100/90">
              {detected.map(({ code, count, rate }) => (
                <li key={code} className="flex justify-between gap-2">
                  <span>
                    {isEn ? rate?.nameEn : rate?.nameKo}
                    {count > 1 && ` × ${count}`}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {((rate?.amount ?? 0) * count).toLocaleString()} KRW
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-purple-800/80 dark:text-purple-200/80">
              {isEn
                ? 'FedEx charges only the highest of these per package, never the sum.'
                : '한 패키지가 여러 기준에 해당하면 FedEx는 가장 높은 요금 하나만 부과합니다 (합산 아님).'}
            </p>
          </div>
        )}

        {minChargeableApplies && (
          <div className="mb-3 rounded-lg bg-amber-100/70 dark:bg-amber-900/20 p-2.5 text-xs text-amber-900 dark:text-amber-100">
            <div className="flex items-center gap-1.5 font-semibold mb-0.5">
              <Info className="w-3.5 h-3.5" />
              {isEn
                ? `Minimum chargeable weight ${FEDEX_MIN_CHARGEABLE_WEIGHT_KG}kg`
                : `최소 청구 중량 ${FEDEX_MIN_CHARGEABLE_WEIGHT_KG}kg`}
            </div>
            {isEn
              ? 'A package meeting the Additional Handling – Dimension criteria is rated at no less than 18kg, which changes the base tariff — not just this surcharge.'
              : '추가 취급 요금 – 용적 기준에 해당하는 패키지는 18kg 미만으로 청구되지 않습니다. 부가요금뿐 아니라 기본 요율 조회가 바뀝니다.'}
          </div>
        )}

        {destinationCountry === 'US' && (
          <div className="mb-3 rounded-lg bg-gray-100 dark:bg-gray-800 p-2.5 text-xs text-gray-700 dark:text-gray-300">
            {isEn
              ? 'U.S. Import Processing Fee (3,900 KRW) is applied automatically for U.S. destinations.'
              : '미국 도착 화물에는 미국 수입 처리 수수료 3,900원이 자동 적용됩니다.'}
          </div>
        )}

        <div className={`grid ${isMobileView ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5`}>
          {selectableAddOns.map((addon) => {
            const isSelected = selectedAddOns.includes(addon.code);
            return (
              <label
                key={addon.code}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-xs ${
                  isSelected
                    ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleAddOn(addon.code)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-medium truncate ${isSelected ? 'text-purple-800 dark:text-purple-200' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {isEn ? addon.nameEn : addon.nameKo}
                    </span>
                    <span
                      className={`shrink-0 tabular-nums ${isSelected ? 'text-purple-700 dark:text-purple-300 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {calcAddonFee(addon, billableWeight, 0).toLocaleString()}
                    </span>
                  </div>
                  {addon.condition && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {addon.condition}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isEn ? 'Declared Value (KRW)' : '운송 신고 금액 (원)'}
          </label>
          <input
            type="number"
            min={0}
            step={10_000}
            value={declaredValue || ''}
            onChange={(e) => onDeclaredValueChange(Number(e.target.value) || 0)}
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-1.5 text-sm"
          />
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {isEn
              ? 'Free up to 115,000 KRW; 1,420 KRW per 115,000 KRW step above it.'
              : '115,000원까지 무료, 초과분은 115,000원당 1,420원(끝자리 절상).'}
            {declaredValueFee > 0 && (
              <span className="ml-1 font-semibold text-purple-700 dark:text-purple-300">
                +{declaredValueFee.toLocaleString()} KRW
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
