import React from 'react';
import { RegionVarianceAnalysis, SummaryCalculationFacts } from '../types/sales';
import { formatCurrency } from '../utils/calculations';
import { ShieldCheck, Calculator, ArrowUp, ArrowDown } from 'lucide-react';

interface CalculationAuditProps {
  analyses: RegionVarianceAnalysis[];
  facts: SummaryCalculationFacts | null;
  onSelectRegion?: (region: string) => void;
}

export const CalculationAudit: React.FC<CalculationAuditProps> = ({
  analyses,
  facts,
  onSelectRegion,
}) => {
  if (!facts || analyses.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500 text-sm">
        No Q2 and Q3 data available to calculate variance rankings.
      </div>
    );
  }

  const { mostChangedRegion, totalQ2Revenue, totalQ3Revenue } = facts;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Deterministic Calculation Audit &amp; Provenance
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>AI Numbers Verified Against Deterministic Source</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">Company Total Q2 Revenue</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              {formatCurrency(totalQ2Revenue)}
            </span>
          </div>
          <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">Company Total Q3 Revenue</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              {formatCurrency(totalQ3Revenue)}
            </span>
          </div>
          <div className="p-3.5 rounded bg-indigo-50 border border-indigo-200">
            <span className="text-indigo-700 block mb-1 font-semibold">Rank #1 Most Changed Region</span>
            <span className="text-sm font-bold text-indigo-950">
              {mostChangedRegion.region} ({mostChangedRegion.dollarChange >= 0 ? '+' : ''}{formatCurrency(mostChangedRegion.dollarChange)})
            </span>
          </div>
        </div>

        {/* Mathematical formulas */}
        <div className="mt-5 p-4 rounded-md bg-slate-900 text-slate-200 text-xs font-mono space-y-1.5">
          <div className="text-slate-400 font-sans font-semibold text-[11px] uppercase tracking-wider mb-1">
            Mathematical Equations Enforced
          </div>
          <div>Dollar Variance = Q3 Revenue - Q2 Revenue</div>
          <div>Absolute Dollar Variance = |Q3 Revenue - Q2 Revenue| (Rank Metric)</div>
          <div>Percentage Variance = ((Q3 Revenue - Q2 Revenue) / Q2 Revenue) * 100</div>
          <div>Weighted Avg Discount % = Sum(Discount_pct * Revenue) / Sum(Revenue)</div>
        </div>
      </div>

      {/* Ranked Variance Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            All Regions Ranked by Q2 → Q3 Variance Magnitude
          </h4>
          <span className="text-xs text-slate-500">
            Ranked by Absolute Dollar Delta (|Δ$|)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th scope="col" className="py-2.5 px-4">Rank</th>
                <th scope="col" className="py-2.5 px-4">Region</th>
                <th scope="col" className="py-2.5 px-4 text-right">Q2 Revenue</th>
                <th scope="col" className="py-2.5 px-4 text-right">Q3 Revenue</th>
                <th scope="col" className="py-2.5 px-4 text-right">Net Dollar Delta</th>
                <th scope="col" className="py-2.5 px-4 text-right">% Delta</th>
                <th scope="col" className="py-2.5 px-4 text-right">Unit Delta</th>
                <th scope="col" className="py-2.5 px-4 text-right">Discount Delta</th>
                <th scope="col" className="py-2.5 px-4">Primary Product Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {analyses.map((row, index) => {
                const isPositive = row.dollarChange >= 0;
                const isTop = index === 0;
                const topProd = row.topProductDrivers[0];

                return (
                  <tr
                    key={row.region}
                    className={`hover:bg-slate-50 transition-colors ${isTop ? 'bg-indigo-50/40 font-semibold' : ''}`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-800 font-sans">
                      #{index + 1}
                      {isTop && (
                        <span className="ml-1 text-[10px] text-indigo-700 bg-indigo-100 px-1 py-0.2 rounded font-sans">
                          Top
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      {row.region}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatCurrency(row.q2Revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatCurrency(row.q3Revenue)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPositive ? (
                          <ArrowUp className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-rose-600" />
                        )}
                        <span className={isPositive ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {isPositive ? '+' : ''}{formatCurrency(row.dollarChange)}
                        </span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-right ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isPositive ? '+' : ''}{row.pctChange.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {row.unitChange >= 0 ? '+' : ''}{row.unitChange.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {row.discountChangePctPoints >= 0 ? '+' : ''}{row.discountChangePctPoints.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700">
                      {topProd ? (
                        <span>
                          {topProd.product} ({topProd.revChange >= 0 ? '+' : ''}{formatCurrency(topProd.revChange)})
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
