import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Reservation } from '../../types';
import { api } from '../../services/api';

export const ReservationsView: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getReservations();
      setReservations(data);
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

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateReservationStatus(id, status);
      notify(`Reservation #${id} updated to ${status}.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Reservations & Holds Queue
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deliverable 2 Database Schema Table 8 (<code className="font-mono">reservations</code>)
        </p>
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
              <th className="py-3 px-5">Hold ID</th>
              <th className="py-3 px-5">Patron Member</th>
              <th className="py-3 px-5">Book Requested</th>
              <th className="py-3 px-5">Reserved Date</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  Loading reservations from database...
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No active hold reservations currently in queue.
                </td>
              </tr>
            ) : (
              reservations.map((r) => (
                <tr key={r.reservation_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-slate-500 font-medium">
                    #{r.reservation_id}
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-900">
                    {r.member_name}
                  </td>
                  <td className="py-3.5 px-5 text-slate-700 font-medium max-w-xs truncate">
                    {r.book_title}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                    {r.reservation_date?.slice(0, 10)}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        r.status === 'fulfilled'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {r.status === 'pending' && (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(r.reservation_id, 'fulfilled')}
                          className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                        >
                          Fulfill
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r.reservation_id, 'cancelled')}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
