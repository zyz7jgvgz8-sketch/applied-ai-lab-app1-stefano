/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { AiSummaryCard } from './components/AiSummaryCard';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';
import { FileUploader } from './components/FileUploader';
import { RawOrdersTable } from './components/RawOrdersTable';
import { CalculationAudit } from './components/CalculationAuditModal';
import { parseSalesCSV } from './utils/csvParser';
import { buildRegionQuarterMatrix, analyzeQ2ToQ3Variance, formatCurrency } from './utils/calculations';
import { SAMPLE_SALES_CSV } from './utils/sampleData';
import { SalesOrder, RegionQuarterMatrix, RegionVarianceAnalysis, SummaryCalculationFacts } from './types/sales';
import { AlertCircle, DollarSign, Package, Percent, Globe2, BarChart2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'table' | 'orders' | 'audit'>('overview');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [rawCsv, setRawCsv] = useState<string>(SAMPLE_SALES_CSV);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<'gemini' | 'deterministic' | null>(null);

  // Parse CSV and update data
  const handleLoadCsv = useCallback((csvText: string) => {
    const result = parseSalesCSV(csvText);
    setParseErrors(result.errors);
    setParseWarnings(result.warnings);

    if (result.orders.length > 0) {
      setRawCsv(csvText);
      setOrders(result.orders);
    }
  }, []);

  // Initial load with sample data
  useEffect(() => {
    handleLoadCsv(SAMPLE_SALES_CSV);
  }, [handleLoadCsv]);

  // Compute matrix
  const matrix: RegionQuarterMatrix = useMemo(() => {
    return buildRegionQuarterMatrix(orders);
  }, [orders]);

  // Compute Q2 to Q3 variance analysis
  const varianceAnalysis = useMemo(() => {
    return analyzeQ2ToQ3Variance(orders);
  }, [orders]);

  const { analyses, mostChangedRegion, calculationFacts } = varianceAnalysis;

  // Request summary from server API or fallback
  const fetchSummary = useCallback(async (facts: SummaryCalculationFacts | null) => {
    if (!facts || !facts.mostChangedRegion) {
      setAiSummary('');
      setAiSource(null);
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facts),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setAiSummary(data.summary || '');
      setAiSource(data.source || 'gemini');
    } catch (err) {
      console.warn('Backend API unavailable or error, generating local grounded summary:', err);
      // Deterministic fallback matching exact 3-sentence requirement
      const m = facts.mostChangedRegion;
      const formatCur = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
      const dirVerb = m.dollarChange >= 0 ? 'surged' : 'contracted';
      const sign = m.dollarChange >= 0 ? '+' : '-';

      const s1 = `${m.region} registered the largest financial variance between Q2 and Q3, as quarterly revenue ${dirVerb} by ${formatCur(m.dollarChange)} (${sign}${Math.abs(m.pctChange).toFixed(1)}%), moving from ${formatCur(m.q2Revenue)} in Q2 to ${formatCur(m.q3Revenue)} in Q3.`;

      let s2 = '';
      if (m.topProductDrivers.length > 0 && m.topChannelDrivers.length > 0) {
        const p = m.topProductDrivers[0];
        const c = m.topChannelDrivers[0];
        const pSign = p.revChange >= 0 ? '+' : '-';
        const cSign = c.revChange >= 0 ? '+' : '-';
        s2 = `This shift was primarily driven by ${p.product} revenue shifting by ${pSign}${formatCur(p.revChange)} (from ${formatCur(p.q2Rev)} in Q2 to ${formatCur(p.q3Rev)} in Q3), paired with a ${cSign}${formatCur(c.revChange)} variance across the ${c.channel} distribution channel.`;
      } else {
        s2 = `This variance was primarily driven by strategic realignment across regional sales operations between the two fiscal quarters.`;
      }

      const uVerb = m.unitChange >= 0 ? 'expanded' : 'declined';
      const uSign = m.unitChange >= 0 ? '+' : '-';
      const s3 = `Operationally, total sales volume ${uVerb} by ${uSign}${Math.abs(m.unitChange).toLocaleString('en-US')} units (from ${m.q2Units.toLocaleString('en-US')} in Q2 to ${m.q3Units.toLocaleString('en-US')} in Q3), alongside an average discount level moving from ${m.q2AvgDiscountPct.toFixed(1)}% to ${m.q3AvgDiscountPct.toFixed(1)}%.`;

      setAiSummary(`${s1} ${s2} ${s3}`);
      setAiSource('deterministic');
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Fetch summary when calculation facts change
  useEffect(() => {
    if (calculationFacts) {
      fetchSummary(calculationFacts);
    }
  }, [calculationFacts, fetchSummary]);

  // Overall metric totals
  const totalUnits = useMemo(() => {
    return orders.reduce((acc, curr) => acc + curr.units, 0);
  }, [orders]);

  const weightedAvgDiscount = useMemo(() => {
    const totalRev = orders.reduce((acc, curr) => acc + curr.revenue, 0);
    if (totalRev === 0) return 0;
    const discountSum = orders.reduce((acc, curr) => acc + (curr.discount_pct * curr.revenue), 0);
    return discountSum / totalRev;
  }, [orders]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Bar adhering to Top Bar Contract */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onLoadSample={() => handleLoadCsv(SAMPLE_SALES_CSV)}
        hasData={orders.length > 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Errors Banner if any */}
        {parseErrors.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>CSV Parsing Error</span>
            </div>
            {parseErrors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        {/* Executive KPI Banner */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <DollarSign className="w-3.5 h-3.5 text-slate-600" />
              <span>Total Gross Revenue</span>
            </div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(matrix.grandTotal)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all uploaded orders</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Globe2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Active Regions</span>
            </div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
              {matrix.regions.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {matrix.regions.join(', ')}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <BarChart2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Quarters Covered</span>
            </div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
              {matrix.quarters.length} Quarters
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {matrix.quarters.join(' · ')}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span>Total Units Sold</span>
            </div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
              {totalUnits.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {orders.length} order lines
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Percent className="w-3.5 h-3.5 text-slate-600" />
              <span>Avg Weighted Discount</span>
            </div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
              {weightedAvgDiscount.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Weighted by order volume</div>
          </div>
        </section>

        {/* Tab 1: Executive Overview (AI 3-Sentence Summary + Chart + Table) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Summary Card */}
            <AiSummaryCard
              summaryText={aiSummary}
              isLoading={aiLoading}
              onRegenerate={() => fetchSummary(calculationFacts)}
              mostChangedRegion={mostChangedRegion}
              facts={calculationFacts}
              source={aiSource}
            />

            {/* Total Revenue by Region & Quarter: Chart & Table */}
            <div className="space-y-6">
              <RevenueChart matrix={matrix} />
              <RevenueTable
                matrix={matrix}
                orders={orders}
                highlightRegion={mostChangedRegion?.region}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Revenue Chart view */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            <RevenueChart matrix={matrix} />
          </div>
        )}

        {/* Tab 3: Matrix Table view */}
        {activeTab === 'table' && (
          <div className="space-y-6">
            <RevenueTable
              matrix={matrix}
              orders={orders}
              highlightRegion={mostChangedRegion?.region}
            />
          </div>
        )}

        {/* Tab 4: Raw Orders Table view */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <RawOrdersTable orders={orders} />
          </div>
        )}

        {/* Tab 5: Calculation Audit & Provenance view */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <CalculationAudit analyses={analyses} facts={calculationFacts} />
          </div>
        )}
      </main>

      {/* CSV Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl">
            <FileUploader
              onDataLoaded={text => {
                handleLoadCsv(text);
                setIsUploadOpen(false);
              }}
              onClose={() => setIsUploadOpen(false)}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Vantage Sales Analytics</span>
            <span aria-hidden="true">·</span>
            <span>Quarterly Variance &amp; Revenue Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Columns: quarter, region, channel, product, units, discount_pct, revenue</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
