import React from 'react';
import { Upload, FileSpreadsheet, Sparkles, RefreshCw } from 'lucide-react';

interface TopBarProps {
  activeTab: 'overview' | 'chart' | 'table' | 'orders' | 'audit';
  setActiveTab: (tab: 'overview' | 'chart' | 'table' | 'orders' | 'audit') => void;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  hasData: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onLoadSample,
  hasData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single line, no decorative tags) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-sm">
            V
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Vantage Sales Analytics
          </span>
        </div>

        {/* Zone 2: 4-5 single-line nav links with active state */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Executive Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'chart'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Revenue Chart
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'table'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Matrix Table
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'orders'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Raw Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'audit'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Calculation Audit
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
