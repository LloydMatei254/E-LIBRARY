import React, { useState, useEffect } from 'react';
import { Banknote, CheckCircle2, AlertCircle } from 'lucide-react';
import { Fine } from '../../types';
import { api } from '../../services/api';

export const FinesView: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getFines();
      setFines(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void loadData();
    const unsubscribe = api.subscribeToAdminUpdates(() => {
      if (active) void loadData();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const notify = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleMarkPaid = async (fineId: number) => {
    try {
      await api.payFine(fineId);
      notify(`Fine #${fineId} marked as PAID.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Payment update failed');
    }
  };

  const totalOutstanding = fines
    .filter((f) => f.status === 'unpaid')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalCollected = fines
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      {msg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Fines & Penalties Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliverable 2 Database Schema Table 9 (<code className="font-mono">fines</code>) · Overdue Rate: KES 50.00/day
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-2xs">
            <span className="text-slate-500">Total Unpaid: </span>
            <span className="font-bold font-mono text-rose-600">KES {totalOutstanding.toFixed(2)}</span>
          </div>
          <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-2xs">
            <span className="text-slate-500">Collected: </span>
            <span className="font-bold font-mono text-emerald-700">KES {totalCollected.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-5">Fine ID</th>
              <th className="py-3 px-5">Patron</th>
              <th className="py-3 px-5">Book Title</th>
              <th className="py-3 px-5">Reason</th>
              <th className="py-3 px-5 font-mono">Amount</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  Loading fines from database...
                </td>
              </tr>
            ) : fines.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No penalty fines assessed. All loans compliant.
                </td>
              </tr>
            ) : (
              fines.map((f) => {
                const isPaid = f.status === 'paid';
                return (
                  <tr key={f.fine_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-500 font-medium">
                      #{f.fine_id}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {f.member_name}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 max-w-xs truncate">
                      {f.book_title}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {f.reason}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      KES {f.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {!isPaid ? (
                        <button
                          onClick={() => handleMarkPaid(f.fine_id)}
                          className="px-3 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-2xs whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Paid {f.paid_date}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
