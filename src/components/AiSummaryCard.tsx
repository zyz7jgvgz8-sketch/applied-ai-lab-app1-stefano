import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, ChevronDown, ChevronUp, Calculator, ShieldCheck } from 'lucide-react';
import { RegionVarianceAnalysis, SummaryCalculationFacts } from '../types/sales';
import { formatCurrency } from '../utils/calculations';

interface AiSummaryCardProps {
  summaryText: string;
  isLoading: boolean;
  onRegenerate: () => void;
  mostChangedRegion: RegionVarianceAnalysis | null;
  facts: SummaryCalculationFacts | null;
  source: 'gemini' | 'deterministic' | null;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  summaryText,
  isLoading,
  onRegenerate,
  mostChangedRegion,
  facts,
  source,
}) => {
  const [copied, setCopied] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [viewMode, setViewMode] = useState<'paragraph' | 'sentences'>('paragraph');

  const handleCopy = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split summary into sentences for scrutiny
  const splitSentences = (text: string): string[] => {
    if (!text) return [];
    // Match sentences ending with period, exclamation, or question mark
    const matches = text.match(/[^.!?]+[.!?]+/g);
    return matches ? matches.map(s => s.trim()) : [text];
  };

  const sentences = splitSentences(summaryText);

  if (!mostChangedRegion) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span>AI Variance Analysis</span>
          <span aria-hidden="true">·</span>
          <span>Awaiting Q2 and Q3 Data</span>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Upload a sales CSV containing both Q2 and Q3 records to identify the region with the greatest variance and generate the grounded executive summary.
        </p>
      </div>
    );
  }

  const isGrowth = mostChangedRegion.dollarChange >= 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header zone */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              AI Regional Variance Summary (Q2 → Q3)
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Strictly 3-Sentence Structure</span>
              <span aria-hidden="true">·</span>
              <span>100% Calculated Grounding</span>
              {source && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{source === 'gemini' ? 'Gemini 3.8 Flash' : 'Deterministic Engine'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('paragraph')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'paragraph' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Paragraph
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sentences')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'sentences' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              By Sentence
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!summaryText || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Copy summary to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={onRegenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Re-run AI analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Main summary body */}
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3 py-2">
            <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-11/12 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-4/5 animate-pulse" />
          </div>
        ) : viewMode === 'paragraph' ? (
          <div className="text-base leading-relaxed text-slate-800 font-normal">
            <p className="max-w-4xl text-slate-900">
              {summaryText}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sentences.map((sentence, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-md bg-slate-50 border border-slate-100 flex items-start gap-3"
              >
                <span className="font-mono text-xs font-bold text-slate-400 mt-0.5 tabular-nums">
                  {`0${idx + 1}`}
                </span>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {idx === 0
                      ? 'Sentence 1: Region Identification & Variance Amount'
                      : idx === 1
                      ? 'Sentence 2: Product & Channel Drivers'
                      : 'Sentence 3: Operational Volume & Discount Impact'}
                  </div>
                  <p className="text-sm text-slate-900 leading-snug">
                    {sentence}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick quantitative anchor banner */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-500">Most Changed Region</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {mostChangedRegion.region}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Q2 → Q3 Dollar Delta</div>
            <div className={`text-sm font-bold tabular-nums font-mono mt-0.5 ${isGrowth ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isGrowth ? '+' : ''}{formatCurrency(mostChangedRegion.dollarChange)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Percentage Shift</div>
            <div className={`text-sm font-bold tabular-nums font-mono mt-0.5 ${isGrowth ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isGrowth ? '+' : ''}{mostChangedRegion.pctChange.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Sales Volume Shift</div>
            <div className="text-sm font-bold tabular-nums font-mono text-slate-900 mt-0.5">
              {mostChangedRegion.unitChange >= 0 ? '+' : ''}{mostChangedRegion.unitChange.toLocaleString()} units
            </div>
          </div>
        </div>

        {/* Provenance breakdown toggle */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowProvenance(!showProvenance)}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-500" />
            <span>{showProvenance ? 'Hide Calculated Provenance Metrics' : 'Inspect Numbers Provided to AI'}</span>
            {showProvenance ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Zero-Hallucination Guardrail</span>
          </div>
        </div>

        {/* Provenance details drawer */}
        {showProvenance && (
          <div className="mt-4 p-4 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-slate-900 block mb-1">
                  1. Regional Revenue Benchmark ({mostChangedRegion.region})
                </span>
                <ul className="space-y-1 font-mono tabular-nums text-slate-600">
                  <li>· Q2 Revenue: {formatCurrency(mostChangedRegion.q2Revenue)}</li>
                  <li>· Q3 Revenue: {formatCurrency(mostChangedRegion.q3Revenue)}</li>
                  <li>· Net Dollar Variance: {isGrowth ? '+' : ''}{formatCurrency(mostChangedRegion.dollarChange)}</li>
                  <li>· Net % Variance: {isGrowth ? '+' : ''}{mostChangedRegion.pctChange.toFixed(2)}%</li>
                  <li>· Units Sold: {mostChangedRegion.q2Units.toLocaleString()} (Q2) → {mostChangedRegion.q3Units.toLocaleString()} (Q3)</li>
                  <li>· Avg Discount: {mostChangedRegion.q2AvgDiscountPct.toFixed(1)}% (Q2) → {mostChangedRegion.q3AvgDiscountPct.toFixed(1)}% (Q3)</li>
                </ul>
              </div>

              <div>
                <span className="font-semibold text-slate-900 block mb-1">
                  2. Top Calculated Product Drivers ({mostChangedRegion.region})
                </span>
                <ul className="space-y-1 font-mono tabular-nums text-slate-600">
                  {mostChangedRegion.topProductDrivers.map((p, i) => (
                    <li key={i}>
                      · {p.product}: {p.revChange >= 0 ? '+' : ''}{formatCurrency(p.revChange)} (Q2: {formatCurrency(p.q2Rev)} → Q3: {formatCurrency(p.q3Rev)})
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-900 block mb-1">
                3. Top Calculated Channel Drivers ({mostChangedRegion.region})
              </span>
              <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono tabular-nums text-slate-600">
                {mostChangedRegion.topChannelDrivers.map((c, i) => (
                  <span key={i}>
                    · {c.channel}: {c.revChange >= 0 ? '+' : ''}{formatCurrency(c.revChange)} (Q2: {formatCurrency(c.q2Rev)} → Q3: {formatCurrency(c.q3Rev)})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
