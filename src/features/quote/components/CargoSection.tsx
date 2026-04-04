import React, { useState } from 'react';
import { CargoItem } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, Plus, Box, Trash2, Copy } from 'lucide-react';
import { SURGE_THRESHOLDS } from '@/config/business-rules';
import { inputStyles } from './input-styles';

type UnitSystem = 'metric' | 'imperial';

const CM_PER_IN = 2.54;
const KG_PER_LB = 0.453592;

const toDisplay = (value: number, unit: UnitSystem, type: 'dim' | 'weight'): number => {
  if (unit === 'metric') return value;
  return type === 'dim' ? value / CM_PER_IN : value / KG_PER_LB;
};

const toInternal = (value: number, unit: UnitSystem, type: 'dim' | 'weight'): number => {
  if (unit === 'metric') return value;
  return type === 'dim' ? value * CM_PER_IN : value * KG_PER_LB;
};

const roundDisplay = (value: number): string => {
  if (!value) return '';
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString();
};

interface Props {
  items: CargoItem[];
  onChange: (items: CargoItem[]) => void;
  isMobileView: boolean;
}

const getItemWarnings = (item: CargoItem, unit: UnitSystem): string[] => {
  const warnings: string[] = [];
  const dims = [item.length, item.width, item.height].sort((a, b) => b - a);
  const longest = dims[0];
  const girth = longest + 2 * dims[1] + 2 * dims[2];

  const dimUnit = unit === 'metric' ? 'cm' : 'in';
  const wtUnit = unit === 'metric' ? 'kg' : 'lb';
  const fmtDim = (cm: number) => unit === 'metric' ? cm : Math.round(cm / CM_PER_IN * 10) / 10;
  const fmtWt = (kg: number) => unit === 'metric' ? kg : Math.round(kg / KG_PER_LB * 10) / 10;

  if (item.weight > SURGE_THRESHOLDS.AHS_WEIGHT_KG) {
    warnings.push(`Weight > ${fmtWt(SURGE_THRESHOLDS.AHS_WEIGHT_KG)}${wtUnit} — may need surge fee`);
  }
  if (longest > SURGE_THRESHOLDS.AHS_DIM_LONG_SIDE_CM) {
    warnings.push(`Length > ${fmtDim(SURGE_THRESHOLDS.AHS_DIM_LONG_SIDE_CM)}${dimUnit} — check AHS Dim`);
  }
  if (longest > SURGE_THRESHOLDS.MAX_LIMIT_LENGTH_CM || girth > SURGE_THRESHOLDS.MAX_LIMIT_GIRTH_CM) {
    warnings.push('Exceeds UPS max limits — verify with carrier');
  } else if (girth > SURGE_THRESHOLDS.LPS_LENGTH_GIRTH_CM) {
    warnings.push('Large Package girth — check surcharge');
  }
  return warnings;
};

