import React, { useState } from 'react';
import type { FscHistoryEntry } from '@/config/fsc-history';

/* ──────────────────────────────── helpers ──────────────────────────────── */

/** Format date string for chart x-axis label */
function formatDateLabel(date: string): string {
  // DHL monthly: "2026-01" → "Jan"
  if (date.length === 7) {
    const [, m] = date.split('-');
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
      Number(m) - 1
    ];
  }
  // UPS weekly: "2026-01-05" → "1/5"
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/* ──────────────────────────────── types ──────────────────────────────── */

export interface ChartLine {
  entries: FscHistoryEntry[];
  color: string;
  label: string;
}

export interface FscChartProps {
  lines: ChartLine[];
}

/* ──────────────────────────────── constants ──────────────────────────── */

const CHART_W = 480;
const CHART_H = 150;
const PAD = { top: 12, right: 16, bottom: 28, left: 40 };

/* ──────────────────────────────── component ──────────────────────────── */

export const FscChart: React.FC<FscChartProps> = ({ lines }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    carrier: string;
    idx: number;
  } | null>(null);

  // Compute domain
  const allEntries = lines.flatMap((l) => l.entries);
  if (allEntries.length === 0) return null;

  const allRates = allEntries.map((e) => e.rate);
  const minRate = Math.floor(Math.min(...allRates) - 1);
  const maxRate = Math.ceil(Math.max(...allRates) + 1);
  const rateRange = maxRate - minRate || 1;

  // Sort all unique dates for shared x-axis
  const allDates = [...new Set(allEntries.map((e) => e.date))].sort();
  const dateCount = allDates.length;

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const xScale = (date: string) => {
    const idx = allDates.indexOf(date);
    return PAD.left + (dateCount > 1 ? (idx / (dateCount - 1)) * plotW : plotW / 2);
  };
  const yScale = (rate: number) => PAD.top + plotH - ((rate - minRate) / rateRange) * plotH;

  // Y-axis grid lines (4-5 ticks)
  const yTicks: number[] = [];
  const step = rateRange <= 5 ? 1 : rateRange <= 10 ? 2 : Math.ceil(rateRange / 5);
  for (let v = Math.ceil(minRate / step) * step; v <= maxRate; v += step) {
    yTicks.push(v);
  }

  // X-axis labels: pick ~6 evenly spaced
  const maxLabels = 6;
  const labelStep = Math.max(1, Math.floor(dateCount / maxLabels));
  const xLabels = allDates.filter((_, i) => i % labelStep === 0 || i === dateCount - 1);

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* grid lines */}
      {yTicks.map((v) => (
        <g key={`grid-${v}`}>
          <line
            x1={PAD.left}
            x2={CHART_W - PAD.right}
            y1={yScale(v)}
            y2={yScale(v)}
            className="stroke-gray-200 dark:stroke-gray-600"
            strokeWidth={0.5}
          />
          <text
            x={PAD.left - 4}
            y={yScale(v) + 3}
            textAnchor="end"
            className="fill-gray-400 dark:fill-gray-500"
            fontSize={8}
          >
            {v}%
          </text>
        </g>
      ))}

      {/* x-axis labels */}
      {xLabels.map((date) => (
        <text
          key={`x-${date}`}
          x={xScale(date)}
          y={CHART_H - 4}
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500"
          fontSize={7}
        >
          {formatDateLabel(date)}
        </text>
      ))}

      {/* lines + dots */}
      {lines.map((line) => {
        if (line.entries.length === 0) return null;
        const points = line.entries.map((e) => ({
          x: xScale(e.date),
          y: yScale(e.rate),
          ...e,
        }));
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        const lastPt = points[points.length - 1];

        return (
          <g key={line.label}>
            <path d={pathD} fill="none" stroke={line.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => {
              const isLast = i === points.length - 1;
              const isHovered =
                hoveredPoint?.carrier === line.label && hoveredPoint?.idx === i;
              return (
                <g key={`${line.label}-${i}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isLast ? 4 : isHovered ? 3.5 : 2.5}
                    fill={line.color}
                    stroke="white"
                    strokeWidth={isLast ? 1.5 : 1}
                    className="dark:stroke-gray-800 cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredPoint({ carrier: line.label, idx: i })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {isHovered && (
                    <g>
                      <rect
                        x={p.x - 24}
                        y={p.y - 20}
                        width={48}
                        height={14}
                        rx={3}
                        className="fill-gray-800 dark:fill-gray-200"
                        opacity={0.9}
                      />
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        fontSize={8}
                        fontWeight="bold"
                        className="fill-white dark:fill-gray-900"
                      >
                        {p.rate}%
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {/* current value label at last point */}
            <text
              x={lastPt.x + 6}
              y={lastPt.y + 3}
              fontSize={8}
              fontWeight="bold"
              fill={line.color}
            >
              {lastPt.rate}%
            </text>
          </g>
        );
      })}
    </svg>
  );
};
