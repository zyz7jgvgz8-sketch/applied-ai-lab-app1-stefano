import React, { useState, useMemo } from 'react';
import { SalesOrder } from '../types/sales';
import { formatCurrency } from '../utils/calculations';
import { Search, Filter, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface RawOrdersTableProps {
  orders: SalesOrder[];
}

export const RawOrdersTable: React.FC<RawOrdersTableProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const quarters = useMemo(() => Array.from(new Set(orders.map(o => o.quarter))).sort(), [orders]);
  const regions = useMemo(() => Array.from(new Set(orders.map(o => o.region))).sort(), [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (selectedQuarter !== 'all' && order.quarter.toUpperCase() !== selectedQuarter.toUpperCase()) return false;
      if (selectedRegion !== 'all' && order.region.toLowerCase() !== selectedRegion.toLowerCase()) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches =
          order.region.toLowerCase().includes(term) ||
          order.product.toLowerCase().includes(term) ||
          order.channel.toLowerCase().includes(term) ||
          order.quarter.toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [orders, selectedQuarter, selectedRegion, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pageOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with Search and Filters */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Raw Sales Orders Log
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="font-mono tabular-nums">{orders.length} total orders</span>
            <span aria-hidden="true">·</span>
            <span>{filteredOrders.length} matching filters</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search product, channel..."
              className="text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 w-44"
            />
          </div>

          {/* Quarter Filter */}
          <select
            value={selectedQuarter}
            onChange={e => {
              setSelectedQuarter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Quarters</option>
            {quarters.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>

          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={e => {
              setSelectedRegion(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Regions</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
              <th scope="col" className="py-2.5 px-4">Quarter</th>
              <th scope="col" className="py-2.5 px-4">Region</th>
              <th scope="col" className="py-2.5 px-4">Channel</th>
              <th scope="col" className="py-2.5 px-4">Product</th>
              <th scope="col" className="py-2.5 px-4 text-right">Units</th>
              <th scope="col" className="py-2.5 px-4 text-right">Discount %</th>
              <th scope="col" className="py-2.5 px-4 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
            {pageOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                  No orders match the selected filters.
                </td>
              </tr>
            ) : (
              pageOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-900 font-sans">
                    {order.quarter}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-sans font-medium">
                    {order.region}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans">
                    {order.channel}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-sans font-medium">
                    {order.product}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-700">
                    {order.units.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-600">
                    {order.discount_pct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(order.revenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