export const CargoSection: React.FC<Props> = ({ items, onChange, isMobileView }) => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const { inputClass, cardClass } = inputStyles;
  const ic = inputClass(isMobileView);
  const { t } = useLanguage();

  const dimLabel = unitSystem === 'metric' ? 'cm' : 'in';
  const wtLabel = unitSystem === 'metric' ? 'kg' : 'lb';

  const addItem = () => {
    const lastItem = items[items.length - 1];
    const newItem: CargoItem = {
      id: crypto.randomUUID(),
      width: lastItem?.width || 0,
      length: lastItem?.length || 0,
      height: lastItem?.height || 0,
      weight: lastItem?.weight || 0,
      quantity: 1,
    };
    onChange([...items, newItem]);
  };

  const duplicateItem = (index: number) => {
    const source = items[index];
    const newItem: CargoItem = {
      ...source,
      id: crypto.randomUUID(),
    };
    const newItems = [...items];
    newItems.splice(index + 1, 0, newItem);
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems);
    }
  };

  const updateItem = (index: number, field: keyof CargoItem, value: number) => {
    const newItems = [...items];
    const safeValue = Math.max(0, isNaN(value) ? 0 : value);
    const clamped = field === 'quantity' ? Math.max(1, Math.round(safeValue)) : safeValue;
    const isDim = field === 'length' || field === 'width' || field === 'height';
    const isWeight = field === 'weight';
    const internalValue = isDim ? toInternal(clamped, unitSystem, 'dim')
      : isWeight ? toInternal(clamped, unitSystem, 'weight')
      : clamped;
    newItems[index] = { ...newItems[index], [field]: internalValue };
    onChange(newItems);
  };

  const cargoGrid = `grid grid-cols-12 gap-x-3 gap-y-3 ${!isMobileView ? 'sm:gap-2' : ''} items-end p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl transition-colors border border-gray-200 dark:border-gray-600/50 relative`;
  const cargoLabelClass = `block font-medium text-gray-500 dark:text-gray-400 mb-1 ${isMobileView ? 'text-sm' : 'text-xs'}`;

  const addBoxBtnClass = isMobileView
    ? "text-sm flex items-center bg-jways-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:bg-jways-700 active:scale-95 transition-all font-medium"
    : "text-xs flex items-center bg-jways-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-jways-700 active:scale-95 transition-all font-medium";

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
              <Package className="w-4 h-4 mr-2" />
              {t('calc.section.cargo')}
          </h3>
          <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs" role="group" aria-label="Unit system">
                <button
                  onClick={() => setUnitSystem('metric')}
                  aria-pressed={unitSystem === 'metric'}
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    unitSystem === 'metric'
                      ? 'bg-jways-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  cm / kg
                </button>
                <button
                  onClick={() => setUnitSystem('imperial')}
                  aria-pressed={unitSystem === 'imperial'}
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    unitSystem === 'imperial'
                      ? 'bg-jways-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  in / lb
                </button>
              </div>
              <button
                  onClick={addItem}
                  aria-label="Add cargo box"
                  className={addBoxBtnClass}
              >
                  <Plus className="w-3 h-3 mr-1" /> Add Box
              </button>
          </div>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const warnings = getItemWarnings(item, unitSystem);
          const hasZeroDims = item.length === 0 || item.width === 0 || item.height === 0 || item.weight === 0;

          return (
            <div key={item.id}>
              <div className={cargoGrid}>
                 <div className="absolute -top-3 left-3 bg-gray-50 dark:bg-gray-700 px-2 text-xs font-bold text-gray-400 flex items-center">
                      <Box className="w-3 h-3 mr-1" />
                      Box #{idx + 1}
                 </div>

                 {/* Quantity */}
                 <div className={`col-span-4 ${!isMobileView ? 'sm:col-span-2' : ''}`}>
                   <label className={cargoLabelClass}>Qty</label>
                   <input type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Math.max(1, Math.round(Number(e.target.value))))} className={`${ic} text-center`} inputMode="numeric" />
                 </div>

                 {/* Weight */}
                 <div className={`col-span-6 ${!isMobileView ? 'sm:col-span-3 sm:order-last md:order-none' : ''}`}>
                   <label className={cargoLabelClass}>Weight ({wtLabel})</label>
                   <input
                     type="number" step="0.1" min="0.1"
                     value={roundDisplay(toDisplay(item.weight, unitSystem, 'weight'))}
                     onChange={(e) => updateItem(idx, 'weight', Number(e.target.value))}
                     className={`${ic} ${item.weight > SURGE_THRESHOLDS.AHS_WEIGHT_KG ? 'ring-1 ring-amber-400 dark:ring-amber-600' : ''}`}
                     inputMode="decimal"
                     placeholder={wtLabel}
                   />
                 </div>

                 {/* Actions — Duplicate + Trash */}
                 <div className={`col-span-2 ${!isMobileView ? 'sm:col-span-1' : ''} flex justify-end items-end gap-0.5 pb-1`}>
                   <button
                      onClick={() => duplicateItem(idx)}
                      className={`text-gray-400 hover:text-jways-600 dark:hover:text-jways-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors ${isMobileView ? 'p-2.5' : 'p-1.5'}`}
                      aria-label="Duplicate this box"
                   >
                      <Copy className={`${isMobileView ? 'w-5 h-5' : 'w-4 h-4'}`} />
                   </button>
                   <button
                      onClick={() => removeItem(idx)}
                      className={`text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${isMobileView ? 'p-2.5' : 'p-1.5'} ${items.length === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      disabled={items.length === 1}
                      aria-label={items.length === 1 ? 'At least one box required' : 'Remove this box'}
                   >
                      <Trash2 className={`${isMobileView ? 'w-5 h-5' : 'w-4 h-4'}`} />
                   </button>
                 </div>

                 {/* Dimensions */}
                 <div className={`col-span-4 ${!isMobileView ? 'sm:col-span-2' : ''}`}>
                   <label className={cargoLabelClass}>L ({dimLabel})</label>
                   <input
                     type="number" step="0.1" min="0.1"
                     value={roundDisplay(toDisplay(item.length, unitSystem, 'dim'))}
                     onChange={(e) => updateItem(idx, 'length', Number(e.target.value))}
                     className={`${ic} ${item.length > SURGE_THRESHOLDS.AHS_DIM_LONG_SIDE_CM ? 'ring-1 ring-amber-400 dark:ring-amber-600' : ''}`}
                     inputMode="decimal"
                     placeholder={dimLabel}
                   />
                 </div>
                 <div className={`col-span-4 ${!isMobileView ? 'sm:col-span-2' : ''}`}>
                   <label className={cargoLabelClass}>W ({dimLabel})</label>
                   <input
                     type="number" step="0.1" min="0.1"
                     value={roundDisplay(toDisplay(item.width, unitSystem, 'dim'))}
                     onChange={(e) => updateItem(idx, 'width', Number(e.target.value))}
                     className={ic}
                     inputMode="decimal"
                     placeholder={dimLabel}
                   />
                 </div>
                 <div className={`col-span-4 ${!isMobileView ? 'sm:col-span-2' : ''}`}>
                   <label className={cargoLabelClass}>H ({dimLabel})</label>
                   <input
                     type="number" step="0.1" min="0.1"
                     value={roundDisplay(toDisplay(item.height, unitSystem, 'dim'))}
                     onChange={(e) => updateItem(idx, 'height', Number(e.target.value))}
                     className={ic}
                     inputMode="decimal"
                     placeholder={dimLabel}
                   />
                 </div>

              </div>

              {/* Inline warnings */}
              {(warnings.length > 0 || hasZeroDims) && (
                <div className="mt-1.5 space-y-0.5">
                  {hasZeroDims && (
                    <p className="text-xs text-gray-400 dark:text-gray-400 pl-1">
                      Fill in all dimensions and weight to calculate
                    </p>
                  )}
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-400 pl-1 flex items-center">
                      <span className="w-1 h-1 bg-amber-500 rounded-full mr-1.5 flex-shrink-0"></span>
                      {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
