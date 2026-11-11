import React, { useState, useEffect } from 'react';
import { User, BookOpen, AlertCircle, CheckCircle2, Clock, CreditCard, Bookmark } from 'lucide-react';
import { Member, Borrowing, Fine, Reservation } from '../types';
import { api } from '../services/api';

interface MemberPortalProps {
  member: Member;
  onNavigateToCatalog: () => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({ member, onNavigateToCatalog }) => {
  const [loans, setLoans] = useState<Borrowing[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allLoans, memFines, memReservations] = await Promise.all([
        api.getActiveLoans(),
        api.getFines(member.member_id),
        api.getReservations(member.member_id),
      ]);
      setLoans(allLoans.filter((l) => l.member_id === member.member_id));
      setFines(memFines);
      setReservations(memReservations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [member.member_id]);

  const handlePayFine = async (fineId: number) => {
    try {
      await api.payFine(fineId);
      setMsg('Fine payment successfully processed.');
      setTimeout(() => setMsg(null), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    }
  };

  const unpaidFinesTotal = fines
    .filter((f) => f.status === 'unpaid')
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Member Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
            {member.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{member.full_name}</h1>
              <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {member.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Member ID: {member.member_code || `M${member.member_id.toString().padStart(4, '0')}`} · {member.email}
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToCatalog}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
        >
          Browse Book Catalog
        </button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Borrowed Books</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {loans.length} / 5
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Unpaid Fines</span>
          <div className={`text-2xl font-bold font-mono mt-1 ${unpaidFinesTotal > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            KES {unpaidFinesTotal.toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Pending Reservations</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {reservations.length}
          </div>
        </div>
      </div>

      {/* Currently Borrowed Books */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            My Borrowed Books
          </h2>
        </div>

        {loans.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            You do not currently have any books on loan.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {loans.map((loan) => (
              <div key={loan.borrowing_id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{loan.book_title}</h4>
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <span className="font-mono">{loan.book_isbn}</span>
                    <span aria-hidden="true">·</span>
                    <span>Issued: {loan.issue_date}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-700">Due: {loan.due_date}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                    loan.status === 'overdue' || loan.is_overdue
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {loan.status === 'overdue' || loan.is_overdue ? 'Overdue' : 'On loan'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outstanding Fines Table */}
      {fines.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Assessed Penalties & Fines
            </h2>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {fines.map((fine) => (
              <div key={fine.fine_id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-800">{fine.book_title}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">{fine.reason} · Issued {fine.issued_date}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold font-mono text-slate-900">
                    KES {fine.amount.toFixed(2)}
                  </span>
                  {fine.status === 'unpaid' ? (
                    <button
                      onClick={() => handlePayFine(fine.fine_id)}
                      className="px-3 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-2xs"
                    >
                      Pay Fine
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Paid
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
