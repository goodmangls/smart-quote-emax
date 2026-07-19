import React, { useState, useCallback, useMemo } from 'react';
import { FscRates } from '@/api/fscApi';
import {
  DEFAULT_FSC_PERCENT,
  DEFAULT_FSC_PERCENT_DHL,
  DEFAULT_FSC_PERCENT_FEDEX,
  DEFAULT_FSC_PERCENT_OCS,
  FEDEX_FSC_URL,
} from '@/config/rates';
import { EMAX_FSC_PER_KG } from '@/config/emax_tariff';
import { Fuel, ExternalLink, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  FscHistoryData,
  FscHistoryEntry,
  FscCarrier,
  loadFscHistory,
  saveFscHistory,
  addFscEntry,
  removeFscEntry,
} from '@/config/fsc-history';
import { FscChart } from './FscChart';

/* ──────────────────────────────── main widget ───────────────────────────── */

interface FscRateWidgetProps {
  /** When true, history add/delete controls are hidden. */
  readOnly?: boolean;
}

export const FscRateWidget: React.FC<FscRateWidgetProps> = ({ readOnly = false }) => {
  // rates.ts is the single source of truth for FSC (DB auto-apply disabled)
  const data: FscRates = useMemo(
    () => ({
      rates: {
        UPS: { international: DEFAULT_FSC_PERCENT, domestic: DEFAULT_FSC_PERCENT },
        DHL: { international: DEFAULT_FSC_PERCENT_DHL, domestic: DEFAULT_FSC_PERCENT_DHL },
        FEDEX: { international: DEFAULT_FSC_PERCENT_FEDEX, domestic: DEFAULT_FSC_PERCENT_FEDEX },
        OCS: { international: DEFAULT_FSC_PERCENT_OCS, domestic: DEFAULT_FSC_PERCENT_OCS },
      },
      updatedAt: new Date().toISOString(),
    }),
    [],
  );

  // History state
  const [history, setHistory] = useState<FscHistoryData>(() => loadFscHistory());
  const [showHistory, setShowHistory] = useState(false);

  // Add-entry form state
  const [addCarrier, setAddCarrier] = useState<FscCarrier>('ups');
  const [addDate, setAddDate] = useState('');
  const [addRate, setAddRate] = useState('');

  const carrierLinks: Record<string, string | null> = {
    UPS: 'https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page',
    DHL: 'https://mydhl.express.dhl/kr/ko/ship/surcharges.html',
    FEDEX: FEDEX_FSC_URL,
    OCS: null, // Official OCS FSC URL not published
  };

  // History handlers
  const persistHistory = useCallback((next: FscHistoryData) => {
    setHistory(next);
    saveFscHistory(next);
  }, []);

  const handleAddEntry = () => {
    if (!addDate || !addRate) return;
    const rateNum = parseFloat(addRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) return;

    const entry: FscHistoryEntry = { date: addDate, rate: rateNum };
    const next = addFscEntry(history, addCarrier, entry);
    persistHistory(next);
    setAddDate('');
    setAddRate('');
  };

  const handleRemoveEntry = (carrier: FscCarrier, date: string) => {
    const next = removeFscEntry(history, carrier, date);
    persistHistory(next);
  };

  // Chart lines
  const chartLines = useMemo(
    () => [
      { entries: history.ups, color: '#3b82f6', label: 'UPS' },
      { entries: history.dhl, color: '#f59e0b', label: 'DHL' },
      { entries: history.fedex, color: '#f97316', label: 'FedEx' },
      { entries: history.ocs, color: '#10b981', label: 'OCS' },
    ],
    [history],
  );

  const latestUps = history.ups.length > 0 ? history.ups[history.ups.length - 1].rate : null;
  const latestDhl = history.dhl.length > 0 ? history.dhl[history.dhl.length - 1].rate : null;
  const latestFedex =
    history.fedex.length > 0 ? history.fedex[history.fedex.length - 1].rate : null;
  const latestOcs = history.ocs.length > 0 ? history.ocs[history.ocs.length - 1].rate : null;

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm'>
      <div className='px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Fuel className='w-4 h-4 text-emax-500' />
          <h4 className='text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider'>
            FSC Rates (International)
          </h4>
        </div>
      </div>

      {data ? (
        <div>
          {/* Percentage carriers — 2×2 grid to fill horizontal space */}
          <div className='grid grid-cols-2'>
            {(['UPS', 'DHL', 'FEDEX', 'OCS'] as const).map((carrier, index) => {
              const rates = data.rates[carrier];
              const link = carrierLinks[carrier];
              const isLeftCol = index % 2 === 0;
              const isTopRow = index < 2;

              return (
                <div
                  key={carrier}
                  className={[
                    'px-4 py-3',
                    isLeftCol ? 'border-r border-gray-100 dark:border-gray-700' : '',
                    isTopRow ? 'border-b border-gray-100 dark:border-gray-700' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='text-xs font-bold text-gray-900 dark:text-white'>
                      {carrier}
                    </span>
                    {link ? (
                      <a
                        href={link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-gray-400 hover:text-emax-500 transition-colors'
                        title={`${carrier} 공식 연료 할증료 페이지 열기`}
                      >
                        <ExternalLink className='w-3.5 h-3.5' />
                      </a>
                    ) : null}
                  </div>
                  <p className='text-xl font-bold text-gray-900 dark:text-white'>
                    {rates.international.toFixed(2)}%
                  </p>
                </div>
              );
            })}
          </div>

          {/* EMAX — full-width row (per-kg, not percentage. CN/VN only.) */}
          <div className='px-4 py-3 border-t border-gray-100 dark:border-gray-700'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-xs font-bold text-gray-900 dark:text-white'>EMAX</span>
              <span className='text-[10px] text-gray-400'>per-kg · CN/VN only</span>
            </div>
            <p className='text-base font-bold text-gray-900 dark:text-white'>
              CN {EMAX_FSC_PER_KG.CN.toLocaleString()}원/kg
              <span className='text-gray-400 mx-2'>·</span>
              VN {EMAX_FSC_PER_KG.VN.toLocaleString()}원/kg
            </p>
          </div>
        </div>
      ) : (
        <div className='p-6 text-center text-xs text-gray-400'>Failed to load rates</div>
      )}

      {/* ────────────── Historical Chart Section ────────────── */}
      <div className='border-t border-gray-100 dark:border-gray-700'>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className='w-full px-4 py-2 flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors'
        >
          <span>History</span>
          {showHistory ? (
            <ChevronUp className='w-3.5 h-3.5' />
          ) : (
            <ChevronDown className='w-3.5 h-3.5' />
          )}
        </button>

        {showHistory && (
          <div className='px-4 pb-4 space-y-3'>
            {/* SVG Chart */}
            <div className='rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 p-2'>
              <FscChart lines={chartLines} />
            </div>

            {/* Legend */}
            <div className='flex items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400'>
              <div className='flex items-center gap-1.5'>
                <span className='inline-block w-2.5 h-2.5 rounded-full bg-blue-500' />
                <span>UPS (Weekly){latestUps !== null ? ` — ${latestUps.toFixed(2)}%` : ''}</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='inline-block w-2.5 h-2.5 rounded-full bg-amber-500' />
                <span>DHL (Weekly){latestDhl !== null ? ` — ${latestDhl.toFixed(2)}%` : ''}</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='inline-block w-2.5 h-2.5 rounded-full bg-orange-500' />
                <span>FedEx {latestFedex !== null ? ` — ${latestFedex.toFixed(2)}%` : ''}</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='inline-block w-2.5 h-2.5 rounded-full bg-emerald-500' />
                <span>OCS {latestOcs !== null ? ` — ${latestOcs.toFixed(2)}%` : ''}</span>
              </div>
            </div>

            {/* Update frequency notes */}
            <div className='text-[10px] text-gray-400 dark:text-gray-500 space-y-0.5'>
              <p>UPS: 매주 월요일 갱신 (Weekly, every Monday)</p>
              <p>DHL: 매주 월요일 갱신 (Weekly, every Monday — 2026-04경 Monthly→Weekly 전환)</p>
              <p>FedEx: 매주 월요일 갱신 (Weekly, every Monday)</p>
              <p>OCS: 비정기 갱신 (Ad-hoc — 변경 시점에만 기록)</p>
            </div>

            {!readOnly && (
              <div className='rounded-lg border border-gray-200 dark:border-gray-600 p-3 space-y-2'>
                <p className='text-[10px] font-semibold text-gray-600 dark:text-gray-300'>
                  Add History Entry
                </p>
                <div className='flex flex-wrap items-end gap-2'>
                  <div>
                    <label
                      htmlFor='fsc-history-carrier'
                      className='block text-[10px] text-gray-400 mb-0.5'
                    >
                      Carrier
                    </label>
                    <select
                      id='fsc-history-carrier'
                      value={addCarrier}
                      onChange={(e) => setAddCarrier(e.target.value as FscCarrier)}
                      className='px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    >
                      <option value='ups'>UPS</option>
                      <option value='dhl'>DHL</option>
                      <option value='fedex'>FedEx</option>
                      <option value='ocs'>OCS</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor='fsc-history-date'
                      className='block text-[10px] text-gray-400 mb-0.5'
                    >
                      Date (YYYY-MM-DD)
                    </label>
                    <input
                      id='fsc-history-date'
                      type='date'
                      value={addDate}
                      onChange={(e) => setAddDate(e.target.value)}
                      className='px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='fsc-history-rate'
                      className='block text-[10px] text-gray-400 mb-0.5'
                    >
                      Rate (%)
                    </label>
                    <input
                      id='fsc-history-rate'
                      type='number'
                      step='0.25'
                      min={0}
                      max={100}
                      value={addRate}
                      onChange={(e) => setAddRate(e.target.value)}
                      placeholder='38.50'
                      className='w-20 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    />
                  </div>
                  <button
                    onClick={handleAddEntry}
                    disabled={!addDate || !addRate}
                    className='flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-emax-600 hover:bg-emax-700 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors'
                  >
                    <Plus className='w-3 h-3' />
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className='max-h-40 overflow-y-auto space-y-1'>
              {(['ups', 'dhl', 'fedex', 'ocs'] as const).map((carrier) => (
                <div key={carrier}>
                  <p className='text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-0.5'>
                    {carrier}
                  </p>
                  {history[carrier].map((entry) => (
                    <div
                      key={`${carrier}-${entry.date}`}
                      className='flex items-center justify-between py-0.5 px-1 text-[10px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded'
                    >
                      <span>
                        {entry.date} — {entry.rate.toFixed(2)}%
                      </span>
                      {!readOnly && (
                        <button
                          onClick={() => handleRemoveEntry(carrier, entry.date)}
                          className='text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors'
                          title='Delete entry'
                          aria-label={`Delete ${carrier} entry ${entry.date}`}
                        >
                          <Trash2 className='w-3 h-3' />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data && (
        <div className='px-4 py-2 border-t border-gray-100 dark:border-gray-700'>
          <span className='text-[10px] text-gray-400 dark:text-gray-400'>
            Source: rates.ts (single source of truth)
          </span>
        </div>
      )}
    </div>
  );
};
