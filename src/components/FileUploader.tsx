import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Download, Database, X } from 'lucide-react';
import { SAMPLE_SALES_CSV, downloadSampleCsvFile } from '../utils/sampleData';

interface FileUploaderProps {
  onDataLoaded: (csvContent: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

const REQUIRED_COLUMNS = [
  { name: 'quarter', desc: 'e.g., Q1, Q2, Q3, Q4' },
  { name: 'region', desc: 'e.g., North America, EMEA, APAC' },
  { name: 'channel', desc: 'e.g., Direct Enterprise, Online, Reseller' },
  { name: 'product', desc: 'e.g., Enterprise Cloud, Hardware Hub' },
  { name: 'units', desc: 'Quantity of units sold (e.g., 140)' },
  { name: 'discount_pct', desc: 'Discount percentage (e.g., 8.5% or 0.085)' },
  { name: 'revenue', desc: 'Total sales revenue in $ (e.g., 420000)' },
];

export const FileUploader: React.FC<FileUploaderProps> = ({
  onDataLoaded,
  onClose,
  isModal = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setLocalError('Please upload a valid CSV file (.csv or .txt).');
      return;
    }

    setLocalError(null);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      if (text) {
        onDataLoaded(text);
        if (onClose) onClose();
      }
    };
    reader.onerror = () => {
      setLocalError('Failed to read the file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) {
      setLocalError('Please paste CSV text into the field.');
      return;
    }
    setLocalError(null);
    onDataLoaded(pasteContent.trim());
    if (onClose) onClose();
  };

  const handleLoadSample = () => {
    setLocalError(null);
    onDataLoaded(SAMPLE_SALES_CSV);
    if (onClose) onClose();
  };

  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden ${isModal ? 'max-w-2xl w-full' : ''}`}>
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Upload Sales Orders CSV
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Import order records with required columns to trigger regional variance and AI insights.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Error message */}
        {localError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{localError}</span>
          </div>
        )}

        {/* Mode switcher tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`text-xs font-semibold pb-1.5 transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            File Upload / Drag &amp; Drop
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`text-xs font-semibold pb-1.5 transition-colors border-b-2 ${
              activeTab === 'paste'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Raw CSV Text
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
              accept=".csv,.txt"
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-900">
              Drop your sales orders CSV here, or <span className="text-indigo-600 underline">browse files</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Supports CSV with standard headers: quarter, region, channel, product, units, discount_pct, revenue
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={6}
              value={pasteContent}
              onChange={e => setPasteContent(e.target.value)}
              placeholder="quarter,region,channel,product,units,discount_pct,revenue&#10;Q2,North America,Direct,Enterprise Cloud,100,5.0,250000&#10;Q3,North America,Direct,Enterprise Cloud,120,5.0,300000"
              className="w-full text-xs font-mono p-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
              >
                Parse &amp; Analyze Pasted Data
              </button>
            </div>
          </div>
        )}

        {/* Required columns schema grid */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Required CSV Schema (7 Columns)</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Case-insensitive (e.g. &apos;west&apos; and &apos;West&apos; unite into &apos;West&apos;)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
            {REQUIRED_COLUMNS.map(col => (
              <div key={col.name} className="p-2 bg-white rounded border border-slate-200">
                <span className="font-mono font-bold text-slate-900 block">{col.name}</span>
                <span className="text-slate-500 text-[10px]">{col.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pre-packaged sample buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={downloadSampleCsvFile}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Sample CSV Template</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <span>Load Demo Corporate Sales Data (Q1–Q4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
