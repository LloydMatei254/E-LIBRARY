import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, AlertTriangle, ArrowUpRight, CheckCircle2, TrendingUp, Database } from 'lucide-react';
import { DashboardMetrics, Admin } from '../types';
import { api } from '../services/api';
import { isDemoMode } from '../services/supabaseClient';

const schemaTables = [
  {
    name: 'admins',
    storage: 'Logical staff records · public.profiles',
    fields: [
      ['admin_id', 'bigint', 'PK · identity (member_id)'],
      ['full_name', 'text', 'NOT NULL'],
      ['email', 'text', 'NOT NULL · UNIQUE'],
      ['role', 'text', 'NOT NULL · librarian or super_admin'],
      ['password_hash', '—', 'Handled by Supabase Auth; not in the library table'],
      ['created_at', 'timestamptz', 'Maps to registered_at · DEFAULT now()'],
    ],
  },
  {
    name: 'members',
    storage: 'Logical member records · public.profiles',
    fields: [
      ['member_id', 'bigint', 'PK · identity'],
      ['full_name', 'text', 'NOT NULL'],
      ['email', 'text', 'NOT NULL · UNIQUE'],
      ['phone', 'text', "DEFAULT '' · can be empty"],
      ['password_hash', '—', 'Handled by Supabase Auth; not in the library table'],
      ['status', 'text', "NOT NULL · active, suspended, or inactive · DEFAULT 'active'"],
      ['registered_at', 'timestamptz', 'NOT NULL · DEFAULT now()'],
    ],
  },
  {
    name: 'categories',
    storage: 'Physical table · public.categories',
    fields: [
      ['category_id', 'bigint', 'PK · identity'],
      ['category_name', 'text', 'NOT NULL · UNIQUE'],
      ['description', 'text', "NOT NULL · DEFAULT ''"],
    ],
  },
  {
    name: 'authors',
    storage: 'Physical table · public.authors',
    fields: [
      ['author_id', 'bigint', 'PK · identity'],
      ['author_name', 'text', 'NOT NULL · UNIQUE'],
      ['biography', 'text', "NOT NULL · DEFAULT ''"],
    ],
  },
] as const;

interface AdminDashboardProps {
  adminUser: Admin;
  onNavigateSubview: (subview: 'books' | 'members' | 'circulation') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminUser, onNavigateSubview }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api.getDashboard();
        if (active) {
          setMetrics(data);
          setLoadError(null);
        }
      } catch (err) {
        console.error('Could not load the admin dashboard.', err);
        if (active) setLoadError(err instanceof Error ? err.message : 'Could not load live dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const unsubscribe = api.subscribeToAdminUpdates(() => {
      if (active) void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (loading && !metrics) {
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

  if (!metrics) {
    return (
      <div role="alert" className="mx-auto max-w-7xl rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        <p className="font-semibold">Dashboard data could not be loaded.</p>
        <p className="mt-1">{loadError ?? 'Check your Supabase connection and try again.'}</p>
      </div>
    );
  }

  const trendData = metrics.borrowing_trends;
  const maxTrend = Math.max(...trendData.map((trend) => trend.count), 1);
  const trendColors = ['bg-[#d1ced8]', 'bg-[#a7a1b5]', 'bg-[#817995]', 'bg-[#51436d]', 'bg-[#26134c]'];
  const categoryTotal = metrics.category_distribution.reduce((total, category) => total + category.count, 0);
  const topCategory = metrics.category_distribution.reduce(
    (top, category) => category.count > (top?.count ?? 0) ? category : top,
    metrics.category_distribution[0],
  );
  const topCategoryShare = categoryTotal > 0 && topCategory
    ? Math.round((topCategory.count / categoryTotal) * 100)
    : 0;

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
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isDemoMode ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {isDemoMode ? 'Demo data' : 'Live Supabase data'}
          </span>
          <button
            onClick={() => onNavigateSubview('circulation')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            Quick Issue / Return
          </button>
        </div>
      </div>

      {loadError && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Could not refresh the dashboard. Showing the most recently available data. {loadError}
        </div>
      )}

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

          <div className="mt-4 flex h-36 items-end justify-between gap-1.5 rounded-sm bg-slate-50 p-2 sm:gap-2">
            {trendData.map((trend, idx) => {
              const heightPct = trend.count === 0 ? 0 : Math.max(12, Math.round((trend.count / maxTrend) * 100));
              return (
                <div
                  key={trend.period}
                  role="img"
                  aria-label={`${trend.period}: ${trend.count} borrowings`}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <div
                    className="mb-1 text-[10px] font-medium tabular-nums text-slate-500"
                  >
                    {trend.count}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full min-h-0 ${trendColors[idx % trendColors.length]} transition-all duration-500`}
                  />
                  <span className="mt-1 whitespace-nowrap text-[9px] text-slate-500">{trend.period}</span>
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
                    strokeDashoffset={251.2 * (1 - topCategoryShare / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold font-mono text-slate-900">{topCategoryShare}%</span>
                  <span className="max-w-24 truncate text-[10px] text-slate-500">{topCategory?.name ?? 'No categories'}</span>
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

      <section className="space-y-4" aria-labelledby="database-schema-heading">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-700" />
            <h2 id="database-schema-heading" className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Database schema
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Supabase PostgreSQL core tables and constraints. Staff and member accounts share <code>public.profiles</code> and are distinguished by role; credentials are managed by Supabase Auth.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {schemaTables.map((table) => (
            <article key={table.name} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="font-mono text-sm font-bold text-indigo-900">{table.name}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">{table.storage}</p>
              </header>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Column</th>
                      <th className="px-4 py-2 font-semibold">PostgreSQL type</th>
                      <th className="px-4 py-2 font-semibold">Key / constraints</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {table.fields.map(([column, type, constraints]) => (
                      <tr key={column}>
                        <td className="whitespace-nowrap px-4 py-2 font-mono font-medium text-slate-800">{column}</td>
                        <td className="whitespace-nowrap px-4 py-2 font-mono text-slate-600">{type}</td>
                        <td className="px-4 py-2 text-slate-600">{constraints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>

        <p className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-900">
          Relationships: one category has many books; books and authors connect through <code>book_authors</code>; members borrow and reserve books; staff are recorded on loans through <code>issued_by</code>.
        </p>
      </section>
    </div>
  );
};
