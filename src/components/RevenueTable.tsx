import React, { useState } from 'react';
import { RegionQuarterMatrix, SalesOrder } from '../types/sales';
import { formatCurrency } from '../utils/calculations';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronDown, Download, Table as TableIcon } from 'lucide-react';

interface RevenueTableProps {
  matrix: RegionQuarterMatrix;
  orders: SalesOrder[];
  highlightRegion?: string | null;
}

type SortField = 'region' | 'total' | 'q2_q3_diff' | string;

export const RevenueTable: React.FC<RevenueTableProps> = ({
  matrix,
  orders,
  highlightRegion,
}) => {
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const { regions, quarters, data, quarterTotals, regionTotals, grandTotal } = matrix;
  const hasQ2AndQ3 = quarters.includes('Q2') && quarters.includes('Q3');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort regions
  const sortedRegions = [...regions].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortField === 'region') {
      const cmp = a.localeCompare(b);
      return sortDirection === 'asc' ? cmp : -cmp;
    } else if (sortField === 'total') {
      valA = regionTotals[a] || 0;
      valB = regionTotals[b] || 0;
    } else if (sortField === 'q2_q3_diff') {
      valA = (data[a]?.['Q3'] || 0) - (data[a]?.['Q2'] || 0);
      valB = (data[b]?.['Q3'] || 0) - (data[b]?.['Q2'] || 0);
    } else if (quarters.includes(sortField)) {
      valA = data[a]?.[sortField] || 0;
      valB = data[b]?.[sortField] || 0;
    }

    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  // Calculate drill-down breakdown for expanded region
  const getRegionBreakdown = (region: string) => {
    const regionOrders = orders.filter(o => o.region.toLowerCase() === region.toLowerCase());
    const productStats: Record<string, { q2: number; q3: number; total: number; q2Units: number; q3Units: number }> = {};
    const channelStats: Record<string, { q2: number; q3: number; total: number }> = {};

    regionOrders.forEach(o => {
      // Products
      if (!productStats[o.product]) {
        productStats[o.product] = { q2: 0, q3: 0, total: 0, q2Units: 0, q3Units: 0 };
      }
      productStats[o.product].total += o.revenue;
      if (o.quarter === 'Q2') {
        productStats[o.product].q2 += o.revenue;
        productStats[o.product].q2Units += o.units;
      } else if (o.quarter === 'Q3') {
        productStats[o.product].q3 += o.revenue;
        productStats[o.product].q3Units += o.units;
      }

      // Channels
      if (!channelStats[o.channel]) {
        channelStats[o.channel] = { q2: 0, q3: 0, total: 0 };
      }
      channelStats[o.channel].total += o.revenue;
      if (o.quarter === 'Q2') channelStats[o.channel].q2 += o.revenue;
      else if (o.quarter === 'Q3') channelStats[o.channel].q3 += o.revenue;
    });

    return { productStats, channelStats };
  };

  const exportTableCsv = () => {
    const headers = ['Region', ...quarters, 'Total Revenue'];
    if (hasQ2AndQ3) {
      headers.push('Q2 to Q3 Dollar Delta', 'Q2 to Q3 % Delta');
    }

    const rows = sortedRegions.map(r => {
      const row = [r];
      quarters.forEach(q => row.push((data[r]?.[q] || 0).toString()));
      row.push((regionTotals[r] || 0).toString());

      if (hasQ2AndQ3) {
        const q2 = data[r]?.['Q2'] || 0;
        const q3 = data[r]?.['Q3'] || 0;
        const diff = q3 - q2;
        const pct = q2 !== 0 ? ((diff / q2) * 100).toFixed(1) : '100.0';
        row.push(diff.toString(), `${pct}%`);
      }
      return row.join(',');
    });

    // Grand total row
    const totalRow = ['Total', ...quarters.map(q => (quarterTotals[q] || 0).toString()), grandTotal.toString()];
    if (hasQ2AndQ3) {
      const q2Tot = quarterTotals['Q2'] || 0;
      const q3Tot = quarterTotals['Q3'] || 0;
      const totDiff = q3Tot - q2Tot;
      const totPct = q2Tot !== 0 ? ((totDiff / q2Tot) * 100).toFixed(1) : '100.0';
      totalRow.push(totDiff.toString(), `${totPct}%`);
    }
    rows.push(totalRow.join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revenue_by_region_and_quarter.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Revenue Cross-Tabulation Matrix
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>Quarterly Matrix</span>
            <span aria-hidden="true">·</span>
            <span>Tabular Figures</span>
            <span aria-hidden="true">·</span>
            <span>Click region for product &amp; channel drivers</span>
          </div>
        </div>

        <button
          type="button"
          onClick={exportTableCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          title="Export matrix as CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Matrix CSV</span>
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
              <th
                scope="col"
                onClick={() => handleSort('region')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Region</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {quarters.map(q => (
                <th
                  key={q}
                  scope="col"
                  onClick={() => handleSort(q)}
                  className={`py-3 px-4 text-right cursor-pointer hover:text-slate-900 whitespace-nowrap ${
                    q === 'Q2' || q === 'Q3' ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{q} Revenue</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}

              <th
                scope="col"
                onClick={() => handleSort('total')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 whitespace-nowrap font-bold"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {hasQ2AndQ3 && (
                <th
                  scope="col"
                  onClick={() => handleSort('q2_q3_diff')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 whitespace-nowrap bg-indigo-50/70 text-indigo-950 font-bold"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Q2 → Q3 Variance</span>
                    <ArrowUpDown className="w-3 h-3 text-indigo-600" />
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRegions.map(region => {
              const isHighlighted = highlightRegion === region;
              const isExpanded = expandedRegion === region;
              const q2Rev = data[region]?.['Q2'] || 0;
              const q3Rev = data[region]?.['Q3'] || 0;
              const q2q3Diff = q3Rev - q2Rev;
              const q2q3Pct = q2Rev !== 0 ? (q2q3Diff / q2Rev) * 100 : 0;
              const isDiffPositive = q2q3Diff >= 0;

              const breakdown = isExpanded ? getRegionBreakdown(region) : null;

              return (
                <React.Fragment key={region}>
                  <tr
                    onClick={() => setExpandedRegion(isExpanded ? null : region)}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      isHighlighted ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{region}</span>
                        {isHighlighted && (
                          <span className="text-[10px] text-amber-700 font-semibold px-1.5 py-0.2 rounded bg-amber-100">
                            Focal Variance
                          </span>
                        )}
                      </div>
                    </td>

                    {quarters.map(q => (
                      <td
                        key={q}
                        className={`py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap ${
                          q === 'Q2' || q === 'Q3' ? 'bg-indigo-50/20' : ''
                        }`}
                      >
                        {formatCurrency(data[region]?.[q] || 0)}
                      </td>
                    ))}

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(regionTotals[region] || 0)}
                    </td>

                    {hasQ2AndQ3 && (
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap bg-indigo-50/30">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDiffPositive ? (
                            <ArrowUp className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-rose-600" />
                          )}
                          <span className={isDiffPositive ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                            {isDiffPositive ? '+' : ''}{formatCurrency(q2q3Diff)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({isDiffPositive ? '+' : ''}{q2q3Pct.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Expanded Region Sub-View */}
                  {isExpanded && breakdown && (
                    <tr className="bg-slate-50/90 border-b border-slate-200">
                      <td colSpan={quarters.length + (hasQ2AndQ3 ? 3 : 2)} className="p-4 pl-10">
                        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-900">
                              Detailed Q2 → Q3 Shift for {region}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Units &amp; Revenue Breakdown
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Product Breakdown */}
                            <div>
                              <div className="text-xs font-semibold text-slate-700 mb-2">
                                Products in {region}
                              </div>
                              <div className="space-y-1.5">
                                {Object.entries(breakdown.productStats).map(([pName, pStat]) => {
                                  const pDiff = pStat.q3 - pStat.q2;
                                  const uDiff = pStat.q3Units - pStat.q2Units;
                                  return (
                                    <div
                                      key={pName}
                                      className="flex items-center justify-between p-2 rounded bg-slate-50 text-[11px]"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-900">{pName}</div>
                                        <div className="text-slate-500 font-mono">
                                          Units: {pStat.q2Units} (Q2) → {pStat.q3Units} (Q3) [{uDiff >= 0 ? '+' : ''}{uDiff}]
                                        </div>
                                      </div>
                                      <div className="text-right font-mono">
                                        <div className="font-bold text-slate-800">
                                          {formatCurrency(pStat.q3)}
                                        </div>
                                        <div className={`text-[10px] ${pDiff >= 0 ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}`}>
                                          {pDiff >= 0 ? '+' : ''}{formatCurrency(pDiff)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Channel Breakdown */}
                            <div>
                              <div className="text-xs font-semibold text-slate-700 mb-2">
                                Sales Channels in {region}
                              </div>
                              <div className="space-y-1.5">
                                {Object.entries(breakdown.channelStats).map(([cName, cStat]) => {
                                  const cDiff = cStat.q3 - cStat.q2;
                                  return (
                                    <div
                                      key={cName}
                                      className="flex items-center justify-between p-2 rounded bg-slate-50 text-[11px]"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-900">{cName}</div>
                                        <div className="text-slate-500 font-mono">
                                          Q2: {formatCurrency(cStat.q2)} · Q3: {formatCurrency(cStat.q3)}
                                        </div>
                                      </div>
                                      <div className="text-right font-mono">
                                        <div className={`font-semibold ${cDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                          {cDiff >= 0 ? '+' : ''}{formatCurrency(cDiff)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
              <td className="py-3 px-4">
                Company Total
              </td>
              {quarters.map(q => (
                <td key={q} className="py-3 px-4 text-right font-mono tabular-nums">
                  {formatCurrency(quarterTotals[q] || 0)}
                </td>
              ))}
              <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-950">
                {formatCurrency(grandTotal)}
              </td>
              {hasQ2AndQ3 && (
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {(() => {
                    const diff = (quarterTotals['Q3'] || 0) - (quarterTotals['Q2'] || 0);
                    const q2 = quarterTotals['Q2'] || 0;
                    const pct = q2 !== 0 ? (diff / q2) * 100 : 0;
                    return (
                      <span className={diff >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                      </span>
                    );
                  })()}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
