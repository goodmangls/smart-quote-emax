import React, { useState, useMemo } from 'react';
import {
  UPS_EXACT_RATES,
  UPS_RANGE_RATES,
  UPS_DOC_EXACT_RATES,
  UPS_DOC_MAX_KG,
} from '@/config/ups_tariff';
import {
  DHL_EXACT_RATES,
  DHL_RANGE_RATES,
  DHL_DOC_EXACT_RATES,
  DHL_DOC_MAX_KG,
} from '@/config/dhl_tariff';
import {
  FEDEX_EXACT_RATES,
  FEDEX_RANGE_RATES,
  FEDEX_ENVELOPE_EXACT_RATES,
  FEDEX_PAK_EXACT_RATES,
  FEDEX_ENVELOPE_MAX_KG,
  FEDEX_DOC_MAX_KG,
} from '@/config/fedex_tariff';
import { TableProperties, ChevronDown } from 'lucide-react';
import { formatNum } from '@/lib/format';

type Carrier = 'UPS' | 'DHL' | 'FEDEX';
type TableMode = 'exact' | 'range';
/** Unified product key — Parcel for all; Document for UPS/DHL; Envelope/Pak for FedEx */
type RateProduct = 'parcel' | 'document' | 'envelope' | 'pak';

type ExactRateTable = Record<string, Record<number, number>>;

const PRODUCT_OPTIONS: Record<Carrier, { value: RateProduct; label: string }[]> = {
  UPS: [
    { value: 'parcel', label: 'Parcel' },
    { value: 'document', label: `Document (≤${UPS_DOC_MAX_KG}kg)` },
  ],
  DHL: [
    { value: 'parcel', label: 'Parcel' },
    { value: 'document', label: `Document (≤${DHL_DOC_MAX_KG}kg)` },
  ],
  FEDEX: [
    { value: 'parcel', label: 'IP (Parcel)' },
    { value: 'envelope', label: `Envelope (≤${FEDEX_ENVELOPE_MAX_KG}kg)` },
    { value: 'pak', label: `Pak (≤${FEDEX_DOC_MAX_KG}kg)` },
  ],
};

function resolveExactRates(carrier: Carrier, product: RateProduct): ExactRateTable {
  if (carrier === 'FEDEX') {
    if (product === 'envelope') return FEDEX_ENVELOPE_EXACT_RATES;
    if (product === 'pak') return FEDEX_PAK_EXACT_RATES;
    return FEDEX_EXACT_RATES;
  }
  if (carrier === 'UPS') {
    return product === 'document' ? UPS_DOC_EXACT_RATES : UPS_EXACT_RATES;
  }
  return product === 'document' ? DHL_DOC_EXACT_RATES : DHL_EXACT_RATES;
}

function productLabel(carrier: Carrier, product: RateProduct): string {
  return PRODUCT_OPTIONS[carrier].find((o) => o.value === product)?.label ?? product;
}

