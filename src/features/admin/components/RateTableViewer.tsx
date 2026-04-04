import React, { useState, useMemo } from 'react';
import { UPS_EXACT_RATES, UPS_RANGE_RATES } from '@/config/ups_tariff';
import { DHL_EXACT_RATES, DHL_RANGE_RATES } from '@/config/dhl_tariff';
import { TableProperties, ChevronDown } from 'lucide-react';
import { formatNum } from '@/lib/format';

type Carrier = 'UPS' | 'DHL';
type TableMode = 'exact' | 'range';

export const RateTableViewer: React.FC = () => {
  const [carrier, setCarrier] = useState<Carrier>('UPS');
  const [mode, setMode] = useState<TableMode>('exact');
  const [selectedZone, setSelectedZone] = useState<string>('Z1');

  const exactRates = carrier === 'UPS' ? UPS_EXACT_RATES : DHL_EXACT_RATES;
  const rangeRates = carrier === 'UPS' ? UPS_RANGE_RATES : DHL_RANGE_RATES;

  const zones = useMemo(() => {
    return Object.keys(exactRates).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [exactRates]);

  const exactWeights = useMemo(() => {
    const zone = exactRates[selectedZone];
    if (!zone) return [];
    return Object.entries(zone)
      .map(([w, r]) => ({ weight: Number(w), rate: r }))
      .sort((a, b) => a.weight - b.weight);
  }, [exactRates, selectedZone]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableProperties className="w-4 h-4 text-jways-500" />
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
            Rate Tables
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as Carrier)}
            className="text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="UPS">UPS</option>
            <option value="DHL">DHL</option>
          </select>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as TableMode)}
            className="text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="exact">Exact (0.5-20kg)</option>
            <option value="range">Range (&gt;20kg)</option>
          </select>
        </div>
      </div>

      {mode === 'exact' ? (
        <div>
          {/* Zone tabs */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex gap-1 overflow-x-auto">
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                  z === selectedZone
                    ? 'bg-jways-100 text-jways-700 dark:bg-jways-900/30 dark:text-jways-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Rate grid */}
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400">Weight (kg)</th>
                  <th className="text-right px-4 py-2 text-gray-500 dark:text-gray-400">Rate (KRW)</th>
                  <th className="text-right px-4 py-2 text-gray-500 dark:text-gray-400">Per kg</th>
                </tr>
              </thead>
              <tbody>
                {exactWeights.map(({ weight, rate }) => (
                  <tr key={weight} className="border-b border-gray-50 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <td className="px-4 py-1.5 font-medium text-gray-700 dark:text-gray-300">{weight}</td>
                    <td className="px-4 py-1.5 text-right text-gray-900 dark:text-white tabular-nums">{formatNum(rate)}</td>
                    <td className="px-4 py-1.5 text-right text-gray-500 dark:text-gray-400 tabular-nums">{formatNum(Math.round(rate / weight))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="max-h-[350px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400">Range (kg)</th>
                {zones.map((z) => (
                  <th key={z} className="text-right px-2 py-2 text-gray-500 dark:text-gray-400">{z}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rangeRates.map((row, i) => {
                const r = row as Record<string, unknown>;
                const min = r.min_weight as number;
                const max = r.max_weight as number;
                return (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <td className="px-4 py-1.5 font-medium text-gray-700 dark:text-gray-300">{min}-{max}</td>
                    {zones.map((z) => {
                      const rates = r.rates as Record<string, number>;
                      return (
                        <td key={z} className="px-2 py-1.5 text-right text-gray-900 dark:text-white tabular-nums">
                          {rates[z] ? formatNum(rates[z]) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
        <ChevronDown className="w-3 h-3 text-gray-400" />
        <span className="text-[10px] text-gray-400 dark:text-gray-400">
          {carrier} tariff table • {mode === 'exact' ? `${selectedZone}: ${exactWeights.length} weight steps` : `${rangeRates.length} weight ranges × ${zones.length} zones`}
        </span>
      </div>
    </div>
  );
};
