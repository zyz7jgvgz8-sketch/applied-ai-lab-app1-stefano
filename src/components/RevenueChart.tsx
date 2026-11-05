import React, { useState, useMemo } from 'react';
import { RegionQuarterMatrix } from '../types/sales';
import { formatCurrency, formatCompactCurrency } from '../utils/calculations';
import { BarChart3, Layers, Filter } from 'lucide-react';

interface RevenueChartProps {
  matrix: RegionQuarterMatrix;
}

// Sophisticated palette for regions adhering to 60-30-10 rule (distinct, accessible hues)
const REGION_COLORS: string[] = [
  '#0284c7', // Sky / Azure
  '#0d9488', // Teal
  '#6366f1', // Indigo
  '#d97706', // Amber
  '#e11d48', // Rose
  '#8b5cf6', // Violet
  '#16a34a', // Emerald
];

const QUARTER_COLORS: string[] = [
  '#94a3b8', // Q1 slate
  '#38bdf8', // Q2 cyan
  '#4f46e5', // Q3 indigo
  '#0f172a', // Q4 dark slate
];

export const RevenueChart: React.FC<RevenueChartProps> = ({ matrix }) => {
  const [groupBy, setGroupBy] = useState<'quarter' | 'region'>('quarter');
  const [hoveredBar, setHoveredBar] = useState<{
    groupKey: string;
    itemKey: string;
    revenue: number;
    units: number;
    x: number;
    y: number;
  } | null>(null);

  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>([]);

  const { regions, quarters, data, unitsData, quarterTotals, regionTotals, grandTotal } = matrix;

  // Color mapping
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (groupBy === 'quarter') {
      regions.forEach((r, i) => {
        map[r] = REGION_COLORS[i % REGION_COLORS.length];
      });
    } else {
      quarters.forEach((q, i) => {
        map[q] = QUARTER_COLORS[i % QUARTER_COLORS.length];
      });
    }
    return map;
  }, [groupBy, regions, quarters]);

  // Items to display based on groupBy
  const groupKeys = groupBy === 'quarter' ? quarters : regions;
  const itemKeys = groupBy === 'quarter' ? regions : quarters;

  // Filter items if toggle is active
  const visibleItemKeys = itemKeys.filter(
    k => activeFilterKeys.length === 0 || activeFilterKeys.includes(k)
  );

  // SVG dimensions
  const svgWidth = 860;
  const svgHeight = 380;
  const margin = { top: 30, right: 30, bottom: 60, left: 75 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  // Calculate maximum revenue across all bars
  let maxRevenue = 0;
  groupKeys.forEach(g => {
    visibleItemKeys.forEach(item => {
      const rev = groupBy === 'quarter' ? (data[item]?.[g] || 0) : (data[g]?.[item] || 0);
      if (rev > maxRevenue) maxRevenue = rev;
    });
  });

  // Scale maximum to a clean round figure
  const roundMax = Math.max(1000, Math.ceil(maxRevenue * 1.15));

  // Y-axis tick intervals
  const yTicksCount = 5;
  const yTicks = Array.from({ length: yTicksCount + 1 }, (_, i) => (roundMax / yTicksCount) * i);

  // Band calculations
  const groupCount = groupKeys.length;
  const groupBandWidth = chartWidth / (groupCount || 1);
  const groupPadding = 0.25 * groupBandWidth;
  const availableGroupWidth = groupBandWidth - groupPadding;
  const barCount = visibleItemKeys.length || 1;
  const barGap = 3;
  const barWidth = Math.max(8, (availableGroupWidth - (barCount - 1) * barGap) / barCount);

  const toggleFilter = (key: string) => {
    setActiveFilterKeys(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const resetFilter = () => setActiveFilterKeys([]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Total Revenue by Region &amp; Quarter
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Aggregated Gross Sales</span>
            <span aria-hidden="true">·</span>
            <span>Tabular Figures</span>
            <span aria-hidden="true">·</span>
            <span>Total: {formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Group By Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">Group By:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                setGroupBy('quarter');
                setActiveFilterKeys([]);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                groupBy === 'quarter' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => {
                setGroupBy('region');
                setActiveFilterKeys([]);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                groupBy === 'region' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Region
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 font-medium">Filter Series:</span>
          {itemKeys.map(key => {
            const isExcluded = activeFilterKeys.length > 0 && !activeFilterKeys.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleFilter(key)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  isExcluded
                    ? 'border-dashed border-slate-200 text-slate-400 opacity-60'
                    : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colorMap[key] }}
                />
                <span className="font-medium">{key}</span>
              </button>
            );
          })}
          {activeFilterKeys.length > 0 && (
            <button
              type="button"
              onClick={resetFilter}
              className="text-xs text-slate-500 underline hover:text-slate-800 ml-1"
            >
              Reset
            </button>
          )}
        </div>

        {groupBy === 'quarter' && quarters.includes('Q2') && quarters.includes('Q3') && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            <span>Q2 → Q3 Focal Transition Highlighted</span>
          </div>
        )}
      </div>

      {/* SVG Chart Area */}
      <div className="relative mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[650px] select-none"
        >
          {/* Background grid lines */}
          {yTicks.map((val, idx) => {
            const y = margin.top + chartHeight - (val / roundMax) * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + chartWidth}
                  y2={y}
                  stroke={idx === 0 ? '#94a3b8' : '#f1f5f9'}
                  strokeWidth={idx === 0 ? '1.5' : '1'}
                  strokeDasharray={idx === 0 ? '' : '3 3'}
                />
                <text
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-mono fill-slate-400 tabular-nums"
                >
                  {formatCompactCurrency(val)}
                </text>
              </g>
            );
          })}

          {/* Q2-Q3 variance bridge line indicator if grouped by quarter */}
          {groupBy === 'quarter' && quarters.includes('Q2') && quarters.includes('Q3') && (
            (() => {
              const q2Idx = groupKeys.indexOf('Q2');
              const q3Idx = groupKeys.indexOf('Q3');
              if (q2Idx !== -1 && q3Idx !== -1) {
                const x1 = margin.left + q2Idx * groupBandWidth + groupBandWidth / 2;
                const x2 = margin.left + q3Idx * groupBandWidth + groupBandWidth / 2;
                return (
                  <g opacity="0.4">
                    <rect
                      x={x1 - groupBandWidth / 2 + groupPadding / 4}
                      y={margin.top}
                      width={x2 - x1 + groupBandWidth - groupPadding / 2}
                      height={chartHeight}
                      fill="#e0e7ff"
                      rx="4"
                    />
                  </g>
                );
              }
              return null;
            })()
          )}

          {/* Bar Groups */}
          {groupKeys.map((groupKey, gIdx) => {
            const groupStartX = margin.left + gIdx * groupBandWidth + groupPadding / 2;
            const groupCenterX = margin.left + gIdx * groupBandWidth + groupBandWidth / 2;

            return (
              <g key={groupKey}>
                {/* Bars */}
                {visibleItemKeys.map((itemKey, iIdx) => {
                  const rev = groupBy === 'quarter'
                    ? (data[itemKey]?.[groupKey] || 0)
                    : (data[groupKey]?.[itemKey] || 0);

                  const units = groupBy === 'quarter'
                    ? (unitsData[itemKey]?.[groupKey] || 0)
                    : (unitsData[groupKey]?.[itemKey] || 0);

                  const barHeight = roundMax > 0 ? (rev / roundMax) * chartHeight : 0;
                  const x = groupStartX + iIdx * (barWidth + barGap);
                  const y = margin.top + chartHeight - barHeight;

                  const isHovered = hoveredBar?.groupKey === groupKey && hoveredBar?.itemKey === itemKey;

                  return (
                    <rect
                      key={itemKey}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(0, barHeight)}
                      fill={colorMap[itemKey] || '#64748b'}
                      rx="2"
                      className="transition-all duration-150 cursor-pointer"
                      opacity={isHovered ? 1 : 0.9}
                      stroke={isHovered ? '#0f172a' : 'transparent'}
                      strokeWidth={isHovered ? '2' : '0'}
                      onMouseEnter={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBar({
                          groupKey,
                          itemKey,
                          revenue: rev,
                          units,
                          x: x + barWidth / 2,
                          y: y,
                        });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  );
                })}

                {/* X-axis group label */}
                <text
                  x={groupCenterX}
                  y={margin.top + chartHeight + 22}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-slate-800"
                >
                  {groupKey}
                </text>

                {/* Total label under group */}
                <text
                  x={groupCenterX}
                  y={margin.top + chartHeight + 38}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-400 tabular-nums"
                >
                  {groupBy === 'quarter'
                    ? formatCompactCurrency(quarterTotals[groupKey] || 0)
                    : formatCompactCurrency(regionTotals[groupKey] || 0)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Bar Hover */}
        {hoveredBar && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900 text-white p-2.5 rounded-md shadow-lg text-xs transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(hoveredBar.x / svgWidth) * 100}%`,
              top: `${(hoveredBar.y / svgHeight) * 100}%`,
            }}
          >
            <div className="font-semibold text-slate-100 flex items-center justify-between gap-3">
              <span>{groupBy === 'quarter' ? hoveredBar.itemKey : hoveredBar.groupKey}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {groupBy === 'quarter' ? hoveredBar.groupKey : hoveredBar.itemKey}
              </span>
            </div>
            <div className="mt-1 text-emerald-400 font-mono font-bold text-sm tabular-nums">
              {formatCurrency(hoveredBar.revenue)}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 font-mono tabular-nums">
              {hoveredBar.units.toLocaleString()} units sold
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <span>Click or hover on bars to inspect regional performance</span>
        <span className="font-mono tabular-nums">
          Quarters: {quarters.join(' · ')} | Regions: {regions.length}
        </span>
      </div>
    </div>
  );
};