export const RateTableViewer: React.FC = () => {
  const [carrier, setCarrier] = useState<Carrier>('UPS');
  const [mode, setMode] = useState<TableMode>('exact');
  const [selectedZone, setSelectedZone] = useState<string>('Z1');
  const [product, setProduct] = useState<RateProduct>('parcel');

  const exactRates = useMemo(() => resolveExactRates(carrier, product), [carrier, product]);

  const rangeRates: ReadonlyArray<{ min: number; max: number; rates: Record<string, number> }> =
    carrier === 'FEDEX' ? FEDEX_RANGE_RATES : carrier === 'UPS' ? UPS_RANGE_RATES : DHL_RANGE_RATES;

  const zones = useMemo(() => {
    return Object.keys(exactRates).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );
  }, [exactRates]);

  const activeZone = zones.includes(selectedZone) ? selectedZone : (zones[0] ?? selectedZone);

  const exactWeights = useMemo(() => {
    const zone = exactRates[activeZone];
    if (!zone) return [];
    return Object.entries(zone)
      .map(([w, r]) => ({ weight: Number(w), rate: r }))
      .sort((a, b) => a.weight - b.weight);
  }, [exactRates, activeZone]);

  const handleCarrierChange = (next: Carrier) => {
    setCarrier(next);
    setProduct('parcel');
    const nextExact = resolveExactRates(next, 'parcel');
    const nextZones = Object.keys(nextExact).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );
    setSelectedZone(nextZones[0] ?? 'Z1');
  };

  const handleProductChange = (next: RateProduct) => {
    setProduct(next);
    const nextExact = resolveExactRates(carrier, next);
    const nextZones = Object.keys(nextExact).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );
    if (!nextZones.includes(selectedZone)) {
      setSelectedZone(nextZones[0] ?? selectedZone);
    }
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm'>
      <div className='px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between gap-2 flex-wrap'>
        <div className='flex items-center gap-2'>
          <TableProperties className='w-4 h-4 text-emax-500' />
          <h4 className='text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider'>
            Rate Tables
          </h4>
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          <select
            value={carrier}
            onChange={(e) => handleCarrierChange(e.target.value as Carrier)}
            className='text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          >
            <option value='UPS'>UPS</option>
            <option value='DHL'>DHL</option>
            <option value='FEDEX'>FedEx</option>
          </select>
          {mode === 'exact' && (
            <select
              value={product}
              onChange={(e) => handleProductChange(e.target.value as RateProduct)}
              className='text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            >
              {PRODUCT_OPTIONS[carrier].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as TableMode)}
            className='text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          >
            <option value='exact'>Exact</option>
            <option value='range'>Range (per kg)</option>
          </select>
        </div>
      </div>

      {mode === 'exact' ? (
        <div>
          <div className='px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex gap-1 overflow-x-auto'>
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                  z === activeZone
                    ? 'bg-emax-100 text-emax-700 dark:bg-emax-900/30 dark:text-emax-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          <div className='max-h-[300px] overflow-y-auto'>
            <table className='w-full text-xs'>
              <thead className='sticky top-0 bg-gray-50 dark:bg-gray-700/50'>
                <tr>
                  <th className='text-left px-4 py-2 text-gray-500 dark:text-gray-400'>
                    Weight (kg)
                  </th>
                  <th className='text-right px-4 py-2 text-gray-500 dark:text-gray-400'>
                    Rate (KRW)
                  </th>
                  <th className='text-right px-4 py-2 text-gray-500 dark:text-gray-400'>Per kg</th>
                </tr>
              </thead>
              <tbody>
                {exactWeights.map(({ weight, rate }) => (
                  <tr
                    key={weight}
                    className='border-b border-gray-50 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/20'
                  >
                    <td className='px-4 py-1.5 font-medium text-gray-700 dark:text-gray-300'>
                      {weight}
                    </td>
                    <td className='px-4 py-1.5 text-right text-gray-900 dark:text-white tabular-nums'>
                      {formatNum(rate)}
                    </td>
                    <td className='px-4 py-1.5 text-right text-gray-500 dark:text-gray-400 tabular-nums'>
                      {formatNum(Math.round(rate / weight))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className='max-h-[350px] overflow-y-auto'>
          <table className='w-full text-xs'>
            <thead className='sticky top-0 bg-gray-50 dark:bg-gray-700/50'>
              <tr>
                <th className='text-left px-4 py-2 text-gray-500 dark:text-gray-400'>Range (kg)</th>
                {zones.map((z) => (
                  <th key={z} className='text-right px-2 py-2 text-gray-500 dark:text-gray-400'>
                    {z}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rangeRates.map((row, i) => {
                const min = row.min;
                const max = row.max;
                const rates = row.rates as Record<string, number>;
                return (
                  <tr
                    key={i}
                    className='border-b border-gray-50 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/20'
                  >
                    <td className='px-4 py-1.5 font-medium text-gray-700 dark:text-gray-300'>
                      {min}-{max}
                    </td>
                    {zones.map((z) => (
                      <td
                        key={z}
                        className='px-2 py-1.5 text-right text-gray-900 dark:text-white tabular-nums'
                      >
                        {rates[z] ? formatNum(rates[z]) : '-'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className='px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-1.5'>
        <ChevronDown className='w-3 h-3 text-gray-400' />
        <span className='text-[10px] text-gray-400 dark:text-gray-400'>
          {carrier} {mode === 'exact' ? productLabel(carrier, product) : 'Range'} •{' '}
          {mode === 'exact'
            ? `${activeZone}: ${exactWeights.length} weight steps`
            : `${rangeRates.length} weight ranges × ${zones.length} zones`}
        </span>
      </div>
    </div>
  );
};
