import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, TrendingUp, BookOpen, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export const ReportsView: React.FC = () => {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getReports();
        setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadCsv = () => {
    if (!reports) return;
    let csv = `Metric,Value\n`;
    csv += `Active Circulating Loans,${reports.active_loans}\n`;
    csv += `Successfully Returned Loans,${reports.returned_loans}\n`;
    csv += `Overdue Loans,${reports.overdue_loans}\n`;
    csv += `Total Collected Penalties (KES),${reports.total_collected_fines}\n`;
    csv += `Outstanding Penalties (KES),${reports.outstanding_fines}\n\n`;
    csv += `Top Borrowed Titles,Circulation Count\n`;
    reports.top_borrowed_books?.forEach((b: any) => {
      csv += `"${b.title}",${b.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `library_circulation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Circulation & Audit Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational telemetry and analytical aggregates from Python SQLite engine
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{exported ? 'Downloaded!' : 'Export CSV Report'}</span>
        </button>
      </div>

      {loading || !reports ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Generating circulation telemetry...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Circulation</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {reports.active_loans} loans
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Completed Returns</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {reports.returned_loans} books
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Overdue Breaches</span>
              <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
                {reports.overdue_loans} loans
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Fines Collected</span>
              <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
                KES {Number(reports.total_collected_fines).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Top Borrowed Titles */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Most Borrowed Academic Titles
            </h3>
            <div className="space-y-3">
              {reports.top_borrowed_books?.map((b: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-400 w-4">#{idx + 1}</span>
                    <span className="font-medium text-slate-800">{b.title}</span>
                  </div>
                  <span className="font-mono text-indigo-600 font-semibold">{b.count} times issued</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
