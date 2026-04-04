import React from 'react';
import { RefreshCw, Fuel, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { WidgetSkeleton } from '@/features/dashboard/components/WidgetSkeleton';
import { WidgetError } from '@/features/dashboard/components/WidgetError';
import { useJetFuelPrices } from '@/features/dashboard/hooks/useJetFuelPrices';

/** SVG-based sparkline chart for jet fuel price trend */
const PriceChart: React.FC<{ prices: { date: string; price: number }[] }> = ({
  prices,
}) => {
  if (prices.length < 2) return null;

  const W = 320;
  const H = 120;
  const PAD_X = 40;
  const PAD_Y = 16;

  const values = prices.map((p) => p.price);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 0.01;

  const toX = (i: number) =>
    PAD_X + (i / (prices.length - 1)) * (W - PAD_X * 2);
  const toY = (v: number) =>
    PAD_Y + (1 - (v - minVal) / range) * (H - PAD_Y * 2);

  const linePoints = prices.map((p, i) => `${toX(i)},${toY(p.price)}`).join(' ');

  const areaPoints = [
    `${toX(0)},${H - PAD_Y}`,
    ...prices.map((p, i) => `${toX(i)},${toY(p.price)}`),
    `${toX(prices.length - 1)},${H - PAD_Y}`,
  ].join(' ');

  const lastIdx = prices.length - 1;

  // X-axis labels: first, middle, last
  const labelIndices = [0, Math.floor(lastIdx / 2), lastIdx];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 120 }}
      aria-hidden="true"
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id="jetFuelGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Area */}
      <polygon points={areaPoints} fill="url(#jetFuelGrad)" />

      {/* Line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current price dot */}
      <circle
        cx={toX(lastIdx)}
        cy={toY(prices[lastIdx].price)}
        r={4}
        fill="#f59e0b"
        stroke="white"
        strokeWidth={2}
      />

      {/* Y-axis: min / max labels */}
      <text
        x={PAD_X - 4}
        y={PAD_Y + 4}
        textAnchor="end"
        className="fill-gray-400 dark:fill-gray-500"
        fontSize={9}
      >
        ${maxVal.toFixed(2)}
      </text>
      <text
        x={PAD_X - 4}
        y={H - PAD_Y + 4}
        textAnchor="end"
        className="fill-gray-400 dark:fill-gray-500"
        fontSize={9}
      >
        ${minVal.toFixed(2)}
      </text>

      {/* X-axis date labels */}
      {labelIndices.map((idx) => (
        <text
          key={idx}
          x={toX(idx)}
          y={H - 2}
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500"
          fontSize={8}
        >
          {prices[idx].date.slice(5)} {/* MM-DD */}
        </text>
      ))}
    </svg>
  );
};

export const JetFuelWidget: React.FC = () => {
  const { t } = useLanguage();
  const { data, loading, error, retry } = useJetFuelPrices(12);

  const current = data.length > 0 ? data[data.length - 1] : null;
  const previous = data.length > 1 ? data[data.length - 2] : null;

  const weekChange =
    current && previous ? current.price - previous.price : null;
  const trend: 'up' | 'down' | 'flat' =
    weekChange === null
      ? 'flat'
      : weekChange > 0.001
        ? 'up'
        : weekChange < -0.001
          ? 'down'
          : 'flat';

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
      : trend === 'down'
        ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
        : 'text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';

  return (
    <div className="bg-white dark:bg-jways-800 rounded-2xl shadow-sm border border-gray-100 dark:border-jways-700 overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center text-sm">
            <Fuel className="w-4 h-4 mr-2 text-amber-500" />
            {t('dashboard.jetFuel.title')}
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 ml-6">
            {t('dashboard.jetFuel.subtitle')}
          </p>
        </div>
        <button
          onClick={retry}
          className={`text-gray-400 hover:text-jways-500 dark:text-gray-400 dark:hover:text-jways-400 transition-colors ${loading ? 'animate-spin cursor-not-allowed' : ''}`}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading && data.length === 0 ? (
          <WidgetSkeleton lines={5} />
        ) : error && data.length === 0 ? (
          <WidgetError message={error} onRetry={retry} />
        ) : (
          <div className="space-y-4">
            {/* Current Price */}
            {current && (
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {t('dashboard.jetFuel.current')}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      ${current.price.toFixed(3)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {t('dashboard.jetFuel.perGal')}
                    </span>
                  </div>
                </div>
                {weekChange !== null && (
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {t('dashboard.jetFuel.weekChange')}
                    </span>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md mt-1 justify-end ${trendColor}`}
                    >
                      <TrendIcon className="w-3 h-3" />
                      <span className="tabular-nums">
                        {weekChange > 0 ? '+' : ''}
                        {weekChange.toFixed(3)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chart */}
            {data.length >= 2 && <PriceChart prices={data} />}

            {/* FSC Correlation Note */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg px-3 py-2">
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                {t('dashboard.jetFuel.fscNote')}
              </p>
            </div>

            {/* Source */}
            <div className="flex justify-end">
              <a
                href="https://www.eia.gov/petroleum/gasdiesel/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 hover:text-jways-500 dark:hover:text-jways-400 transition-colors"
              >
                {t('dashboard.jetFuel.source')}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
