import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, AlertTriangle, ArrowUpRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { DashboardMetrics, Admin } from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  adminUser: Admin;
  onNavigateSubview: (subview: 'books' | 'members' | 'circulation') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminUser, onNavigateSubview }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getDashboard();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Max value for bar chart height normalization
  const maxTrend = Math.max(...metrics.borrowing_trends.map((t) => t.count), 100);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Berzowanley Central Management · Logged in as {adminUser.full_name} ({adminUser.role})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateSubview('circulation')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            Quick Issue / Return
          </button>
        </div>
      </div>

      {/* 4 KPI Cards strictly matching Deliverable 2 Page 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Books */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block">
            TOTAL BOOKS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {metrics.total_books.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({metrics.total_copies} physical copies)
            </span>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block">
            MEMBERS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {metrics.members.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Active Patrons
            </span>
          </div>
        </div>

        {/* Books Issued */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block">
            BOOKS ISSUED
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {metrics.books_issued.toLocaleString()}
            </span>
            <span className="text-xs text-indigo-600 font-medium">
              In Circulation
            </span>
          </div>
        </div>

        {/* Overdue Books */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block">
            OVERDUE BOOKS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono tabular-nums">
              {metrics.overdue_books.toLocaleString()}
            </span>
            <span className="text-xs text-rose-600 font-medium">
              Action Required
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row matching Deliverable 2 Page 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Borrowing Trends Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              BORROWING TRENDS
            </h3>
            <span className="text-xs text-slate-500">Monthly Circulation Volume</span>
          </div>

          <div className="h-52 flex items-end justify-between gap-4 pt-6 pb-2 px-4 border-b border-slate-100">
            {metrics.borrowing_trends.map((t, idx) => {
              const heightPct = Math.round((t.count / maxTrend) * 100);
              // Palette shades matching screenshot purple/slate gradient
              const bgColors = [
                'bg-slate-300',
                'bg-slate-400',
                'bg-indigo-400',
                'bg-indigo-700',
                'bg-indigo-900',
              ];
              const col = bgColors[idx % bgColors.length];

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[11px] font-mono font-medium text-slate-600 tabular-nums">
                    {t.count}
                  </span>
                  <div className="w-full max-w-[50px] bg-slate-100 rounded-t-sm h-36 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full ${col} rounded-t-sm transition-all duration-500`}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 mt-1">
                    {t.period}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              CATEGORY DISTRIBUTION
            </h3>

            {/* Circular Gauge / Donut Graphic matching wireframe */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#312e81"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="62.8"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold font-mono text-slate-900">75%</span>
                  <span className="text-[10px] text-slate-500">Tech & Sci</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {metrics.category_distribution.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{cat.name}</span>
                <span className="font-mono font-medium text-slate-900">{cat.count} titles</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table strictly matching Deliverable 2 Page 2 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Recent Transactions
          </h3>
          <button
            onClick={() => onNavigateSubview('circulation')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-5">MEMBER</th>
                <th className="py-3 px-5">BOOK</th>
                <th className="py-3 px-5">ACTION</th>
                <th className="py-3 px-5 text-right">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.recent_transactions.map((tx, idx) => {
                const isReturned = tx.action.toLowerCase() === 'returned';
                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 font-medium text-slate-800">
                      {tx.member}
                    </td>
                    <td className="py-3 px-5 text-slate-600 max-w-xs truncate">
                      {tx.book}
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          isReturned
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {tx.action}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-slate-500">
                      {tx.date}
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
